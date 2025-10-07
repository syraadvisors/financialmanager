import { ApiResponse } from './client';
import { Account } from '../../types/Account';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const accountsService = {
  // Get all accounts
  async getAll(firmId: string): Promise<ApiResponse<Account[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('firm_id', firmId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching accounts:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Account[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching accounts:', err);
      return { error: 'Failed to fetch accounts' };
    }
  },

  // Get account by ID
  async getById(id: string): Promise<ApiResponse<Account>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching account:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Account not found' };
      }

      return { data: mapToCamelCase<Account>(data) };
    } catch (err) {
      console.error('Unexpected error fetching account:', err);
      return { error: 'Failed to fetch account' };
    }
  },

  // Get accounts by client ID
  async getByClientId(clientId: string): Promise<ApiResponse<Account[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('client_id', clientId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching accounts by client:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Account[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching accounts by client:', err);
      return { error: 'Failed to fetch accounts' };
    }
  },

  // Get accounts by household ID
  async getByHouseholdId(householdId: string): Promise<ApiResponse<Account[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('household_id', householdId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching accounts by household:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Account[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching accounts by household:', err);
      return { error: 'Failed to fetch accounts' };
    }
  },

  // Create new account
  async create(account: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      const snakeCaseAccount = mapToSnakeCase(account);
      const { data, error } = await supabase
        .from('accounts')
        .insert([snakeCaseAccount])
        .select()
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Account>(data) };
    } catch (err) {
      console.error('Unexpected error creating account:', err);
      return { error: 'Failed to create account' };
    }
  },

  // Update account
  async update(id: string, updates: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('accounts')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Account not found' };
      }

      return { data: mapToCamelCase<Account>(data) };
    } catch (err) {
      console.error('Unexpected error updating account:', err);
      return { error: 'Failed to update account' };
    }
  },

  // Delete account
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting account:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting account:', err);
      return { error: 'Failed to delete account' };
    }
  },

  // Link account to client
  async linkToClient(accountId: string, clientId: string): Promise<ApiResponse<Account>> {
    return this.update(accountId, { clientId });
  },

  // Unlink account from client
  async unlinkFromClient(accountId: string): Promise<ApiResponse<Account>> {
    return this.update(accountId, { clientId: undefined });
  },
};
