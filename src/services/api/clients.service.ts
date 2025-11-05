import { ApiResponse } from './client';
import { Client } from '../../types/Client';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const clientsService = {
  // Get all clients
  async getAll(): Promise<ApiResponse<Client[]>> {
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
          .from('clients')
          .select('*')
          .order('full_legal_name', { ascending: true })
          .range(start, end);

        if (error) {
          console.error('Error fetching clients:', error);
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
          console.warn('[clientsService.getAll] Hit safety limit of 100 pages');
          break;
        }
      }

      return { data: mapToCamelCase<Client[]>(allData) || [] };
    } catch (err) {
      console.error('Unexpected error fetching clients:', err);
      return { error: 'Failed to fetch clients' };
    }
  },

  // Get client by ID
  async getById(id: string): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching client:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Client not found' };
      }

      return { data: mapToCamelCase<Client>(data) };
    } catch (err) {
      console.error('Unexpected error fetching client:', err);
      return { error: 'Failed to fetch client' };
    }
  },

  // Create new client
  async create(client: Partial<Client>): Promise<ApiResponse<Client>> {
    try {
      const snakeCaseClient = mapToSnakeCase(client);
      const { data, error } = await supabase
        .from('clients')
        .insert([snakeCaseClient])
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Client>(data) };
    } catch (err) {
      console.error('Unexpected error creating client:', err);
      return { error: 'Failed to create client' };
    }
  },

  // Update client
  async update(id: string, updates: Partial<Client>): Promise<ApiResponse<Client>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('clients')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Client not found' };
      }

      return { data: mapToCamelCase<Client>(data) };
    } catch (err) {
      console.error('Unexpected error updating client:', err);
      return { error: 'Failed to update client' };
    }
  },

  // Delete client
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting client:', err);
      return { error: 'Failed to delete client' };
    }
  },
};
