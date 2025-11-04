import { ApiResponse } from './client';
import { AccountBalance } from '../../types/DataTypes';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export interface ImportedBalanceDataRecord extends AccountBalance {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  firmId?: string;
  importedBy?: string;
  importBatchId?: string;
  importFilename?: string;
  importTimestamp?: string;
}

export interface BulkImportResponse {
  success: boolean;
  importBatchId?: string;
  recordsImported?: number;
  error?: string;
}

export const importedBalanceDataService = {
  /**
   * Bulk import balance data from CSV
   * @param data Array of balance records
   * @param filename Original filename
   * @param firmId Firm ID (optional, will be auto-set by trigger if not provided)
   */
  async bulkImport(
    data: AccountBalance[],
    filename: string,
    firmId?: string
  ): Promise<BulkImportResponse> {
    try {
      // Generate a unique batch ID for this import
      const importBatchId = crypto.randomUUID();
      const importTimestamp = new Date().toISOString();

      // Transform data to match database schema
      const records = data.map((record) => {
        const dbRecord = mapToSnakeCase({
          ...record,
          importBatchId,
          importFilename: filename,
          importTimestamp,
          firmId, // Will be set by trigger if null
        });
        return dbRecord;
      });

      // Insert all records in a single transaction
      const { data: insertedData, error } = await supabase
        .from('imported_balance_data')
        .insert(records)
        .select('id');

      if (error) {
        console.error('Error importing balance data:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`Successfully imported ${insertedData?.length || 0} balance records`);

      return {
        success: true,
        importBatchId,
        recordsImported: insertedData?.length || 0,
      };
    } catch (err) {
      console.error('Unexpected error importing balance data:', err);
      return {
        success: false,
        error: 'Failed to import balance data',
      };
    }
  },

  /**
   * Get all imported balance data for a firm
   * @param firmId Firm ID
   * @param limit Optional limit
   * @param offset Optional offset for pagination
   */
  async getAll(
    firmId: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<ImportedBalanceDataRecord[]>> {
    try {
      let query = supabase
        .from('imported_balance_data')
        .select('*')
        .eq('firm_id', firmId)
        .order('as_of_business_date', { ascending: false })
        .order('account_number', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching imported balance data:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedBalanceDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching imported balance data:', err);
      return { error: 'Failed to fetch imported balance data' };
    }
  },

  /**
   * Get balance data by import batch ID
   * @param importBatchId Import batch ID
   */
  async getByBatchId(importBatchId: string): Promise<ApiResponse<ImportedBalanceDataRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('imported_balance_data')
        .select('*')
        .eq('import_batch_id', importBatchId)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching balance data by batch:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedBalanceDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching balance data by batch:', err);
      return { error: 'Failed to fetch balance data' };
    }
  },

  /**
   * Get balance data by account number
   * @param firmId Firm ID
   * @param accountNumber Account number
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   */
  async getByAccountNumber(
    firmId: string,
    accountNumber: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ImportedBalanceDataRecord[]>> {
    try {
      let query = supabase
        .from('imported_balance_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('account_number', accountNumber)
        .order('as_of_business_date', { ascending: false });

      if (startDate) {
        query = query.gte('as_of_business_date', startDate);
      }

      if (endDate) {
        query = query.lte('as_of_business_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching balance data by account:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedBalanceDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching balance data by account:', err);
      return { error: 'Failed to fetch balance data' };
    }
  },

  /**
   * Get balance data for a specific date (only most recent import)
   * @param firmId Firm ID
   * @param date Date string (YYYY-MM-DD)
   */
  async getByDate(
    firmId: string,
    date: string
  ): Promise<ApiResponse<ImportedBalanceDataRecord[]>> {
    try {
      // First, find the most recent import batch for this date
      const { data: batchData, error: batchError } = await supabase
        .from('imported_balance_data')
        .select('import_batch_id, import_timestamp')
        .eq('firm_id', firmId)
        .eq('as_of_business_date', date)
        .order('import_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (batchError) {
        // If no data found, return empty array
        if (batchError.code === 'PGRST116') {
          return { data: [] };
        }
        console.error('Error finding most recent batch:', batchError);
        return { error: batchError.message };
      }

      if (!batchData) {
        return { data: [] };
      }

      // Now fetch all records from the most recent batch
      const { data, error } = await supabase
        .from('imported_balance_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('as_of_business_date', date)
        .eq('import_batch_id', batchData.import_batch_id)
        .order('account_number', { ascending: true });

      if (error) {
        console.error('Error fetching balance data by date:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedBalanceDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching balance data by date:', err);
      return { error: 'Failed to fetch balance data' };
    }
  },

  /**
   * Delete balance data by import batch ID
   * @param importBatchId Import batch ID
   */
  async deleteByBatchId(importBatchId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('imported_balance_data')
        .delete()
        .eq('import_batch_id', importBatchId);

      if (error) {
        console.error('Error deleting balance data batch:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting balance data batch:', err);
      return { error: 'Failed to delete balance data batch' };
    }
  },

  /**
   * Get list of unique dates with imported data
   * @param firmId Firm ID
   */
  async getAvailableDates(firmId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('imported_balance_data')
        .select('as_of_business_date')
        .eq('firm_id', firmId)
        .order('as_of_business_date', { ascending: false });

      if (error) {
        console.error('Error fetching available dates:', error);
        return { error: error.message };
      }

      // Extract unique dates
      const uniqueDates = Array.from(
        new Set(data?.map((record: any) => record.as_of_business_date) || [])
      );

      return { data: uniqueDates };
    } catch (err) {
      console.error('Unexpected error fetching available dates:', err);
      return { error: 'Failed to fetch available dates' };
    }
  },

  /**
   * Get list of all import batches for a firm
   * @param firmId Firm ID
   */
  async getImportBatches(firmId: string): Promise<
    ApiResponse<
      Array<{
        importBatchId: string;
        importFilename: string;
        importTimestamp: string;
        recordCount: number;
        dateRange: { min: string; max: string };
      }>
    >
  > {
    try {
      const { data, error } = await supabase
        .from('imported_balance_data')
        .select('import_batch_id, import_filename, import_timestamp, as_of_business_date')
        .eq('firm_id', firmId)
        .order('import_timestamp', { ascending: false });

      if (error) {
        console.error('Error fetching import batches:', error);
        return { error: error.message };
      }

      // Group by import batch ID
      const batches = new Map<
        string,
        {
          importBatchId: string;
          importFilename: string;
          importTimestamp: string;
          recordCount: number;
          dates: string[];
        }
      >();

      data?.forEach((record: any) => {
        const batchId = record.import_batch_id;
        if (!batches.has(batchId)) {
          batches.set(batchId, {
            importBatchId: batchId,
            importFilename: record.import_filename,
            importTimestamp: record.import_timestamp,
            recordCount: 0,
            dates: [],
          });
        }
        const batch = batches.get(batchId)!;
        batch.recordCount++;
        batch.dates.push(record.as_of_business_date);
      });

      // Convert to array with date ranges
      const batchArray = Array.from(batches.values()).map((batch) => {
        const sortedDates = batch.dates.sort();
        return {
          importBatchId: batch.importBatchId,
          importFilename: batch.importFilename,
          importTimestamp: batch.importTimestamp,
          recordCount: batch.recordCount,
          dateRange: {
            min: sortedDates[0],
            max: sortedDates[sortedDates.length - 1],
          },
        };
      });

      return { data: mapToCamelCase(batchArray) };
    } catch (err) {
      console.error('Unexpected error fetching import batches:', err);
      return { error: 'Failed to fetch import batches' };
    }
  },

  /**
   * Get count of imported balance data records for a firm
   * Only counts records from the most recent import per date (matching display logic)
   * @param firmId Firm ID
   */
  async getCount(firmId: string): Promise<ApiResponse<number>> {
    try {
      // Get all available dates
      const datesResponse = await this.getAvailableDates(firmId);
      if (datesResponse.error || !datesResponse.data) {
        return { data: 0 };
      }

      let totalCount = 0;

      // For each date, get the count of records from the most recent import
      for (const date of datesResponse.data) {
        // Find the most recent import batch for this date
        const { data: batchData, error: batchError } = await supabase
          .from('imported_balance_data')
          .select('import_batch_id')
          .eq('firm_id', firmId)
          .eq('as_of_business_date', date)
          .order('import_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (batchError || !batchData) {
          continue; // Skip this date if no data found
        }

        // Count records from the most recent batch for this date
        const { count, error: countError } = await supabase
          .from('imported_balance_data')
          .select('*', { count: 'exact', head: true })
          .eq('firm_id', firmId)
          .eq('as_of_business_date', date)
          .eq('import_batch_id', batchData.import_batch_id);

        if (!countError && count) {
          totalCount += count;
        }
      }

      return { data: totalCount };
    } catch (err) {
      console.error('Unexpected error fetching balance data count:', err);
      return { error: 'Failed to fetch balance data count' };
    }
  },
};
