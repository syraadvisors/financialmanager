import { ApiResponse } from './client';
import { Client } from '../../types/Client';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const clientsService = {
  // Get all clients
  async getAll(): Promise<ApiResponse<Client[]>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('full_legal_name', { ascending: true });

      if (error) {
        console.error('Error fetching clients:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Client[]>(data) || [] };
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
