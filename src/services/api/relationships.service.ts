import { ApiResponse } from './client';
import { Relationship } from '../../types/Relationship';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const relationshipsService = {
  // Get all relationships
  async getAll(firmId: string): Promise<ApiResponse<Relationship[]>> {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('firm_id', firmId)
        .order('relationship_name', { ascending: true });

      if (error) {
        console.error('Error fetching relationships:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Relationship[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching relationships:', err);
      return { error: 'Failed to fetch relationships' };
    }
  },

  // Get relationship by ID
  async getById(id: string): Promise<ApiResponse<Relationship>> {
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching relationship:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Relationship not found' };
      }

      return { data: mapToCamelCase<Relationship>(data) };
    } catch (err) {
      console.error('Unexpected error fetching relationship:', err);
      return { error: 'Failed to fetch relationship' };
    }
  },

  // Create new relationship
  async create(relationship: Partial<Relationship>): Promise<ApiResponse<Relationship>> {
    try {
      const snakeCaseRelationship = mapToSnakeCase(relationship);
      const { data, error } = await supabase
        .from('relationships')
        .insert([snakeCaseRelationship])
        .select()
        .single();

      if (error) {
        console.error('Error creating relationship:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Relationship>(data) };
    } catch (err) {
      console.error('Unexpected error creating relationship:', err);
      return { error: 'Failed to create relationship' };
    }
  },

  // Update relationship
  async update(id: string, updates: Partial<Relationship>): Promise<ApiResponse<Relationship>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('relationships')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating relationship:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Relationship not found' };
      }

      return { data: mapToCamelCase<Relationship>(data) };
    } catch (err) {
      console.error('Unexpected error updating relationship:', err);
      return { error: 'Failed to update relationship' };
    }
  },

  // Delete relationship
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('relationships')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting relationship:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting relationship:', err);
      return { error: 'Failed to delete relationship' };
    }
  },
};
