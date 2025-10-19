/**
 * Fee Exceptions Service
 * Handles all API calls for fee exceptions within billing fee agreements
 */

import { supabase } from '../../lib/supabase';
import { FeeException, FeeExceptionFormData, FeeExceptionStatus } from '../../types/FeeException';
import { ApiResponse } from './client';

/**
 * Convert database snake_case to TypeScript camelCase
 */
function mapDbToFeeException(dbRow: any): FeeException {
  return {
    id: dbRow.id,
    firmId: dbRow.firm_id,
    createdAt: new Date(dbRow.created_at),
    updatedAt: new Date(dbRow.updated_at),
    billingFeeAgreementId: dbRow.billing_fee_agreement_id,
    agreementNumber: dbRow.agreement_number,
    exceptionType: dbRow.exception_type,
    status: dbRow.status,
    accountIds: dbRow.account_ids || [],
    accountNumbers: dbRow.account_numbers,
    accountNames: dbRow.account_names,
    minimumFeeAmount: dbRow.minimum_fee_amount ? parseFloat(dbRow.minimum_fee_amount) : undefined,
    maximumFeeAmount: dbRow.maximum_fee_amount ? parseFloat(dbRow.maximum_fee_amount) : undefined,
    debitAmount: dbRow.debit_amount ? parseFloat(dbRow.debit_amount) : undefined,
    creditAmount: dbRow.credit_amount ? parseFloat(dbRow.credit_amount) : undefined,
    premiumPercentage: dbRow.premium_percentage ? parseFloat(dbRow.premium_percentage) : undefined,
    discountPercentage: dbRow.discount_percentage ? parseFloat(dbRow.discount_percentage) : undefined,
    excludedFundTickers: dbRow.excluded_fund_tickers || [],
    excludedDollarAmount: dbRow.excluded_dollar_amount ? parseFloat(dbRow.excluded_dollar_amount) : undefined,
    effectiveDate: new Date(dbRow.effective_date),
    expirationDate: dbRow.expiration_date ? new Date(dbRow.expiration_date) : undefined,
    description: dbRow.description,
    notes: dbRow.notes,
    internalNotes: dbRow.internal_notes,
    createdByUserId: dbRow.created_by_user_id,
    createdByUserName: dbRow.created_by_user_name,
    lastModifiedByUserId: dbRow.last_modified_by_user_id,
    lastModifiedByUserName: dbRow.last_modified_by_user_name,
  };
}

/**
 * Convert TypeScript camelCase to database snake_case
 */
function mapFeeExceptionToDb(exception: Partial<FeeExceptionFormData> & { billingFeeAgreementId: string; firmId: string }): any {
  return {
    billing_fee_agreement_id: exception.billingFeeAgreementId,
    firm_id: exception.firmId,
    exception_type: exception.exceptionType,
    status: exception.status,
    account_ids: exception.accountIds || [],
    minimum_fee_amount: exception.minimumFeeAmount,
    maximum_fee_amount: exception.maximumFeeAmount,
    debit_amount: exception.debitAmount,
    credit_amount: exception.creditAmount,
    premium_percentage: exception.premiumPercentage,
    discount_percentage: exception.discountPercentage,
    excluded_fund_tickers: exception.excludedFundTickers || [],
    excluded_dollar_amount: exception.excludedDollarAmount,
    effective_date: exception.effectiveDate?.toISOString().split('T')[0],
    expiration_date: exception.expirationDate?.toISOString().split('T')[0],
    description: exception.description,
    notes: exception.notes,
    internal_notes: exception.internalNotes,
  };
}

export const feeExceptionsService = {
  /**
   * Get all fee exceptions for a billing fee agreement
   */
  async getByAgreementId(billingFeeAgreementId: string): Promise<ApiResponse<FeeException[]>> {
    try {
      const { data, error } = await supabase
        .from('fee_exceptions')
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .eq('billing_fee_agreement_id', billingFeeAgreementId)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      const exceptions = data.map((row: any) => mapDbToFeeException({
        ...row,
        agreement_number: row.billing_fee_agreements?.agreement_number
      }));

      return { data: exceptions };
    } catch (error: any) {
      console.error('Error fetching fee exceptions by agreement:', error);
      return { error: error.message };
    }
  },

  /**
   * Get all fee exceptions for a firm
   */
  async getAll(firmId: string): Promise<ApiResponse<FeeException[]>> {
    try {
      const { data, error } = await supabase
        .from('fee_exceptions')
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .eq('firm_id', firmId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const exceptions = data.map((row: any) => mapDbToFeeException({
        ...row,
        agreement_number: row.billing_fee_agreements?.agreement_number
      }));

      return { data: exceptions };
    } catch (error: any) {
      console.error('Error fetching all fee exceptions:', error);
      return { error: error.message };
    }
  },

  /**
   * Get a specific fee exception by ID
   */
  async getById(id: string): Promise<ApiResponse<FeeException>> {
    try {
      const { data, error } = await supabase
        .from('fee_exceptions')
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Fee exception not found');

      const exception = mapDbToFeeException({
        ...data,
        agreement_number: data.billing_fee_agreements?.agreement_number
      });

      return { data: exception };
    } catch (error: any) {
      console.error('Error fetching fee exception by ID:', error);
      return { error: error.message };
    }
  },

  /**
   * Get active fee exceptions for a billing fee agreement
   * Optionally filter by specific account
   */
  async getActive(
    billingFeeAgreementId: string,
    accountId?: string
  ): Promise<ApiResponse<FeeException[]>> {
    try {
      let query = supabase
        .from('fee_exceptions')
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .eq('billing_fee_agreement_id', billingFeeAgreementId)
        .eq('status', 'Active')
        .lte('effective_date', new Date().toISOString().split('T')[0]);

      // Filter by account if provided
      if (accountId) {
        query = query.or(`account_ids.cs.{${accountId}},account_ids.eq.{}`);
      }

      const { data, error } = await query.order('effective_date', { ascending: false });

      if (error) throw error;

      const exceptions = data
        .filter((row: any) => {
          // Filter out expired exceptions
          if (row.expiration_date) {
            const expirationDate = new Date(row.expiration_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return expirationDate >= today;
          }
          return true;
        })
        .map((row: any) => mapDbToFeeException({
          ...row,
          agreement_number: row.billing_fee_agreements?.agreement_number
        }));

      return { data: exceptions };
    } catch (error: any) {
      console.error('Error fetching active fee exceptions:', error);
      return { error: error.message };
    }
  },

  /**
   * Get fee exceptions that apply to a specific account
   */
  async getByAccountId(accountId: string): Promise<ApiResponse<FeeException[]>> {
    try {
      const { data, error } = await supabase
        .from('fee_exceptions')
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .or(`account_ids.cs.{${accountId}},account_ids.eq.{}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      const exceptions = data.map((row: any) => mapDbToFeeException({
        ...row,
        agreement_number: row.billing_fee_agreements?.agreement_number
      }));

      return { data: exceptions };
    } catch (error: any) {
      console.error('Error fetching fee exceptions by account:', error);
      return { error: error.message };
    }
  },

  /**
   * Create a new fee exception
   */
  async create(
    billingFeeAgreementId: string,
    firmId: string,
    exceptionData: FeeExceptionFormData
  ): Promise<ApiResponse<FeeException>> {
    try {
      const dbData = mapFeeExceptionToDb({
        ...exceptionData,
        billingFeeAgreementId,
        firmId,
      });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        dbData.created_by_user_id = user.id;
      }

      const { data, error } = await supabase
        .from('fee_exceptions')
        .insert(dbData)
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .single();

      if (error) throw error;

      const exception = mapDbToFeeException({
        ...data,
        agreement_number: data.billing_fee_agreements?.agreement_number
      });

      return { data: exception };
    } catch (error: any) {
      console.error('Error creating fee exception:', error);
      return { error: error.message };
    }
  },

  /**
   * Update an existing fee exception
   */
  async update(
    id: string,
    updates: Partial<FeeExceptionFormData>
  ): Promise<ApiResponse<FeeException>> {
    try {
      const dbUpdates: any = {};

      // Only include fields that are being updated
      if (updates.exceptionType !== undefined) dbUpdates.exception_type = updates.exceptionType;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.accountIds !== undefined) dbUpdates.account_ids = updates.accountIds;
      if (updates.minimumFeeAmount !== undefined) dbUpdates.minimum_fee_amount = updates.minimumFeeAmount;
      if (updates.maximumFeeAmount !== undefined) dbUpdates.maximum_fee_amount = updates.maximumFeeAmount;
      if (updates.debitAmount !== undefined) dbUpdates.debit_amount = updates.debitAmount;
      if (updates.creditAmount !== undefined) dbUpdates.credit_amount = updates.creditAmount;
      if (updates.premiumPercentage !== undefined) dbUpdates.premium_percentage = updates.premiumPercentage;
      if (updates.discountPercentage !== undefined) dbUpdates.discount_percentage = updates.discountPercentage;
      if (updates.excludedFundTickers !== undefined) dbUpdates.excluded_fund_tickers = updates.excludedFundTickers;
      if (updates.excludedDollarAmount !== undefined) dbUpdates.excluded_dollar_amount = updates.excludedDollarAmount;
      if (updates.effectiveDate !== undefined) dbUpdates.effective_date = updates.effectiveDate.toISOString().split('T')[0];
      if (updates.expirationDate !== undefined) dbUpdates.expiration_date = updates.expirationDate?.toISOString().split('T')[0];
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.internalNotes !== undefined) dbUpdates.internal_notes = updates.internalNotes;

      // Get current user for last modified tracking
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        dbUpdates.last_modified_by_user_id = user.id;
      }

      const { data, error } = await supabase
        .from('fee_exceptions')
        .update(dbUpdates)
        .eq('id', id)
        .select(`
          *,
          billing_fee_agreements!inner(agreement_number)
        `)
        .single();

      if (error) throw error;

      const exception = mapDbToFeeException({
        ...data,
        agreement_number: data.billing_fee_agreements?.agreement_number
      });

      return { data: exception };
    } catch (error: any) {
      console.error('Error updating fee exception:', error);
      return { error: error.message };
    }
  },

  /**
   * Delete a fee exception
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('fee_exceptions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {};
    } catch (error: any) {
      console.error('Error deleting fee exception:', error);
      return { error: error.message };
    }
  },

  /**
   * Expire a fee exception (set status to Expired)
   */
  async expire(id: string): Promise<ApiResponse<FeeException>> {
    return this.update(id, { status: FeeExceptionStatus.EXPIRED });
  },

  /**
   * Deactivate a fee exception (set status to Inactive)
   */
  async deactivate(id: string): Promise<ApiResponse<FeeException>> {
    return this.update(id, { status: FeeExceptionStatus.INACTIVE });
  },

  /**
   * Activate a fee exception (set status to Active)
   */
  async activate(id: string): Promise<ApiResponse<FeeException>> {
    return this.update(id, { status: FeeExceptionStatus.ACTIVE });
  },

  /**
   * Run the auto-expire function to mark expired exceptions
   */
  async runAutoExpire(): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase.rpc('auto_expire_fee_exceptions');

      if (error) throw error;

      return { data: data || 0 };
    } catch (error: any) {
      console.error('Error running auto-expire:', error);
      return { error: error.message };
    }
  },
};
