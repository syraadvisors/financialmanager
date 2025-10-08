import { supabase } from '../../lib/supabase';
import { UserProfile, UserProfileFormData, UserPreferencesFormData, PermissionName } from '../../types/User';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export const usersService = {
  /**
   * Get current user's profile
   */
  async getCurrentUserProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in getCurrentUserProfile:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Get all user profiles in the current firm
   */
  async getAllInFirm(firmId: string): Promise<ApiResponse<UserProfile[]>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user profiles:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile[]>(data) || [], error: null };
    } catch (err: any) {
      console.error('Error in getAllInFirm:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Update current user's profile
   */
  async updateProfile(profileData: Partial<UserProfileFormData>): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .update(mapToSnakeCase(profileData))
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in updateProfile:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferencesFormData>): Promise<ApiResponse<UserProfile>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Get current preferences
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('preferences')
        .eq('id', user.id)
        .single();

      const updatedPreferences = {
        ...currentProfile?.preferences,
        ...mapToSnakeCase(preferences)
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .update({ preferences: updatedPreferences })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating preferences:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in updatePreferences:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user role:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in updateUserRole:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Update user status (admin only)
   */
  async updateUserStatus(userId: string, status: string): Promise<ApiResponse<UserProfile>> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ status })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user status:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in updateUserStatus:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Check if current user has a specific permission
   */
  async hasPermission(permission: PermissionName): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('user_has_permission', {
        permission_name: permission
      });

      if (error) {
        console.error('Error checking permission:', error);
        return false;
      }

      return data === true;
    } catch (err: any) {
      console.error('Error in hasPermission:', err);
      return false;
    }
  },

  /**
   * Get user's role
   */
  async getUserRole(): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_role');

      if (error) {
        console.error('Error getting user role:', error);
        return null;
      }

      return data;
    } catch (err: any) {
      console.error('Error in getUserRole:', err);
      return null;
    }
  },

  /**
   * Create or update user profile (called after OAuth login)
   */
  async upsertProfile(userId: string, email: string, firmId: string, metadata?: any): Promise<ApiResponse<UserProfile>> {
    try {
      const profileData = {
        id: userId,
        firm_id: firmId,
        email: email,
        full_name: metadata?.full_name || metadata?.name || null,
        avatar_url: metadata?.avatar_url || metadata?.picture || null,
        email_verified: metadata?.email_verified || false
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profileData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Error upserting user profile:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<UserProfile>(data), error: null };
    } catch (err: any) {
      console.error('Error in upsertProfile:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Log user login
   */
  async logLogin(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get current login count
      const { data: currentProfile } = await supabase
        .from('user_profiles')
        .select('login_count')
        .eq('id', user.id)
        .single();

      // Update last login and increment count
      await supabase
        .from('user_profiles')
        .update({
          last_login_at: new Date().toISOString(),
          login_count: (currentProfile?.login_count || 0) + 1
        })
        .eq('id', user.id);

      // Log to audit table
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('firm_id, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            firm_id: profile.firm_id,
            action: 'login',
            details: { email: profile.email }
          });
      }
    } catch (err: any) {
      console.error('Error logging login:', err);
    }
  }
};
