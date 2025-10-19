import { ApiResponse } from './client';
import { MasterAccount } from '../../types/MasterAccount';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const masterAccountsService = {
  // Get all master accounts for a specific firm
  async getAll(firmId: string): Promise<ApiResponse<MasterAccount[]>> {
    try {
      const { data, error } = await supabase
        .from('master_accounts')
        .select('*')
        .eq('firm_id', firmId)
        .order('master_account_name', { ascending: true });

      if (error) {
        console.error('Error fetching master accounts:', error);
        return { error: error.message };
      }

      // Transform snake_case to camelCase and map status field
      const mappedData = (data || []).map((item: any) => {
        const camelCased = mapToCamelCase(item);
        return {
          ...camelCased,
          isActive: item.master_account_status === 'Active',
          createdDate: item.created_at,
          lastModifiedDate: item.updated_at,
          assignedAccountIds: [], // Will be populated by joining with accounts table if needed
        };
      });

      return { data: mappedData };
    } catch (err) {
      console.error('Unexpected error fetching master accounts:', err);
      return { error: 'Failed to fetch master accounts' };
    }
  },

  // Get master account by ID
  async getById(id: string): Promise<ApiResponse<MasterAccount>> {
    try {
      const { data, error } = await supabase
        .from('master_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching master account:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Master account not found' };
      }

      // Transform to camelCase
      const camelCased = mapToCamelCase(data);
      const masterAccount: MasterAccount = {
        ...camelCased,
        isActive: data.master_account_status === 'Active',
        createdDate: data.created_at,
        lastModifiedDate: data.updated_at,
        assignedAccountIds: [],
      };

      return { data: masterAccount };
    } catch (err) {
      console.error('Unexpected error fetching master account:', err);
      return { error: 'Failed to fetch master account' };
    }
  },

  // Create new master account
  async create(masterAccount: Partial<MasterAccount>, firmId: string): Promise<ApiResponse<MasterAccount>> {
    try {
      // Map from MasterAccount type to database schema
      const dbRecord = {
        firm_id: firmId,
        master_account_number: masterAccount.masterAccountNumber,
        master_account_name: masterAccount.masterAccountName,
        master_account_status: masterAccount.isActive ? 'Active' : 'Inactive',
        office: masterAccount.office,
        description: masterAccount.description,
        total_aum: masterAccount.totalAUM || 0,
        number_of_accounts: masterAccount.numberOfAccounts || 0,
      };

      const { data, error } = await supabase
        .from('master_accounts')
        .insert([dbRecord])
        .select()
        .single();

      if (error) {
        console.error('Error creating master account:', error);
        return { error: error.message };
      }

      // Transform response
      const camelCased = mapToCamelCase(data);
      const result: MasterAccount = {
        ...camelCased,
        isActive: data.master_account_status === 'Active',
        createdDate: data.created_at,
        lastModifiedDate: data.updated_at,
        assignedAccountIds: [],
      };

      return { data: result };
    } catch (err) {
      console.error('Unexpected error creating master account:', err);
      return { error: 'Failed to create master account' };
    }
  },

  // Update master account
  async update(id: string, updates: Partial<MasterAccount>): Promise<ApiResponse<MasterAccount>> {
    try {
      // Map updates to database schema
      const dbUpdates: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.masterAccountNumber !== undefined) {
        dbUpdates.master_account_number = updates.masterAccountNumber;
      }
      if (updates.masterAccountName !== undefined) {
        dbUpdates.master_account_name = updates.masterAccountName;
      }
      if (updates.isActive !== undefined) {
        dbUpdates.master_account_status = updates.isActive ? 'Active' : 'Inactive';
      }
      if (updates.office !== undefined) {
        dbUpdates.office = updates.office;
      }
      if (updates.description !== undefined) {
        dbUpdates.description = updates.description;
      }
      if (updates.totalAUM !== undefined) {
        dbUpdates.total_aum = updates.totalAUM;
      }
      if (updates.numberOfAccounts !== undefined) {
        dbUpdates.number_of_accounts = updates.numberOfAccounts;
      }

      const { data, error } = await supabase
        .from('master_accounts')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating master account:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Master account not found' };
      }

      // Transform response
      const camelCased = mapToCamelCase(data);
      const result: MasterAccount = {
        ...camelCased,
        isActive: data.master_account_status === 'Active',
        createdDate: data.created_at,
        lastModifiedDate: data.updated_at,
        assignedAccountIds: [],
      };

      return { data: result };
    } catch (err) {
      console.error('Unexpected error updating master account:', err);
      return { error: 'Failed to update master account' };
    }
  },

  // Delete master account
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      // First, unassign any accounts from this master account
      const { error: unassignError } = await supabase
        .from('accounts')
        .update({ master_account_id: null })
        .eq('master_account_id', id);

      if (unassignError) {
        console.error('Error unassigning accounts:', unassignError);
        return { error: 'Failed to unassign accounts from master account' };
      }

      // Then delete the master account
      const { error } = await supabase
        .from('master_accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting master account:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting master account:', err);
      return { error: 'Failed to delete master account' };
    }
  },

  // Get accounts assigned to a master account
  async getAssignedAccounts(masterAccountId: string): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, account_number, account_name, portfolio_value')
        .eq('master_account_id', masterAccountId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching assigned accounts:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase(data || []) };
    } catch (err) {
      console.error('Unexpected error fetching assigned accounts:', err);
      return { error: 'Failed to fetch assigned accounts' };
    }
  },
};
