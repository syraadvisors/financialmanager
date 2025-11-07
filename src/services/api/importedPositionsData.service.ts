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
      // If limit/offset provided, use them (for specific pagination requests)
      if (limit || offset) {
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
      }

      // Otherwise, fetch all data with automatic pagination (Supabase has 1000-row limit)
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let currentPage = 0;
      let hasMore = true;

      while (hasMore) {
        const start = currentPage * PAGE_SIZE;
        const end = start + PAGE_SIZE - 1;

        const { data, error } = await supabase
          .from('imported_positions_data')
          .select('*')
          .eq('firm_id', firmId)
          .order('as_of_business_date', { ascending: false })
          .order('account_number', { ascending: true })
          .order('symbol', { ascending: true })
          .range(start, end);

        if (error) {
          console.error('Error fetching imported positions data:', error);
          return { error: error.message };
        }

        if (data && data.length > 0) {
          allData = allData.concat(data);
        }

        // If we got less than PAGE_SIZE records, we've reached the end
        hasMore = data && data.length === PAGE_SIZE;
        currentPage++;

        // Safety check to prevent infinite loops
        if (currentPage > 100) {
          console.warn('[importedPositionsDataService.getAll] Hit safety limit of 100 pages');
          break;
        }
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(allData) || [] };
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
   * Get positions data for a specific date (only most recent import)
   * @param firmId Firm ID
   * @param date Date string (YYYY-MM-DD)
   */
  async getByDate(
    firmId: string,
    date: string
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      // First, find the most recent import batch for this date
      const { data: batchData, error: batchError } = await supabase
        .from('imported_positions_data')
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
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId)
        .eq('as_of_business_date', date)
        .eq('import_batch_id', batchData.import_batch_id)
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

  /**
   * Get count of imported positions data records for a firm
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
          .from('imported_positions_data')
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
          .from('imported_positions_data')
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
      console.error('Unexpected error fetching positions data count:', err);
      return { error: 'Failed to fetch positions data count' };
    }
  },

  /**
   * Get summary statistics for positions without loading all records
   * @param firmId Firm ID
   * @param asOfDate Optional specific date (defaults to most recent)
   */
  async getSummaryStats(
    firmId: string,
    asOfDate?: string
  ): Promise<ApiResponse<{
    totalPositions: number;
    totalMarketValue: number;
    uniqueAccounts: number;
    asOfBusinessDate: string;
    securityTypeCounts: { [key: string]: number };
  }>> {
    try {
      // If no date specified, get stats across ALL dates
      if (!asOfDate || asOfDate === '') {
        return await this.getSummaryStatsAllDates(firmId);
      }

      const targetDate = asOfDate;

      // Get the most recent import batch for this date
      const { data: batchData, error: batchError } = await supabase
        .from('imported_positions_data')
        .select('import_batch_id')
        .eq('firm_id', firmId)
        .eq('as_of_business_date', targetDate)
        .order('import_timestamp', { ascending: false })
        .limit(1)
        .single();

      if (batchError || !batchData) {
        return { error: 'No data found for the specified date' };
      }

      // Get aggregated statistics using SQL
      const { data, error } = await supabase.rpc('get_positions_summary_stats', {
        p_firm_id: firmId,
        p_as_of_date: targetDate,
        p_batch_id: batchData.import_batch_id
      });

      if (error) {
        console.error('[getSummaryStats] RPC error:', error);
        // Fallback: calculate stats by fetching minimal data
        return await this.getSummaryStatsFallback(firmId, targetDate, batchData.import_batch_id);
      }

      return { data: mapToCamelCase(data) };
    } catch (err) {
      console.error('Unexpected error fetching summary stats:', err);
      return { error: 'Failed to fetch summary statistics' };
    }
  },

  /**
   * Fallback method to calculate summary stats if RPC function doesn't exist
   */
  async getSummaryStatsFallback(
    firmId: string,
    asOfDate: string,
    batchId: string
  ): Promise<ApiResponse<{
    totalPositions: number;
    totalMarketValue: number;
    uniqueAccounts: number;
    asOfBusinessDate: string;
    securityTypeCounts: { [key: string]: number };
  }>> {
    try {
      // Get total count using Supabase count feature
      const { count, error: countError } = await supabase
        .from('imported_positions_data')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', firmId)
        .eq('as_of_business_date', asOfDate)
        .eq('import_batch_id', batchId);

      if (countError) {
        console.error('[getSummaryStatsFallback] Count error:', countError);
        return { error: countError.message };
      }

      const totalPositions = count || 0;

      if (totalPositions === 0) {
        return { error: 'No positions found' };
      }

      // Fetch ALL records for detailed calculations (account_number, market_value, security_type only)
      // We need to fetch in batches to avoid Supabase 1000 row limit
      const batchSize = 1000;
      let allData: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase
          .from('imported_positions_data')
          .select('account_number, market_value, security_type')
          .eq('firm_id', firmId)
          .eq('as_of_business_date', asOfDate)
          .eq('import_batch_id', batchId)
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          console.error('[getSummaryStatsFallback] Batch error:', batchError);
          return { error: batchError.message };
        }

        if (batchData && batchData.length > 0) {
          allData = [...allData, ...batchData];
          offset += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[getSummaryStatsFallback] Fetched ${allData.length} records in batches for calculations`);

      // Calculate statistics
      const uniqueAccounts = new Set(allData.map(r => r.account_number)).size;
      const totalMarketValue = allData.reduce((sum, r) => sum + (parseFloat(r.market_value) || 0), 0);
      const securityTypeCounts: { [key: string]: number } = {};

      allData.forEach(r => {
        const type = r.security_type || 'Unknown';
        securityTypeCounts[type] = (securityTypeCounts[type] || 0) + 1;
      });

      return {
        data: {
          totalPositions,  // Use the exact count from count query
          totalMarketValue,
          uniqueAccounts,
          asOfBusinessDate: asOfDate,
          securityTypeCounts
        }
      };
    } catch (err) {
      console.error('Unexpected error in getSummaryStatsFallback:', err);
      return { error: 'Failed to calculate summary statistics' };
    }
  },

  /**
   * Get summary statistics across ALL dates (not filtered by date)
   */
  async getSummaryStatsAllDates(
    firmId: string
  ): Promise<ApiResponse<{
    totalPositions: number;
    totalMarketValue: number;
    uniqueAccounts: number;
    asOfBusinessDate: string;
    securityTypeCounts: { [key: string]: number };
  }>> {
    try {
      // Get total count across all dates
      const { count, error: countError } = await supabase
        .from('imported_positions_data')
        .select('*', { count: 'exact', head: true })
        .eq('firm_id', firmId);

      if (countError) {
        console.error('[getSummaryStatsAllDates] Count error:', countError);
        return { error: countError.message };
      }

      const totalPositions = count || 0;

      if (totalPositions === 0) {
        return { error: 'No positions found' };
      }

      // Fetch ALL records across all dates in batches
      const batchSize = 1000;
      let allData: any[] = [];
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase
          .from('imported_positions_data')
          .select('account_number, market_value, security_type, as_of_business_date')
          .eq('firm_id', firmId)
          .range(offset, offset + batchSize - 1);

        if (batchError) {
          console.error('[getSummaryStatsAllDates] Batch error:', batchError);
          return { error: batchError.message };
        }

        if (batchData && batchData.length > 0) {
          allData = [...allData, ...batchData];
          offset += batchSize;
          hasMore = batchData.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      console.log(`[getSummaryStatsAllDates] Fetched ${allData.length} records across all dates`);

      // Calculate statistics
      const uniqueAccounts = new Set(allData.map(r => r.account_number)).size;
      const totalMarketValue = allData.reduce((sum, r) => sum + (parseFloat(r.market_value) || 0), 0);
      const securityTypeCounts: { [key: string]: number } = {};

      allData.forEach(r => {
        const type = r.security_type || 'Unknown';
        securityTypeCounts[type] = (securityTypeCounts[type] || 0) + 1;
      });

      return {
        data: {
          totalPositions,
          totalMarketValue,
          uniqueAccounts,
          asOfBusinessDate: 'All Dates',
          securityTypeCounts
        }
      };
    } catch (err) {
      console.error('Unexpected error in getSummaryStatsAllDates:', err);
      return { error: 'Failed to calculate summary statistics across all dates' };
    }
  },

  /**
   * Search positions by various criteria
   * @param firmId Firm ID
   * @param searchParams Search parameters
   */
  async searchPositions(
    firmId: string,
    searchParams: {
      query?: string; // Search across symbol, description, account number
      accountNumber?: string;
      symbol?: string;
      securityType?: string;
      asOfDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<ApiResponse<ImportedPositionsDataRecord[]>> {
    try {
      const { query, accountNumber, symbol, securityType, asOfDate, limit = 100, offset = 0 } = searchParams;

      // Build query - if no date specified, search across ALL dates
      let dbQuery = supabase
        .from('imported_positions_data')
        .select('*')
        .eq('firm_id', firmId);

      // If a specific date is provided, filter by that date and its batch
      if (asOfDate && asOfDate !== '') {
        // Get the most recent import batch for this date
        const { data: batchData, error: batchError } = await supabase
          .from('imported_positions_data')
          .select('import_batch_id')
          .eq('firm_id', firmId)
          .eq('as_of_business_date', asOfDate)
          .order('import_timestamp', { ascending: false })
          .limit(1)
          .single();

        if (batchError || !batchData) {
          return { error: 'No data found for the specified date' };
        }

        dbQuery = dbQuery
          .eq('as_of_business_date', asOfDate)
          .eq('import_batch_id', batchData.import_batch_id);
      }

      // Apply specific filters
      if (accountNumber) {
        dbQuery = dbQuery.eq('account_number', accountNumber);
      }

      if (symbol) {
        dbQuery = dbQuery.ilike('symbol', `%${symbol}%`);
      }

      if (securityType) {
        dbQuery = dbQuery.eq('security_type', securityType);
      }

      // Apply general search query (searches multiple fields)
      if (query && query.trim()) {
        dbQuery = dbQuery.or(
          `symbol.ilike.%${query}%,security_description.ilike.%${query}%,account_number.ilike.%${query}%`
        );
      }

      // Apply pagination
      dbQuery = dbQuery
        .order('market_value', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error } = await dbQuery;

      if (error) {
        console.error('[searchPositions] Error:', error);
        return { error: error.message };
      }

      return { data: mapToCamelCase<ImportedPositionsDataRecord[]>(data) || [] };
    } catch (err) {
      console.error('Unexpected error searching positions:', err);
      return { error: 'Failed to search positions' };
    }
  },
};
