import { ApiResponse } from './client';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export type PeriodType = 'standard' | 'custom';
export type PeriodFrequency = 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
export type PeriodStatus = 'Draft' | 'Active' | 'Closed' | 'Cancelled';

export interface BillingPeriod {
  id?: string;
  firmId?: string;
  createdAt?: string;
  updatedAt?: string;

  // Period Identification
  periodNumber?: string;
  periodName: string;

  // Period Type
  periodType: PeriodType;

  // For Standard (Recurring) Periods
  frequency?: PeriodFrequency;

  // Period Dates
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format

  // Status
  status: PeriodStatus;

  // Billing Information
  billingDate?: string;
  dueDate?: string;

  // Related Fee Agreement
  feeAgreementId?: string;

  // Period Statistics
  accountsBilled?: number;
  feesCalculated?: number;
  feesCollected?: number;

  // Flags
  isLocked?: boolean;
  billingCompleted?: boolean;
  billingCompletedAt?: string;

  // Metadata
  description?: string;
  notes?: string;
  internalNotes?: string;

  // Audit
  createdBy?: string;
  closedBy?: string;
  closedAt?: string;
}

export interface CreateBillingPeriodInput {
  periodName: string;
  periodType: PeriodType;
  frequency?: PeriodFrequency;
  startDate: string;
  endDate: string;
  status?: PeriodStatus;
  billingDate?: string;
  dueDate?: string;
  feeAgreementId?: string;
  description?: string;
  notes?: string;
  internalNotes?: string;
  firmId?: string;
}

export interface UpdateBillingPeriodInput {
  periodName?: string;
  status?: PeriodStatus;
  billingDate?: string;
  dueDate?: string;
  description?: string;
  notes?: string;
  internalNotes?: string;
  accountsBilled?: number;
  feesCalculated?: number;
  feesCollected?: number;
  billingCompleted?: boolean;
  billingCompletedAt?: string;
}

export interface BillingPeriodFilters {
  periodType?: PeriodType;
  frequency?: PeriodFrequency;
  status?: PeriodStatus;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  isLocked?: boolean;
  feeAgreementId?: string;
}

export const billingPeriodsService = {
  /**
   * Create a new billing period
   * @param input Billing period data
   */
  async create(input: CreateBillingPeriodInput): Promise<ApiResponse<BillingPeriod>> {
    try {
      const dbRecord = mapToSnakeCase({
        ...input,
        status: input.status || 'Draft',
      });

      const { data, error } = await supabase
        .from('billing_periods')
        .insert(dbRecord)
        .select()
        .single();

      if (error) {
        console.error('Error creating billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error creating billing period:', err);
      return { error: 'Failed to create billing period' };
    }
  },

  /**
   * Get all billing periods for a firm
   * @param firmId Firm ID
   * @param filters Optional filters
   * @param limit Optional limit
   * @param offset Optional offset for pagination
   */
  async getAll(
    firmId: string,
    filters?: BillingPeriodFilters,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<BillingPeriod[]>> {
    try {
      let query = supabase
        .from('billing_periods')
        .select('*')
        .eq('firm_id', firmId);

      // Apply filters
      if (filters) {
        if (filters.periodType) {
          query = query.eq('period_type', filters.periodType);
        }
        if (filters.frequency) {
          query = query.eq('frequency', filters.frequency);
        }
        if (filters.status) {
          query = query.eq('status', filters.status);
        }
        if (filters.startDateFrom) {
          query = query.gte('start_date', filters.startDateFrom);
        }
        if (filters.startDateTo) {
          query = query.lte('start_date', filters.startDateTo);
        }
        if (filters.endDateFrom) {
          query = query.gte('end_date', filters.endDateFrom);
        }
        if (filters.endDateTo) {
          query = query.lte('end_date', filters.endDateTo);
        }
        if (filters.isLocked !== undefined) {
          query = query.eq('is_locked', filters.isLocked);
        }
        if (filters.feeAgreementId) {
          query = query.eq('fee_agreement_id', filters.feeAgreementId);
        }
      }

      // Default ordering: most recent start date first
      query = query.order('start_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching billing periods:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching billing periods:', err);
      return { error: 'Failed to fetch billing periods' };
    }
  },

  /**
   * Get a single billing period by ID
   * @param id Billing period ID
   */
  async getById(id: string): Promise<ApiResponse<BillingPeriod>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error fetching billing period:', err);
      return { error: 'Failed to fetch billing period' };
    }
  },

  /**
   * Get billing periods by period number
   * @param firmId Firm ID
   * @param periodNumber Period number (e.g., "BP-2025-Q1")
   */
  async getByPeriodNumber(
    firmId: string,
    periodNumber: string
  ): Promise<ApiResponse<BillingPeriod>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('firm_id', firmId)
        .eq('period_number', periodNumber)
        .single();

      if (error) {
        console.error('Error fetching billing period by number:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error fetching billing period by number:', err);
      return { error: 'Failed to fetch billing period' };
    }
  },

  /**
   * Get active billing periods
   * @param firmId Firm ID
   */
  async getActive(firmId: string): Promise<ApiResponse<BillingPeriod[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('firm_id', firmId)
        .eq('status', 'Active')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching active billing periods:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching active billing periods:', err);
      return { error: 'Failed to fetch active billing periods' };
    }
  },

  /**
   * Get billing periods that overlap with a date range
   * @param firmId Firm ID
   * @param startDate Start date (YYYY-MM-DD)
   * @param endDate End date (YYYY-MM-DD)
   */
  async getOverlapping(
    firmId: string,
    startDate: string,
    endDate: string
  ): Promise<ApiResponse<BillingPeriod[]>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('firm_id', firmId)
        .or(`and(start_date.lte.${endDate},end_date.gte.${startDate})`)
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching overlapping billing periods:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching overlapping billing periods:', err);
      return { error: 'Failed to fetch overlapping billing periods' };
    }
  },

  /**
   * Update a billing period
   * @param id Billing period ID
   * @param input Updated data
   */
  async update(id: string, input: UpdateBillingPeriodInput): Promise<ApiResponse<BillingPeriod>> {
    try {
      const dbRecord = mapToSnakeCase(input);

      const { data, error } = await supabase
        .from('billing_periods')
        .update(dbRecord)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error updating billing period:', err);
      return { error: 'Failed to update billing period' };
    }
  },

  /**
   * Lock a billing period (prevents further modifications)
   * @param id Billing period ID
   */
  async lock(id: string): Promise<ApiResponse<BillingPeriod>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .update({ is_locked: true })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error locking billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error locking billing period:', err);
      return { error: 'Failed to lock billing period' };
    }
  },

  /**
   * Unlock a billing period (allows modifications again)
   * @param id Billing period ID
   */
  async unlock(id: string): Promise<ApiResponse<BillingPeriod>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .update({ is_locked: false })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error unlocking billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error unlocking billing period:', err);
      return { error: 'Failed to unlock billing period' };
    }
  },

  /**
   * Close a billing period
   * @param id Billing period ID
   */
  async close(id: string): Promise<ApiResponse<BillingPeriod>> {
    try {
      const { data, error } = await supabase
        .from('billing_periods')
        .update({
          status: 'Closed',
          closed_at: new Date().toISOString(),
          is_locked: true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error closing billing period:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<BillingPeriod>(data) };
    } catch (err) {
      console.error('Unexpected error closing billing period:', err);
      return { error: 'Failed to close billing period' };
    }
  },

  /**
   * Delete a billing period
   * @param id Billing period ID
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('billing_periods')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting billing period:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting billing period:', err);
      return { error: 'Failed to delete billing period' };
    }
  },

  /**
   * Generate standard billing periods for a year
   * @param firmId Firm ID
   * @param year Year (e.g., 2025)
   * @param frequency Billing frequency
   */
  async generateStandardPeriods(
    firmId: string,
    year: number,
    frequency: PeriodFrequency
  ): Promise<ApiResponse<BillingPeriod[]>> {
    try {
      const periods: CreateBillingPeriodInput[] = [];

      switch (frequency) {
        case 'Quarterly':
          // Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec
          for (let q = 1; q <= 4; q++) {
            const startMonth = (q - 1) * 3 + 1;
            const endMonth = startMonth + 2;
            periods.push({
              periodName: `Q${q} ${year}`,
              periodType: 'standard',
              frequency: 'Quarterly',
              startDate: `${year}-${String(startMonth).padStart(2, '0')}-01`,
              endDate: `${year}-${String(endMonth).padStart(2, '0')}-${
                endMonth === 3 || endMonth === 5 || endMonth === 8 || endMonth === 11 ? '31' :
                endMonth === 6 || endMonth === 9 ? '30' : '31'
              }`,
              status: 'Draft',
              firmId,
            });
          }
          break;

        case 'Monthly':
          // 12 months
          const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
          // Check for leap year
          if (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) {
            daysInMonth[1] = 29;
          }

          for (let m = 1; m <= 12; m++) {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            periods.push({
              periodName: `${monthNames[m - 1]} ${year}`,
              periodType: 'standard',
              frequency: 'Monthly',
              startDate: `${year}-${String(m).padStart(2, '0')}-01`,
              endDate: `${year}-${String(m).padStart(2, '0')}-${daysInMonth[m - 1]}`,
              status: 'Draft',
              firmId,
            });
          }
          break;

        case 'Semi-Annual':
          // H1: Jan-Jun, H2: Jul-Dec
          periods.push(
            {
              periodName: `H1 ${year}`,
              periodType: 'standard',
              frequency: 'Semi-Annual',
              startDate: `${year}-01-01`,
              endDate: `${year}-06-30`,
              status: 'Draft',
              firmId,
            },
            {
              periodName: `H2 ${year}`,
              periodType: 'standard',
              frequency: 'Semi-Annual',
              startDate: `${year}-07-01`,
              endDate: `${year}-12-31`,
              status: 'Draft',
              firmId,
            }
          );
          break;

        case 'Annual':
          // Full year
          periods.push({
            periodName: `${year}`,
            periodType: 'standard',
            frequency: 'Annual',
            startDate: `${year}-01-01`,
            endDate: `${year}-12-31`,
            status: 'Draft',
            firmId,
          });
          break;
      }

      // Insert all periods
      const results: BillingPeriod[] = [];
      for (const period of periods) {
        const result = await this.create(period);
        if (result.data) {
          results.push(result.data);
        } else if (result.error) {
          console.error('Error creating period:', result.error);
        }
      }

      return { data: results };
    } catch (err) {
      console.error('Unexpected error generating standard periods:', err);
      return { error: 'Failed to generate standard periods' };
    }
  },
};
