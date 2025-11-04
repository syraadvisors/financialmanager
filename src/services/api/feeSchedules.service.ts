import { ApiResponse } from './client';
import { FeeSchedule } from '../../types/FeeSchedule';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const feeSchedulesService = {
  // Get all fee schedules for a firm
  async getAll(firmId: string): Promise<ApiResponse<FeeSchedule[]>> {
    try {
      const { data, error } = await supabase
        .from('fee_schedules')
        .select('*')
        .eq('firm_id', firmId)
        .order('code', { ascending: true });

      if (error) {
        console.error('Error fetching fee schedules:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<FeeSchedule[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching fee schedules:', err);
      return { error: 'Failed to fetch fee schedules' };
    }
  },

  // Get active fee schedules only
  async getActive(firmId: string): Promise<ApiResponse<FeeSchedule[]>> {
    try {
      console.log('[feeSchedulesService.getActive] Querying for firmId:', firmId);

      const { data, error } = await supabase
        .from('fee_schedules')
        .select('*')
        .eq('firm_id', firmId)
        .eq('status', 'active')
        .order('code', { ascending: true });

      console.log('[feeSchedulesService.getActive] Raw response - data:', data, 'error:', error);

      if (error) {
        console.error('Error fetching active fee schedules:', error);
        return { error: error.message };
      }

      const mappedData = mapToCamelCase<FeeSchedule[]>(data) || [];
      console.log('[feeSchedulesService.getActive] Mapped data:', mappedData);

      return { data: mappedData };
    } catch (err) {
      console.error('Unexpected error fetching active fee schedules:', err);
      return { error: 'Failed to fetch active fee schedules' };
    }
  },

  // Get fee schedule by ID
  async getById(id: string): Promise<ApiResponse<FeeSchedule>> {
    try {
      const { data, error } = await supabase
        .from('fee_schedules')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching fee schedule:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Fee schedule not found' };
      }

      return { data: mapToCamelCase<FeeSchedule>(data) };
    } catch (err) {
      console.error('Unexpected error fetching fee schedule:', err);
      return { error: 'Failed to fetch fee schedule' };
    }
  },

  // Create new fee schedule
  async create(feeSchedule: Partial<FeeSchedule>): Promise<ApiResponse<FeeSchedule>> {
    try {
      const snakeCaseFeeSchedule = mapToSnakeCase(feeSchedule);
      const { data, error } = await supabase
        .from('fee_schedules')
        .insert([snakeCaseFeeSchedule])
        .select()
        .single();

      if (error) {
        console.error('Error creating fee schedule:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<FeeSchedule>(data) };
    } catch (err) {
      console.error('Unexpected error creating fee schedule:', err);
      return { error: 'Failed to create fee schedule' };
    }
  },

  // Update fee schedule
  async update(id: string, updates: Partial<FeeSchedule>): Promise<ApiResponse<FeeSchedule>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('fee_schedules')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating fee schedule:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Fee schedule not found' };
      }

      return { data: mapToCamelCase<FeeSchedule>(data) };
    } catch (err) {
      console.error('Unexpected error updating fee schedule:', err);
      return { error: 'Failed to update fee schedule' };
    }
  },

  // Delete fee schedule
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('fee_schedules')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting fee schedule:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting fee schedule:', err);
      return { error: 'Failed to delete fee schedule' };
    }
  },
};
