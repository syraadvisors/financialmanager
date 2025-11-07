import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Download, FileSpreadsheet, Database, Calendar } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSearchContext } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { importedBalanceDataService } from '../services/api/importedBalanceData.service';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import SearchableVirtualTable, { SearchableTableColumn } from '../components/SearchableVirtualTable';
import { createVirtualTableHelpers, formatters } from '../components/VirtualScrollTable';

interface EnhancedBalanceDataPageProps {
  onExportData?: (data: any[], format: 'csv' | 'excel') => void;
}

const EnhancedBalanceDataPage: React.FC<EnhancedBalanceDataPageProps> = ({ onExportData }) => {
  const { state: appState } = useAppContext();
  const { state: searchState, getFilteredData, isFiltering } = useSearchContext();
  const { userProfile } = useAuth();

  const [sortField, setSortField] = useState<string>('accountNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [databaseData, setDatabaseData] = useState<any[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { balanceData } = appState;

  // Load available dates on mount
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!userProfile?.firmId) {
        setIsLoadingDates(false);
        return;
      }

      setIsLoadingDates(true);
      const response = await importedBalanceDataService.getAvailableDates(userProfile.firmId);

      console.log('[EnhancedBalanceDataPage] Available dates from database:', response.data);

      if (response.data) {
        setAvailableDates(response.data);
        // Auto-select the most recent date
        if (response.data.length > 0) {
          console.log('[EnhancedBalanceDataPage] Auto-selecting first date:', response.data[0]);
          setSelectedDate(response.data[0]);
        }
      }
      setIsLoadingDates(false);
    };

    loadAvailableDates();
  }, [userProfile?.firmId]);

  // Load ALL data for selected date, then deduplicate by keeping most recent import per account
  useEffect(() => {
    const loadDataForDate = async () => {
      if (!selectedDate || !userProfile?.firmId) {
        setDatabaseData([]);
        return;
      }

      console.log('[EnhancedBalanceDataPage] Loading data for date:', selectedDate);
      setIsLoadingData(true);

      // Get ALL records for this date (from all import batches)
      const response = await importedBalanceDataService.getAll(userProfile.firmId);

      console.log('[EnhancedBalanceDataPage] Got response from getAll:', {
        dataLength: response.data?.length,
        hasError: !!response.error,
        error: response.error,
        firstRecord: response.data?.[0]
      });

      if (response.data) {
        // Filter to only this date
        const dateFiltered = response.data.filter(row => {
          const match = row.asOfBusinessDate === selectedDate;
          if (!match && response.data!.length < 5) {
            console.log('[EnhancedBalanceDataPage] Date mismatch:', {
              rowDate: row.asOfBusinessDate,
              rowDateType: typeof row.asOfBusinessDate,
              selectedDate,
              selectedDateType: typeof selectedDate
            });
          }
          return match;
        });

        console.log('[EnhancedBalanceDataPage] After date filtering:', {
          totalRecords: response.data.length,
          dateFilteredCount: dateFiltered.length,
          selectedDate
        });

        // Deduplicate: keep only the most recent import for each account
        // Group by account number
        const accountMap = new Map<string, any>();
        let duplicateCount = 0;
        let keptCount = 0;

        dateFiltered.forEach((row, index) => {
          const accountNumber = row.accountNumber;
          const existing = accountMap.get(accountNumber);

          if (existing) {
            duplicateCount++;
            // Debug first few duplicates
            if (duplicateCount <= 10) {
              console.log('[EnhancedBalanceDataPage] Duplicate account found:', {
                accountNumber,
                existingTimestamp: existing.importTimestamp,
                existingBatchId: existing.importBatchId,
                newTimestamp: row.importTimestamp,
                newBatchId: row.importBatchId,
                keepingNew: !existing || (row.importTimestamp && (!existing.importTimestamp || row.importTimestamp > existing.importTimestamp))
              });
            }
          }

          // If no existing or this one is more recent, keep it
          if (!existing || (row.importTimestamp && (!existing.importTimestamp || row.importTimestamp > existing.importTimestamp))) {
            accountMap.set(accountNumber, row);
            if (!existing) keptCount++;
          }
        });

        // Convert map back to array
        const deduplicatedData = Array.from(accountMap.values());
        console.log('[EnhancedBalanceDataPage] Deduplication summary:', {
          totalRecordsProcessed: dateFiltered.length,
          uniqueAccountsFound: accountMap.size,
          duplicatesEncountered: duplicateCount,
          finalRecordCount: deduplicatedData.length,
          newAccountsAdded: keptCount
        });
        setDatabaseData(deduplicatedData);
      } else {
        console.log('[EnhancedBalanceDataPage] No data returned or error occurred');
        setDatabaseData([]);
      }
      setIsLoadingData(false);
    };

    loadDataForDate();
  }, [selectedDate, userProfile?.firmId]);

  // Calculate dynamic column widths based on data content
  const calculateColumnWidths = useMemo(() => {
    const calculateTextWidth = (text: string, basePx = 9) => {
      // More generous approximation: 1 character ≈ 9px for typical font, add padding for cell spacing
      // Adding 60px for cell padding (30px each side) to ensure text fits comfortably
      return Math.max(100, (text?.length || 0) * basePx + 60);
    };

    const sourceData = selectedDate ? databaseData : balanceData;

    if (sourceData.length === 0) {
      // Default widths when no data
      return {
        date: 110,
        accountNumber: 130,
        accountName: 350,
        portfolioValue: 160,
        totalCash: 140,
      };
    }

    const accountNumberWidth = Math.max(
      130,
      ...sourceData.map(r => calculateTextWidth(String(r.accountNumber || '')))
    );
    const accountNameWidth = Math.max(
      300,
      ...sourceData.map(r => calculateTextWidth(String(r.accountName || '')))
    );

    return {
      date: 110,
      accountNumber: Math.min(accountNumberWidth, 200),
      accountName: Math.min(accountNameWidth, 800), // Increased max to accommodate long names
      portfolioValue: 160,
      totalCash: 140,
    };
  }, [databaseData, balanceData, selectedDate]);

  // Define table columns with search capabilities
  // Columns match preview: asOfBusinessDate, accountNumber, accountName, portfolioValue, totalCash
  const columns: SearchableTableColumn[] = useMemo(() => [
    {
      key: 'asOfBusinessDate',
      label: 'Date',
      width: calculateColumnWidths.date,
      sortable: true,
      essential: true,
      formatter: (value) => formatters.date(value),
    },
    {
      key: 'accountNumber',
      label: 'Account #',
      width: calculateColumnWidths.accountNumber,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'accountName',
      label: 'Account Name',
      width: calculateColumnWidths.accountName,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'portfolioValue',
      label: 'Portfolio Value',
      width: calculateColumnWidths.portfolioValue,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'totalCash',
      label: 'Total Cash',
      width: calculateColumnWidths.totalCash,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'netMarketValue',
      label: 'Net Market Value',
      width: 120,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'marketValueShort',
      label: 'Market Value Short',
      width: 120,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'equityPercentage',
      label: 'Equity %',
      width: 120,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.percentage(value),
    },
    {
      key: 'marginBuyingPower',
      label: 'Buying Power',
      width: 120,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'asOfBusinessDate',
      label: 'As Of Date',
      width: 120,
      sortable: true,
      essential: false,
      formatter: (value) => formatters.date(value),
    },
  ], [calculateColumnWidths]);

  // Create table helpers
  const { sortData } = createVirtualTableHelpers<any>();

  // Get data based on search/filter state
  const displayData = useMemo(() => {
    // Use database data if a date is selected, otherwise use state data
    const sourceData = selectedDate ? databaseData : balanceData;
    let data = sourceData;

    // Apply search results if there's a global search with actual query
    if (searchState.globalQuery && searchState.globalQuery.trim()) {
      data = searchState.globalResults.balanceData;
    }
    // Apply filters if there are active filters (but no search)
    else if (searchState.activeFilters.length > 0) {
      const filteredData = getFilteredData();
      data = filteredData.balanceData;
    }

    // Filter out any null/undefined rows and ensure data is valid
    data = (data || []).filter(row => row != null && typeof row === 'object');

    // Sort the data
    if (sortField && data.length > 0) {
      data = sortData(data, sortField, sortDirection);
    }

    return data;
  }, [
    selectedDate,
    databaseData,
    balanceData,
    searchState.globalQuery,
    searchState.globalResults.balanceData,
    searchState.activeFilters,
    getFilteredData,
    sortField,
    sortDirection,
    sortData
  ]);

  // Handle sorting
  const handleSort = useCallback((field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  }, []);

  // Handle row click
  const handleRowClick = useCallback((row: any, index: number) => {
    console.log('Clicked row:', row, 'at index:', index);
    // Could open a detail modal or navigate to detail page
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'excel') => {
    if (onExportData) {
      onExportData(displayData, format);
    }
  }, [displayData, onExportData]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    console.log('[EnhancedBalanceDataPage] displayData length:', displayData.length);
    if (displayData.length === 0) {
      console.log('[EnhancedBalanceDataPage] No displayData, returning null for summary');
      return null;
    }

    const totalPortfolioValue = displayData.reduce((sum, account) =>
      sum + (parseFloat(account.portfolioValue?.toString() || '0') || 0), 0
    );

    const totalCash = displayData.reduce((sum, account) =>
      sum + (parseFloat(account.totalCash?.toString() || '0') || 0), 0
    );

    const totalEquity = displayData.reduce((sum, account) =>
      sum + (parseFloat(account.netMarketValue?.toString() || '0') || 0), 0
    );

    const averagePortfolioValue = totalPortfolioValue / displayData.length;

    return {
      totalAccounts: displayData.length,
      totalPortfolioValue,
      totalCash,
      totalEquity,
      averagePortfolioValue,
      cashPercentage: totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0,
    };
  }, [displayData]);

  if (balanceData.length === 0 && databaseData.length === 0 && !isLoadingData) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
      }}>
        <Database size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
        <h2 style={{ color: '#666', marginBottom: '8px' }}>No Balance Data Available</h2>
        <p style={{ color: '#999' }}>
          Import balance data to view account information and portfolio values.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Page Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Account Balances
          </h1>
          {isFiltering && (
            <p style={{
              color: '#666',
              fontSize: '14px',
              margin: 0,
            }}>
              Showing {displayData.length} of {balanceData.length} accounts
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Date Filter */}
          {availableDates.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: '#666' }} />
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoadingDates || isLoadingData}
                style={{
                  padding: '8px 12px',
                  backgroundColor: 'white',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  minWidth: '150px',
                }}
              >
                {availableDates.map((date) => {
                  // Parse YYYY-MM-DD as local date to avoid timezone shift
                  const [year, month, day] = date.split('-').map(Number);
                  const localDate = new Date(year, month - 1, day);
                  return (
                    <option key={date} value={date}>
                      {localDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </option>
                  );
                })}
              </select>
              {isLoadingData && (
                <span style={{ fontSize: '12px', color: '#666' }}>Loading...</span>
              )}
            </div>
          )}

          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            style={{
              padding: '8px 12px',
              backgroundColor: showAllColumns ? '#2196f3' : 'white',
              color: showAllColumns ? 'white' : '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showAllColumns ? <EyeOff size={14} /> : <Eye size={14} />}
            {showAllColumns ? 'Hide Columns' : 'Show All'}
          </button>

          <button
            onClick={() => handleExport('csv')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Download size={14} />
            Export CSV
          </button>

          <button
            onClick={() => handleExport('excel')}
            style={{
              padding: '8px 12px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <FileSpreadsheet size={14} />
            Export Excel
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      {summaryStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
          flexShrink: 0,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3', marginBottom: '4px' }}>
              {summaryStats.totalAccounts.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Accounts</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50', marginBottom: '4px' }}>
              {formatters.currency(summaryStats.totalPortfolioValue)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Portfolio Value</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800', marginBottom: '4px' }}>
              {formatters.currency(summaryStats.totalCash)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Total Cash ({formatters.percentage(summaryStats.cashPercentage)})
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '4px' }}>
              {formatters.currency(summaryStats.averagePortfolioValue)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Average Account Value</div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          {(() => {
            console.log('[EnhancedBalanceDataPage] About to render SearchableVirtualTable');
            console.log('[EnhancedBalanceDataPage] displayData:', displayData);
            console.log('[EnhancedBalanceDataPage] columns:', columns);
            return (
              <SearchableVirtualTable
                data={displayData}
                columns={columns}
                height="100%"
                rowHeight={40}
                showAllColumns={showAllColumns}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onRowClick={handleRowClick}
                loading={appState.isLoading}
                enableHighlighting={true}
                showSearchIndicator={true}
                overscanCount={10}
              />
            );
          })()}
        </ErrorBoundary>
      </div>

      {/* Performance Info */}
    </div>
  );
};

export default EnhancedBalanceDataPage;
