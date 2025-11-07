import { ApiResponse } from './client';
import { Household } from '../../types/Household';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const householdsService = {
  // Get all households
  async getAll(firmId: string): Promise<ApiResponse<Household[]>> {
    try {
      // Fetch ALL households using pagination to avoid 1000 record limit
      let allHouseholds: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('households')
          .select('*')
          .eq('firm_id', firmId)
          .order('household_name', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('Error fetching households:', error);
          return { error: error.message };
        }

        if (data && data.length > 0) {
          allHouseholds = allHouseholds.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return { data: mapToCamelCase<Household[]>(allHouseholds) || [] };
    } catch (err) {
      console.error('Unexpected error fetching households:', err);
      return { error: 'Failed to fetch households' };
    }
  },

  // Get household by ID
  async getById(id: string): Promise<ApiResponse<Household>> {
    try {
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching household:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Household not found' };
      }

      return { data: mapToCamelCase<Household>(data) };
    } catch (err) {
      console.error('Unexpected error fetching household:', err);
      return { error: 'Failed to fetch household' };
    }
  },

  // Get households by relationship ID
  async getByRelationshipId(relationshipId: string): Promise<ApiResponse<Household[]>> {
    try {
      // Fetch ALL households using pagination to avoid 1000 record limit
      let allHouseholds: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await supabase
          .from('households')
          .select('*')
          .eq('relationship_id', relationshipId)
          .order('household_name', { ascending: true })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) {
          console.error('Error fetching households by relationship:', error);
          return { error: error.message };
        }

        if (data && data.length > 0) {
          allHouseholds = allHouseholds.concat(data);
          page++;
          hasMore = data.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      return { data: mapToCamelCase<Household[]>(allHouseholds) || [] };
    } catch (err) {
      console.error('Unexpected error fetching households by relationship:', err);
      return { error: 'Failed to fetch households' };
    }
  },

  // Create new household
  async create(household: Partial<Household>): Promise<ApiResponse<Household>> {
    try {
      const snakeCaseHousehold = mapToSnakeCase(household);
      const { data, error } = await supabase
        .from('households')
        .insert([snakeCaseHousehold])
        .select()
        .single();

      if (error) {
        console.error('Error creating household:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<Household>(data) };
    } catch (err) {
      console.error('Unexpected error creating household:', err);
      return { error: 'Failed to create household' };
    }
  },

  // Update household
  async update(id: string, updates: Partial<Household>): Promise<ApiResponse<Household>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('households')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating household:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Household not found' };
      }

      return { data: mapToCamelCase<Household>(data) };
    } catch (err) {
      console.error('Unexpected error updating household:', err);
      return { error: 'Failed to update household' };
    }
  },

  // Delete household
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('households')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting household:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting household:', err);
      return { error: 'Failed to delete household' };
    }
  },
};
