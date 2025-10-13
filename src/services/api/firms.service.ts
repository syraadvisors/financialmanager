import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface FirmSettings {
  id: string;
  firmName: string;
  firmDomain: string;
  legalName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  logoUrl?: string;
  primaryColor?: string;
  defaultInvoiceTerms?: number;
  defaultInvoiceMessage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FirmSettingsFormData {
  firmName?: string;
  legalName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  primaryColor?: string;
  defaultInvoiceTerms?: number;
  defaultInvoiceMessage?: string;
}

export const firmsService = {
  /**
   * Get current user's firm settings
   */
  async getFirmSettings(): Promise<ApiResponse<FirmSettings>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Get user's firm_id from their profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.firm_id) {
        console.error('Error fetching user profile:', profileError);
        return { data: null, error: 'Unable to determine firm' };
      }

      // Get firm settings
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .eq('id', profile.firm_id)
        .single();

      if (error) {
        console.error('Error fetching firm settings:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<FirmSettings>(data), error: null };
    } catch (err: any) {
      console.error('Error in getFirmSettings:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Update firm settings
   */
  async updateFirmSettings(firmId: string, settingsData: Partial<FirmSettingsFormData>): Promise<ApiResponse<FirmSettings>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('firms')
        .update(mapToSnakeCase(settingsData))
        .eq('id', firmId)
        .select()
        .single();

      if (error) {
        console.error('Error updating firm settings:', error);
        return { data: null, error: error.message };
      }

      return { data: mapToCamelCase<FirmSettings>(data), error: null };
    } catch (err: any) {
      console.error('Error in updateFirmSettings:', err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Upload firm logo
   */
  async uploadLogo(firmId: string, file: File): Promise<ApiResponse<{ logoUrl: string }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Generate unique filename with timestamp
      const fileExt = file.name.split('.').pop();
      const fileName = `${firmId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Get current firm settings to check for existing logo
      const { data: firm } = await supabase
        .from('firms')
        .select('logo_url')
        .eq('id', firmId)
        .single();

      if (firm?.logo_url) {
        // Extract filename from URL and delete from storage
        const oldFileName = firm.logo_url.split('/').pop();
        if (oldFileName && oldFileName.includes(firmId)) {
          await supabase.storage
            .from('firm-assets')
            .remove([`logos/${oldFileName}`]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('firm-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading logo:', uploadError);
        return { data: null, error: uploadError.message };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('firm-assets')
        .getPublicUrl(filePath);

      // Update firm with new logo URL
      const { error: updateError } = await supabase
        .from('firms')
        .update({ logo_url: publicUrl })
        .eq('id', firmId);

      if (updateError) {
        console.error('Error updating firm with logo:', updateError);
        return { data: null, error: updateError.message };
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          firm_id: firmId,
          action: 'firm.logo.upload',
          resource_type: 'firm',
          resource_id: firmId,
          details: { logo_url: publicUrl }
        });

      return { data: { logoUrl: publicUrl }, error: null };
    } catch (err: any) {
      console.error('Error in uploadLogo:', err);
      return { data: null, error: err.message || 'Failed to upload logo' };
    }
  },

  /**
   * Remove firm logo
   */
  async removeLogo(firmId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: 'Not authenticated' };
      }

      // Get current logo URL
      const { data: firm } = await supabase
        .from('firms')
        .select('logo_url')
        .eq('id', firmId)
        .single();

      if (firm?.logo_url) {
        // Extract filename from URL and delete from storage
        const fileName = firm.logo_url.split('/').pop();
        if (fileName && fileName.includes(firmId)) {
          const { error: deleteError } = await supabase.storage
            .from('firm-assets')
            .remove([`logos/${fileName}`]);

          if (deleteError) {
            console.error('Error deleting logo from storage:', deleteError);
            // Continue anyway to remove URL from database
          }
        }
      }

      // Update firm to remove logo URL
      const { error: updateError } = await supabase
        .from('firms')
        .update({ logo_url: null })
        .eq('id', firmId);

      if (updateError) {
        console.error('Error removing logo from firm:', updateError);
        return { data: null, error: updateError.message };
      }

      // Log the action
      await supabase
        .from('audit_logs')
        .insert({
          user_id: user.id,
          firm_id: firmId,
          action: 'firm.logo.remove',
          resource_type: 'firm',
          resource_id: firmId,
          details: {}
        });

      return { data: { success: true }, error: null };
    } catch (err: any) {
      console.error('Error in removeLogo:', err);
      return { data: null, error: err.message || 'Failed to remove logo' };
    }
  }
};
