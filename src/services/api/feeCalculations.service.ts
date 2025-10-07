import { ApiResponse } from './client';
import { supabase } from '../../lib/supabase';

export interface FeeCalculationRequest {
  clientId?: string;
  accountId?: string;
  billingPeriod: string;
  startDate: Date;
  endDate: Date;
}

export interface FeeCalculationResult {
  id: string;
  clientId: string;
  accountId: string;
  billingPeriod: string;
  averageBalance: number;
  feeRate: number;
  calculatedFee: number;
  adjustments: number;
  finalFee: number;
  calculatedAt: Date;
}

export const feeCalculationsService = {
  // Calculate fees for a billing period
  async calculate(request: FeeCalculationRequest): Promise<ApiResponse<FeeCalculationResult[]>> {
    try {
      // This would call a Supabase function or edge function to calculate fees
      // For now, we'll implement a simple client-side calculation

      // Get the billing period
      const { data: period, error: periodError } = await supabase
        .from('billing_periods')
        .select('*')
        .eq('period_name', request.billingPeriod)
        .single();

      if (periodError) {
        return { error: periodError.message };
      }

      // Get accounts to calculate (filtered by clientId or accountId if provided)
      let accountsQuery = supabase
        .from('accounts')
        .select('*, clients(*, households(*, master_accounts(*, relationships(*))))');

      if (request.accountId) {
        accountsQuery = accountsQuery.eq('id', request.accountId);
      } else if (request.clientId) {
        accountsQuery = accountsQuery.eq('client_id', request.clientId);
      }

      const { data: accounts, error: accountsError } = await accountsQuery;

      if (accountsError) {
        return { error: accountsError.message };
      }

      // Calculate fees for each account
      const results: FeeCalculationResult[] = [];

      for (const account of accounts || []) {
        // Get positions for this account in the billing period
        const { data: positions, error: positionsError } = await supabase
          .from('positions')
          .select('*')
          .eq('account_id', account.id)
          .gte('date', period.period_start)
          .lte('date', period.period_end);

        if (positionsError) {
          console.error('Error fetching positions:', positionsError);
          continue;
        }

        // Calculate average balance
        const totalBalance = positions?.reduce((sum, p) => sum + (p.market_value || 0), 0) || 0;
        const avgBalance = positions && positions.length > 0 ? totalBalance / positions.length : 0;

        // Get fee schedule for this account (simplified - would need more logic for real implementation)
        const { data: feeSchedules } = await supabase
          .from('fee_schedules')
          .select('*')
          .limit(1);

        const feeSchedule = feeSchedules?.[0];
        const feeRate = 1.0; // Simplified - would calculate from tiers in real implementation
        const calculatedFee = avgBalance * (feeRate / 100);

        results.push({
          id: `calc-${Date.now()}-${account.id}`,
          clientId: account.client_id,
          accountId: account.id,
          billingPeriod: request.billingPeriod,
          averageBalance: avgBalance,
          feeRate,
          calculatedFee,
          adjustments: 0,
          finalFee: calculatedFee,
          calculatedAt: new Date(),
        });
      }

      return { data: results };
    } catch (err) {
      console.error('Unexpected error calculating fees:', err);
      return { error: 'Failed to calculate fees' };
    }
  },

  // Get fee calculation history
  async getHistory(clientId?: string, accountId?: string): Promise<ApiResponse<FeeCalculationResult[]>> {
    try {
      let query = supabase
        .from('fee_calculations')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (accountId) {
        query = query.eq('account_id', accountId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching fee calculations:', error);
        return { error: error.message };
      }

      return { data: data || [] };
    } catch (err) {
      console.error('Unexpected error fetching fee calculations:', err);
      return { error: 'Failed to fetch fee calculations' };
    }
  },

  // Get specific fee calculation by ID
  async getById(id: string): Promise<ApiResponse<FeeCalculationResult>> {
    try {
      const { data, error } = await supabase
        .from('fee_calculations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching fee calculation:', error);
        return { error: error.message };
      }

      if (!data) {
        return { error: 'Fee calculation not found' };
      }

      return { data };
    } catch (err) {
      console.error('Unexpected error fetching fee calculation:', err);
      return { error: 'Failed to fetch fee calculation' };
    }
  },

  // Recalculate fees (for corrections)
  async recalculate(id: string): Promise<ApiResponse<FeeCalculationResult>> {
    try {
      // Get the existing calculation
      const { data: existing, error: fetchError } = await supabase
        .from('fee_calculations')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !existing) {
        return { error: 'Fee calculation not found' };
      }

      // Recalculate using the same parameters
      const request: FeeCalculationRequest = {
        accountId: existing.account_id,
        billingPeriod: existing.billing_period_id,
        startDate: new Date(existing.period_start),
        endDate: new Date(existing.period_end),
      };

      const { data: results } = await this.calculate(request);

      if (results && results.length > 0) {
        return { data: results[0] };
      }

      return { error: 'Recalculation failed' };
    } catch (err) {
      console.error('Unexpected error recalculating fees:', err);
      return { error: 'Failed to recalculate fees' };
    }
  },
};
