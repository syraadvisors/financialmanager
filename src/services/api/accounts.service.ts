import { ApiResponse } from './client';
import { Account } from '../../types/Account';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

// Custom field mapping for accounts table
// Maps TypeScript field names to database column names
const accountFieldMap: Record<string, string> = {
  currentBalance: 'portfolio_value',
  openDate: 'account_opened_date',
  closeDate: 'account_closed_date',
};

// Convert Account object to database format with custom field mapping
function accountToDb(account: any): any {
  const snakeCase = mapToSnakeCase(account);
  const mapped: any = {};

  for (const [key, value] of Object.entries(snakeCase)) {
    // Check if there's a custom mapping for this field
    const dbField = accountFieldMap[key] || key;
    mapped[dbField] = value;
  }

  return mapped;
}

// Convert database result to Account object with custom field mapping
function dbToAccount(dbData: any): any {
  // First, reverse the custom mappings
  const reversed: any = {};
  const reverseMap: Record<string, string> = Object.fromEntries(
    Object.entries(accountFieldMap).map(([k, v]) => [v, k])
  );

  for (const [key, value] of Object.entries(dbData)) {
    const tsField = reverseMap[key] || key;
    reversed[tsField] = value;
  }

  return mapToCamelCase(reversed);
}

export const accountsService = {
  // Get all accounts
  async getAll(firmId: string): Promise<ApiResponse<Account[]>> {
    try {
      // Supabase has a hard limit of 1000 rows per query, so we need to paginate
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let currentPage = 0;
      let hasMore = true;

      while (hasMore) {
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('accounts')
          .select(`
            *,
            clients:client_id (
              full_legal_name
            )
          `)
          .eq('firm_id', firmId)
          .order('account_number', { ascending: true })
          .range(start, end);

        if (error) {
          console.error('Error fetching accounts:', error);
          return { error: error.message };
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
        }

        // If we got less than PAGE_SIZE records, we've reached the end
        hasMore = data && data.length === PAGE_SIZE;
        currentPage++;

        // Safety check to prevent infinite loops
        if (currentPage > 100) {
          console.warn('[accountsService.getAll] Hit safety limit of 100 pages');
          break;
        }
      }

      // Map the data and populate clientName from the join
      const accounts = allData.map((account: any) => {
        const mapped = dbToAccount(account);
        // Populate clientName from the joined clients table
        if (account.clients && account.clients.full_legal_name) {
          mapped.clientName = account.clients.full_legal_name;
        }
        return mapped;
      });

      return { data: accounts };
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

      return { data: dbToAccount(data) };
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
        .select(`
          *,
          clients:client_id (
            full_legal_name
          )
        `)
        .eq('client_id', clientId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching accounts by client:', error);
        return { error: error.message };
      }

      // Map the data and populate clientName from the join
      const accounts = (data || []).map((account: any) => {
        const mapped = dbToAccount(account);
        if (account.clients && account.clients.full_legal_name) {
          mapped.clientName = account.clients.full_legal_name;
        }
        return mapped;
      });

      return { data: accounts };
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

      return { data: (data || []).map(dbToAccount) };
    } catch (err) {
      console.error('Unexpected error fetching accounts by household:', err);
      return { error: 'Failed to fetch accounts' };
    }
  },

  // Create new account
  async create(account: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      // Remove computed/display fields that don't exist in the database
      const { clientName, householdName, feeScheduleName, ...accountData } = account;

      const dbAccount = accountToDb(accountData);
      const { data, error } = await supabase
        .from('accounts')
        .insert([dbAccount])
        .select()
        .single();

      if (error) {
        console.error('Error creating account:', error);
        return { error: error.message };
      }

      return { data: dbToAccount(data) };
    } catch (err) {
      console.error('Unexpected error creating account:', err);
      return { error: 'Failed to create account' };
    }
  },

  // Update account
  async update(id: string, updates: Partial<Account>): Promise<ApiResponse<Account>> {
    try {
      // Remove computed/display fields that don't exist in the database
      const { clientName, householdName, feeScheduleName, ...accountData } = updates;

      const dbUpdates = accountToDb(accountData);
      const { data, error } = await supabase
        .from('accounts')
        .update(dbUpdates)
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

      return { data: dbToAccount(data) };
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

  // Get unassigned accounts (accounts with no client_id or joint accounts with only one client)
  async getUnassigned(firmId: string): Promise<ApiResponse<Account[]>> {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select(`
          *,
          clients:client_id (
            full_legal_name
          )
        `)
        .eq('firm_id', firmId)
        .or('client_id.is.null,account_type.eq.Joint')
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching unassigned accounts:', error);
        return { error: error.message };
      }

      // Filter to only show accounts that are truly unassigned or joint accounts with less than 2 clients
      // For joint accounts, we need to check how many clients are already linked
      // For now, return all accounts without client_id plus joint accounts
      const unassignedAccounts = (data || []).filter((account: any) => {
        // Include if no client_id
        if (!account.client_id) return true;
        // Include joint accounts (they can have up to 2 clients)
        if (account.account_type === 'Joint') return true;
        return false;
      });

      // Map the data and populate clientName from the join
      const accounts = unassignedAccounts.map((account: any) => {
        const mapped = dbToAccount(account);
        if (account.clients && account.clients.full_legal_name) {
          mapped.clientName = account.clients.full_legal_name;
        }
        return mapped;
      });

      return { data: accounts };
    } catch (err) {
      console.error('Unexpected error fetching unassigned accounts:', err);
      return { error: 'Failed to fetch unassigned accounts' };
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
