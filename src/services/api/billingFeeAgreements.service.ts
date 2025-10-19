import { ApiResponse } from './client';
import { BillingFeeAgreement } from '../../types/BillingFeeAgreement';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export const billingFeeAgreementsService = {
  // Get all billing fee agreements for a firm
  async getAll(firmId: string): Promise<ApiResponse<BillingFeeAgreement[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .eq('firm_id', firmId)
        .order('agreement_number', { ascending: true });

      if (error) {
        console.error('Error fetching billing fee agreements:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching billing fee agreements:', err);
      return { error: 'Failed to fetch billing fee agreements' };
    }
  },

  // Get billing fee agreement by ID
  async getById(id: string): Promise<ApiResponse<BillingFeeAgreement>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching billing fee agreement:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Billing fee agreement not found' };
      }

      return { data: mapToCamelCase<BillingFeeAgreement>(data) };
    } catch (err) {
      console.error('Unexpected error fetching billing fee agreement:', err);
      return { error: 'Failed to fetch billing fee agreement' };
    }
  },

  // Get billing fee agreements by relationship ID
  async getByRelationshipId(relationshipId: string): Promise<ApiResponse<BillingFeeAgreement[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .eq('relationship_id', relationshipId)
        .order('agreement_number', { ascending: true });

      if (error) {
        console.error('Error fetching billing fee agreements by relationship:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching billing fee agreements by relationship:', err);
      return { error: 'Failed to fetch billing fee agreements' };
    }
  },

  // Get billing fee agreements by fee schedule ID
  async getByFeeScheduleId(feeScheduleId: string): Promise<ApiResponse<BillingFeeAgreement[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .eq('fee_schedule_id', feeScheduleId)
        .order('agreement_number', { ascending: true });

      if (error) {
        console.error('Error fetching billing fee agreements by fee schedule:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching billing fee agreements by fee schedule:', err);
      return { error: 'Failed to fetch billing fee agreements' };
    }
  },

  // Get billing fee agreements by account ID (checks if account is in account_ids array)
  async getByAccountId(accountId: string): Promise<ApiResponse<BillingFeeAgreement[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .contains('account_ids', [accountId])
        .order('agreement_number', { ascending: true });

      if (error) {
        console.error('Error fetching billing fee agreements by account:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching billing fee agreements by account:', err);
      return { error: 'Failed to fetch billing fee agreements' };
    }
  },

  // Get active billing fee agreements
  async getActive(firmId: string): Promise<ApiResponse<BillingFeeAgreement[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .select('*')
        .eq('firm_id', firmId)
        .eq('status', 'Active')
        .order('agreement_number', { ascending: true });

      if (error) {
        console.error('Error fetching active billing fee agreements:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching active billing fee agreements:', err);
      return { error: 'Failed to fetch active billing fee agreements' };
    }
  },

  // Create new billing fee agreement
  async create(agreement: Partial<BillingFeeAgreement>): Promise<ApiResponse<BillingFeeAgreement>> {
    try {
      const snakeCaseAgreement = mapToSnakeCase(agreement);
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .insert([snakeCaseAgreement])
        .select()
        .single();

      if (error) {
        console.error('Error creating billing fee agreement:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingFeeAgreement>(data) };
    } catch (err) {
      console.error('Unexpected error creating billing fee agreement:', err);
      return { error: 'Failed to create billing fee agreement' };
    }
  },

  // Update billing fee agreement
  async update(id: string, updates: Partial<BillingFeeAgreement>): Promise<ApiResponse<BillingFeeAgreement>> {
    try {
      const snakeCaseUpdates = mapToSnakeCase(updates);
      const { data, error } = await supabase
        .from('billing_fee_agreements')
        .update(snakeCaseUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating billing fee agreement:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Billing fee agreement not found' };
      }

      return { data: mapToCamelCase<BillingFeeAgreement>(data) };
    } catch (err) {
      console.error('Unexpected error updating billing fee agreement:', err);
      return { error: 'Failed to update billing fee agreement' };
    }
  },

  // Delete billing fee agreement
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('billing_fee_agreements')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting billing fee agreement:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting billing fee agreement:', err);
      return { error: 'Failed to delete billing fee agreement' };
    }
  },

  // Terminate an agreement (set status to Terminated and set termination date)
  async terminate(id: string, terminationDate: Date): Promise<ApiResponse<BillingFeeAgreement>> {
    return this.update(id, {
      status: 'Terminated' as any,
      terminationDate,
    });
  },
};
