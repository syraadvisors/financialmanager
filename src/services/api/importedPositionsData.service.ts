import { ApiResponse } from './client';
import { AccountPosition } from '../../types/DataTypes';
import { supabase } from '../../lib/supabase';
import { mapToCamelCase, mapToSnakeCase } from '../../utils/databaseMapper';

export interface ImportedPositionsDataRecord extends AccountPosition {
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

export const importedPositionsDataService = {
  /**
   * Bulk import positions data from CSV
   * @param data Array of position records
   * @param filename Original filename
   * @param firmId Firm ID (optional, will be auto-set by trigger if not provided)
   */
  async bulkImport(
    data: AccountPosition[],
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
        .from('imported_positions_data')
        .insert(records)
        .select('id');

      if (error) {
        console.error('Error importing positions data:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log(`Successfully imported ${insertedData?.length || 0} position records`);

      return {
        success: true,
        importBatchId,
        recordsImported: insertedData?.length || 0,
      };
    } catch (err) {
      console.error('Unexpected error importing positions data:', err);
      return {
        success: false,
        error: 'Failed to import positions data',
      };
    }
  },

  /**
   * Get all imported positions data for a firm
   * @param firmId Firm ID
   * @param limit Optional limit
   * @param offset Optional offset for pagination
   */
  async getAll(
    firmId: string,
    limit?: number,
    offset?: number
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      let query = supabase
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId)
        .order('as_of_business_date', { ascending: false })
        .order('account_number', { ascending: true })
        .order('symbol', { ascending: true });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 100) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching imported positions data:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching imported positions data:', err);
      return { error: 'Failed to fetch imported positions data' };
    }
  },

  /**
   * Get positions data by import batch ID
   * @param importBatchId Import batch ID
   */
  async getByBatchId(
    importBatchId: string
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('imported_positions_data')
        .select('*')
        .eq('import_batch_id', importBatchId)
        .order('account_number', { ascending: true })
        .order('symbol', { ascending: true });

      if (error) {
        console.error('Error fetching positions data by batch:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching positions data by batch:', err);
      return { error: 'Failed to fetch positions data' };
    }
  },

  /**
   * Get positions data by account number
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
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      let query = supabase
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('account_number', accountNumber)
        .order('as_of_business_date', { ascending: false })
        .order('symbol', { ascending: true });

      if (startDate) {
        query = query.gte('as_of_business_date', startDate);
      }

      if (endDate) {
        query = query.lte('as_of_business_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching positions data by account:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching positions data by account:', err);
      return { error: 'Failed to fetch positions data' };
    }
  },

  /**
   * Get positions data for a specific symbol
   * @param firmId Firm ID
   * @param symbol Security symbol
   * @param startDate Optional start date filter
   * @param endDate Optional end date filter
   */
  async getBySymbol(
    firmId: string,
    symbol: string,
    startDate?: string,
    endDate?: string
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      let query = supabase
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('symbol', symbol)
        .order('as_of_business_date', { ascending: false })
        .order('account_number', { ascending: true });

      if (startDate) {
        query = query.gte('as_of_business_date', startDate);
      }

      if (endDate) {
        query = query.lte('as_of_business_date', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching positions data by symbol:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching positions data by symbol:', err);
      return { error: 'Failed to fetch positions data' };
    }
  },

  /**
   * Get positions data for a specific date
   * @param firmId Firm ID
   * @param date Date string (YYYY-MM-DD)
   */
  async getByDate(
    firmId: string,
    date: string
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      const { data, error } = await supabase
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('as_of_business_date', date)
        .order('account_number', { ascending: true })
        .order('symbol', { ascending: true });

      if (error) {
        console.error('Error fetching positions data by date:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error fetching positions data by date:', err);
      return { error: 'Failed to fetch positions data' };
    }
  },

  /**
   * Delete positions data by import batch ID
   * @param importBatchId Import batch ID
   */
  async deleteByBatchId(importBatchId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('imported_positions_data')
        .delete()
        .eq('import_batch_id', importBatchId);

      if (error) {
        console.error('Error deleting positions data batch:', error);
        return { error: error.message };
      }

      return { data: undefined };
    } catch (err) {
      console.error('Unexpected error deleting positions data batch:', err);
      return { error: 'Failed to delete positions data batch' };
    }
  },

  /**
   * Get list of unique dates with imported data
   * @param firmId Firm ID
   */
  async getAvailableDates(firmId: string): Promise<ApiResponse<string[]>> {
    try {
      const { data, error } = await supabase
        .from('imported_positions_data')
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
        symbolCount: number;
      }>
    >
  > {
    try {
      const { data, error } = await supabase
        .from('imported_positions_data')
        .select('import_batch_id, import_filename, import_timestamp, as_of_business_date, symbol')
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
          symbols: Set<string>;
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
            symbols: new Set(),
          });
        }
        const batch = batches.get(batchId)!;
        batch.recordCount++;
        batch.dates.push(record.as_of_business_date);
        if (record.symbol) {
          batch.symbols.add(record.symbol);
        }
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
          symbolCount: batch.symbols.size,
        };
      });

      return { data: mapToCamelCase(batchArray) };
    } catch (err) {
      console.error('Unexpected error fetching import batches:', err);
      return { error: 'Failed to fetch import batches' };
    }
  },
};
