import { supabase } from '../../lib/supabase';
import { UserProfile, UserProfileFormData, UserPreferencesFormData, PermissionName, InviteUserData } from '../../types/User';
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
  },

  /**
   * Invite a new user to the firm
   */
  async inviteUser(firmId: string, inviteData: InviteUserData): Promise<ApiResponse<{ success: boolean }>> {
    try {
      // Get the current user's firm domain for validation
      const { data: firmData, error: firmError } = await supabase
        .from('firms')
        .select('firm_domain, firm_name')
        .eq('id', firmId)
        .single();

      if (firmError || !firmData) {
        return { data: null, error: 'Firm not found' };
      }

      // Check if email domain matches firm domain
      const emailDomain = inviteData.email.split('@')[1];
      if (emailDomain !== firmData.firm_domain) {
        return {
          data: null,
          error: `Email domain must be @${firmData.firm_domain} to join this firm`
        };
      }

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', inviteData.email)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        return { data: null, error: checkError.message };
      }

      if (existingUser) {
        return { data: null, error: 'User with this email already exists' };
      }

      // Create invitation record
      const invitationData = {
        firm_id: firmId,
        email: inviteData.email,
        role: inviteData.role,
        full_name: inviteData.fullName || null,
        job_title: inviteData.jobTitle || null,
        department: inviteData.department || null,
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };

      const { error: insertError } = await supabase
        .from('user_invitations')
        .insert(invitationData);

      if (insertError) {
        console.error('Error creating invitation:', insertError);
        return { data: null, error: insertError.message };
      }

      // In a production environment, you would send an email here
      // For now, we'll just create the invitation record
      // The user can sign up normally with Google OAuth, and the invitation
      // data will be used to auto-populate their profile

      // Log the invitation action
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('audit_logs')
          .insert({
            user_id: user.id,
            firm_id: firmId,
            action: 'user.invite',
            resource_type: 'user',
            details: {
              invited_email: inviteData.email,
              role: inviteData.role,
            }
          });
      }

      return {
        data: { success: true },
        error: null
      };
    } catch (err: any) {
      console.error('Error inviting user:', err);
      return { data: null, error: err.message || 'Failed to send invitation' };
    }
  },

  /**
   * Upload user avatar
   */
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Delete old avatar if exists
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Extract filename from URL and delete from storage
        const oldFileName = profile.avatar_url.split('/').pop();
        if (oldFileName) {
          await supabase.storage
            .from('user-assets')
            .remove([`avatars/${oldFileName}`]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('user-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return { data: null, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath);

      // Update user profile with new avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile with avatar:', updateError);
        return { data: null, error: updateError.message };
      }

      return { data: { avatarUrl: publicUrl }, error: null };
    } catch (err: any) {
      console.error('Error in uploadAvatar:', err);
      return { data: null, error: err.message || 'Failed to upload avatar' };
    }
  },

  /**
   * Remove user avatar
   */
  async removeAvatar(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Get current avatar URL
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      if (profile?.avatar_url) {
        // Extract filename from URL and delete from storage
        const fileName = profile.avatar_url.split('/').pop();
        if (fileName) {
          const { error: deleteError } = await supabase.storage
            .from('user-assets')
            .remove([`avatars/${fileName}`]);

          if (deleteError) {
            console.error('Error deleting avatar from storage:', deleteError);
            // Continue anyway to remove URL from profile
          }
        }
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error removing avatar from profile:', updateError);
        return { data: null, error: updateError.message };
      }

      return { data: { success: true }, error: null };
    } catch (err: any) {
      console.error('Error in removeAvatar:', err);
      return { data: null, error: err.message || 'Failed to remove avatar' };
    }
  }
};
