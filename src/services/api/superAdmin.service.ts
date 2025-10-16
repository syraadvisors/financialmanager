/**
 * Super Admin Service
 *
 * Provides services for super-admin operations including:
 * - User impersonation
 * - Cross-firm data access
 * - Firm management
 * - Super admin management
 */

import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';
import { safeServiceCall, handleSupabaseError, handleAuthError } from '../../utils/apiErrorHandler';
import { ApiResponse, ApiErrorCode, HttpStatusCode } from '../../types/api';
import { UserProfile, ImpersonationSession } from '../../types/User';
import { FirmSettings } from './firms.service';

interface ImpersonationSessionRecord {
  id: string;
  createdAt: Date;
  endedAt: Date | null;
  superAdminId: string;
  superAdminEmail: string;
  impersonatedUserId: string;
  impersonatedUserEmail: string;
  impersonatedUserFirmId: string | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  isActive: boolean;
}

interface SuperAdminStats {
  totalFirms: number;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSuperAdmins: number;
  recentImpersonations: number;
}

export const superAdminService = {
  /**
   * Check if current user is a super admin
   */
  async isSuperAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) return false;
      return data.role === 'super_admin';
    } catch {
      return false;
    }
  },

  /**
   * Get all firms across the system
   */
  async getAllFirms(): Promise<ApiResponse<FirmSettings[]>> {
    return safeServiceCall(
      async () => {
        const { data, error } = await supabase
          .from('firms')
          .select('*')
          .order('firm_name');

        if (error) throw error;
        return { data: mapToCamelCase<FirmSettings[]>(data), error: null };
      },
      {
        resourceType: 'Firms',
        successMessage: 'Firms loaded successfully'
      }
    );
  },

  /**
   * Get all users across all firms
   */
  async getAllUsers(filters?: {
    firmId?: string;
    role?: string;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<UserProfile[]>> {
    try {
      let query = supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.firmId) {
        query = query.eq('firm_id', filters.firmId);
      }

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.search) {
        query = query.or(`email.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseError(error, 'Failed to fetch users');
      }

      return {
        success: true,
        data: mapToCamelCase<UserProfile[]>(data) || [],
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to fetch users',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Get a specific user by ID (cross-firm)
   */
  async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    return safeServiceCall(
      async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) throw error;
        return { data, error: null };
      },
      {
        resourceType: 'User',
        resourceId: userId
      }
    );
  },

  /**
   * Update any user's profile (cross-firm)
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<ApiResponse<UserProfile>> {
    return safeServiceCall(
      async () => {
        const { data, error } = await supabase
          .from('user_profiles')
          .update(mapToSnakeCase(updates))
          .eq('id', userId)
          .select()
          .single();

        if (error) throw error;
        return { data: mapToCamelCase<UserProfile>(data), error: null };
      },
      {
        resourceType: 'User',
        resourceId: userId,
        successMessage: 'User profile updated successfully'
      }
    );
  },

  /**
   * Create a new super admin
   */
  async createSuperAdmin(data: {
    email: string;
    fullName: string;
  }): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        return handleAuthError();
      }

      // Check if current user is super admin
      const isSuperAdmin = await this.isSuperAdmin();
      if (!isSuperAdmin) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.INSUFFICIENT_PERMISSIONS,
            message: 'Only super admins can create other super admins',
            statusCode: HttpStatusCode.FORBIDDEN
          },
          statusCode: HttpStatusCode.FORBIDDEN
        };
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', data.email)
        .maybeSingle();

      if (existingUser) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.ALREADY_EXISTS,
            message: 'A user with this email already exists',
            statusCode: HttpStatusCode.CONFLICT
          },
          statusCode: HttpStatusCode.CONFLICT
        };
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: currentUser.id,
          action: 'super_admin.create',
          resource_type: 'user',
          details: {
            targetEmail: data.email,
            fullName: data.fullName
          }
        });

      return {
        success: true,
        data: {
          success: true,
          message: `Super admin invitation will be sent to ${data.email}. They will need to sign up and then be granted super admin privileges.`
        },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to create super admin',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Start impersonating a user
   */
  async startImpersonation(
    targetUserId: string,
    reason?: string
  ): Promise<ApiResponse<ImpersonationSession>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return handleAuthError();
      }

      // Call database function to start impersonation
      const { data, error } = await supabase.rpc('start_impersonation', {
        target_user_id: targetUserId,
        impersonation_reason: reason || null
      });

      if (error) {
        return handleSupabaseError(error, 'Failed to start impersonation');
      }

      // Get the created session
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .eq('id', data)
        .single();

      if (sessionError || !session) {
        return {
          success: false,
          error: {
            code: ApiErrorCode.NOT_FOUND,
            message: 'Impersonation session not found',
            statusCode: HttpStatusCode.NOT_FOUND
          },
          statusCode: HttpStatusCode.NOT_FOUND
        };
      }

      return {
        success: true,
        data: {
          superAdminId: session.super_admin_id,
          superAdminEmail: session.super_admin_email,
          impersonatedUserId: session.impersonated_user_id,
          impersonatedUserEmail: session.impersonated_user_email,
          impersonatedUserFirmId: session.impersonated_user_firm_id,
          startedAt: new Date(session.created_at),
          reason: session.reason
        },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to start impersonation',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * End current impersonation session
   */
  async endImpersonation(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return handleAuthError();
      }

      const { data, error } = await supabase.rpc('end_impersonation');

      if (error) {
        return handleSupabaseError(error, 'Failed to end impersonation');
      }

      return {
        success: true,
        data: { success: data },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to end impersonation',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Get active impersonation session
   */
  async getActiveImpersonation(): Promise<ApiResponse<ImpersonationSession | null>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return handleAuthError();
      }

      const { data, error } = await supabase.rpc('get_active_impersonation_session');

      if (error) {
        return handleSupabaseError(error, 'Failed to get impersonation session');
      }

      if (!data || data.length === 0) {
        return {
          success: true,
          data: null,
          statusCode: 200
        };
      }

      const session = data[0];
      return {
        success: true,
        data: {
          superAdminId: session.super_admin_id,
          superAdminEmail: session.super_admin_email,
          impersonatedUserId: session.impersonated_user_id,
          impersonatedUserEmail: session.impersonated_user_email,
          impersonatedUserFirmId: session.impersonated_user_firm_id,
          startedAt: new Date(session.started_at),
          reason: session.reason
        },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to get impersonation session',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Get impersonation history
   */
  async getImpersonationHistory(filters?: {
    superAdminId?: string;
    targetUserId?: string;
    limit?: number;
  }): Promise<ApiResponse<ImpersonationSessionRecord[]>> {
    try {
      let query = supabase
        .from('impersonation_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.superAdminId) {
        query = query.eq('super_admin_id', filters.superAdminId);
      }

      if (filters?.targetUserId) {
        query = query.eq('impersonated_user_id', filters.targetUserId);
      }

      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseError(error, 'Failed to fetch impersonation history');
      }

      return {
        success: true,
        data: mapToCamelCase<ImpersonationSessionRecord[]>(data) || [],
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to fetch impersonation history',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Get super admin dashboard statistics
   */
  async getStats(): Promise<ApiResponse<SuperAdminStats>> {
    try {
      // Get firm count
      const { count: firmCount } = await supabase
        .from('firms')
        .select('*', { count: 'exact', head: true });

      // Get user counts
      const { count: userCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      const { count: activeUserCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: suspendedUserCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'suspended');

      const { count: superAdminCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      // Get recent impersonations (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: recentImpersonations } = await supabase
        .from('impersonation_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      return {
        success: true,
        data: {
          totalFirms: firmCount || 0,
          totalUsers: userCount || 0,
          activeUsers: activeUserCount || 0,
          suspendedUsers: suspendedUserCount || 0,
          totalSuperAdmins: superAdminCount || 0,
          recentImpersonations: recentImpersonations || 0
        },
        statusCode: 200
      };
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: ApiErrorCode.UNKNOWN_ERROR,
          message: err.message || 'Failed to fetch stats',
          statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
        },
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR
      };
    }
  },

  /**
   * Update firm settings (cross-firm)
   */
  async updateFirm(
    firmId: string,
    updates: Partial<FirmSettings>
  ): Promise<ApiResponse<FirmSettings>> {
    return safeServiceCall(
      async () => {
        const { data, error } = await supabase
          .from('firms')
          .update(mapToSnakeCase(updates))
          .eq('id', firmId)
          .select()
          .single();

        if (error) throw error;
        return { data: mapToCamelCase<FirmSettings>(data), error: null };
      },
      {
        resourceType: 'Firm',
        resourceId: firmId,
        successMessage: 'Firm updated successfully'
      }
    );
  },

  /**
   * Delete a firm and all associated data
   */
  async deleteFirm(firmId: string): Promise<ApiResponse<{ success: boolean }>> {
    return safeServiceCall(
      async () => {
        const { error } = await supabase
          .from('firms')
          .delete()
          .eq('id', firmId);

        if (error) throw error;
        return { data: { success: true }, error: null };
      },
      {
        resourceType: 'Firm',
        resourceId: firmId,
        successMessage: 'Firm deleted successfully'
      }
    );
  }
};
