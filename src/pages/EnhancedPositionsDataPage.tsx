import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Download, FileSpreadsheet, TrendingUp, Calendar, Search } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSearchContext } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { importedPositionsDataService } from '../services/api/importedPositionsData.service';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import SearchableVirtualTable, { SearchableTableColumn } from '../components/SearchableVirtualTable';
import { createVirtualTableHelpers, formatters } from '../components/VirtualScrollTable';

interface EnhancedPositionsDataPageProps {
  onExportData?: (data: any[], format: 'csv' | 'excel') => void;
}

const EnhancedPositionsDataPage: React.FC<EnhancedPositionsDataPageProps> = ({ onExportData }) => {
  const { state: appState } = useAppContext();
  const { state: searchState, getFilteredData, isFiltering } = useSearchContext();
  const { userProfile } = useAuth();

  const [sortField, setSortField] = useState<string>('marketValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isLoadingDates, setIsLoadingDates] = useState(true);

  const { positionsData } = appState;

  console.log('[EnhancedPositionsDataPage] Component rendered');
  console.log('[EnhancedPositionsDataPage] State:', {
    summaryStats,
    searchResultsLength: searchResults.length,
    searchQuery,
    isLoadingStats,
    isLoadingSearch,
    selectedDate,
    availableDatesLength: availableDates.length,
  });

  // Load summary statistics on mount (lightweight!)
  useEffect(() => {
    const loadSummaryStats = async () => {
      if (!userProfile?.firmId) {
        console.log('[EnhancedPositionsDataPage] No firmId, skipping stats load');
        setIsLoadingStats(false);
        return;
      }

      console.log('[EnhancedPositionsDataPage] Loading summary statistics for firm:', userProfile.firmId);
      setIsLoadingStats(true);

      const response = await importedPositionsDataService.getSummaryStats(userProfile.firmId, selectedDate);

      console.log('[EnhancedPositionsDataPage] Got summary stats:', {
        hasData: !!response.data,
        hasError: !!response.error,
        error: response.error,
        stats: response.data
      });

      if (response.data) {
        setSummaryStats(response.data);
      } else {
        console.error('[EnhancedPositionsDataPage] Error loading stats:', response.error);
        setSummaryStats(null);
      }
      setIsLoadingStats(false);
    };

    loadSummaryStats();
  }, [userProfile?.firmId, selectedDate]);

  // Load available dates on mount
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!userProfile?.firmId) {
        setIsLoadingDates(false);
        return;
      }

      console.log('[EnhancedPositionsDataPage] Loading available dates');
      setIsLoadingDates(true);
      const response = await importedPositionsDataService.getAvailableDates(userProfile.firmId);

      if (response.data) {
        console.log('[EnhancedPositionsDataPage] Available dates:', response.data);
        setAvailableDates(response.data);
        // Auto-select the most recent date (first in array) by default
        if (!selectedDate && response.data.length > 0) {
          setSelectedDate(response.data[0]);
          console.log('[EnhancedPositionsDataPage] Auto-selected most recent date:', response.data[0]);
        }
      }
      setIsLoadingDates(false);
    };

    loadAvailableDates();
  }, [userProfile?.firmId]);

  // Debounce search query to avoid flickering results
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!userProfile?.firmId) return;

      // If query is empty, clear results
      if (!debouncedSearchQuery.trim()) {
        setSearchResults([]);
        setIsLoadingSearch(false);
        return;
      }

      console.log('[EnhancedPositionsDataPage] Searching for:', debouncedSearchQuery);
      setIsLoadingSearch(true);

      const response = await importedPositionsDataService.searchPositions(userProfile.firmId, {
        query: debouncedSearchQuery.trim(),
        asOfDate: selectedDate,
        limit: 100
      });

      console.log('[EnhancedPositionsDataPage] Search results:', {
        query: debouncedSearchQuery,
        resultsLength: response.data?.length,
        hasError: !!response.error
      });

      if (response.data) {
        setSearchResults(response.data);
      } else {
        setSearchResults([]);
      }
      setIsLoadingSearch(false);
    };

    performSearch();
  }, [debouncedSearchQuery, userProfile?.firmId, selectedDate]);

  // Handle search input change
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      setIsLoadingSearch(true); // Show loading immediately on input
    }
  }, []);

  // Calculate dynamic column widths based on data content
  const calculateColumnWidths = useMemo(() => {
    const calculateTextWidth = (text: string, basePx = 9) => {
      // More generous approximation: 1 character ≈ 9px for typical font, add padding for cell spacing
      // Adding 60px for cell padding (30px each side) to ensure text fits comfortably
      return Math.max(100, (text?.length || 0) * basePx + 60);
    };

    // Use search results for width calculation
    const sourceData = searchResults;

    if (sourceData.length === 0) {
      // Default widths when no data
      return {
        accountNumber: 130,
        symbol: 110,
        description: 300,
        type: 110,
        marketValue: 140,
        shares: 120,
      };
    }

    const accountNumberWidth = Math.max(
      130,
      ...sourceData.map(r => calculateTextWidth(String(r.accountNumber || '')))
    );
    const symbolWidth = Math.max(
      110,
      ...sourceData.map(r => calculateTextWidth(String(r.symbol || '')))
    );
    const descriptionWidth = Math.max(
      300,
      ...sourceData.map(r => calculateTextWidth(String(r.securityDescription || '')))
    );
    const typeWidth = Math.max(
      110,
      ...sourceData.map(r => calculateTextWidth(String(r.securityType || '')))
    );

    return {
      accountNumber: Math.min(accountNumberWidth, 200),
      symbol: Math.min(symbolWidth, 180),
      description: Math.min(descriptionWidth, 900), // Increased max for long descriptions
      type: Math.min(typeWidth, 200),
      marketValue: 140,
      shares: 120,
    };
  }, [searchResults]);

  // Define table columns with search capabilities
  const columns: SearchableTableColumn[] = useMemo(() => [
    {
      key: 'accountNumber',
      label: 'Account #',
      width: calculateColumnWidths.accountNumber,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      width: calculateColumnWidths.symbol,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'securityDescription',
      label: 'Description',
      width: calculateColumnWidths.description,
      sortable: true,
      essential: true,
      searchable: true,
      formatter: (value) => formatters.truncate(value, 50),
    },
    {
      key: 'securityType',
      label: 'Type',
      width: calculateColumnWidths.type,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'marketValue',
      label: 'Market Value',
      width: calculateColumnWidths.marketValue,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'numberOfShares',
      label: 'Shares',
      width: calculateColumnWidths.shares,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.number(value, 2),
    },
    {
      key: 'price',
      label: 'Price',
      width: 110,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'longShort',
      label: 'Long/Short',
      width: 110,
      sortable: true,
      essential: false,
      align: 'center',
    },
    {
      key: 'dateOfPrice',
      label: 'Price Date',
      width: 110,
      sortable: true,
      essential: false,
      align: 'center',
      formatter: (value) => formatters.date(value),
    },
    {
      key: 'accountingRuleCode',
      label: 'Rule Code',
      width: 110,
      sortable: true,
      essential: false,
      align: 'center',
    },
  ], [calculateColumnWidths]);

  // Create table helpers
  const { sortData } = createVirtualTableHelpers<any>();

  // Get data based on search results
  const displayData = useMemo(() => {
    let data = searchResults;

    console.log('[EnhancedPositionsDataPage] displayData recalculating:', {
      searchResultsLength: searchResults.length,
      searchQuery,
      isLoadingSearch,
    });

    // Sort the data
    if (sortField && data.length > 0) {
      data = sortData(data, sortField, sortDirection);
    }

    console.log('[EnhancedPositionsDataPage] Final displayData length:', data.length);
    return data;
  }, [
    searchResults,
    searchQuery,
    isLoadingSearch,
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
    console.log('Clicked position:', row, 'at index:', index);
    // Could open a detail modal or navigate to detail page
  }, []);

  // Handle export
  const handleExport = useCallback((format: 'csv' | 'excel') => {
    if (onExportData) {
      onExportData(displayData, format);
    }
  }, [displayData, onExportData]);

  // Show empty state only if not loading and no stats available
  if (!summaryStats && !isLoadingStats) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
      }}>
        <TrendingUp size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
        <h2 style={{ color: '#666', marginBottom: '8px' }}>No Positions Available</h2>
        <p style={{ color: '#999' }}>
          Import positions data to view individual holdings and their performance.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '24px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Page Header */}
      <div style={{
        marginBottom: '24px',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0,
          }}>
            Positions
          </h1>
        </div>

        {/* Action Buttons Row */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
          {/* Date Filter - Prominent Display */}
          {availableDates.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              backgroundColor: 'white',
              padding: '10px 16px',
              borderRadius: '6px',
              border: '2px solid #2196f3',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              whiteSpace: 'nowrap',
            }}>
              <Calendar size={18} style={{ color: '#2196f3', flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: '600', color: '#666', whiteSpace: 'nowrap' }}>Display Data As Of:</span>
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                disabled={isLoadingDates || isLoadingStats}
                style={{
                  padding: '6px 10px',
                  backgroundColor: 'white',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: '500',
                  minWidth: '160px',
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
              {isLoadingStats && (
                <span style={{ fontSize: '12px', color: '#2196f3', fontWeight: '500', whiteSpace: 'nowrap' }}>Loading...</span>
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
            {showAllColumns ? 'Hide Optional Columns' : 'Show All Columns'}
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
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3', marginBottom: '4px' }}>
              {summaryStats.totalPositions.toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Total Positions ({summaryStats.uniqueAccounts} accounts)
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50', marginBottom: '4px' }}>
              {formatters.currency(summaryStats.totalMarketValue)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Market Value</div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '4px' }}>
              {Object.keys(summaryStats.securityTypeCounts || {}).length} Types
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Security Types: {Object.entries(summaryStats.securityTypeCounts || {}).map(([type, count]) => `${type} (${count})`).slice(0, 3).join(', ')}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff9800', marginBottom: '4px' }}>
              {searchResults.length > 0 ? searchResults.length : 'Search'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {searchResults.length > 0 ? `Showing ${searchResults.length} search results` : 'Enter search to view positions'}
            </div>
          </div>
        </div>
      )}

      {/* Prominent Search Box Section */}
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        border: '2px solid #e0e0e0',
        marginBottom: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      }}>
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#333',
            margin: '0 0 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <Search size={20} style={{ color: '#2196f3' }} />
            Search Positions
          </h2>
          <p style={{
            fontSize: '14px',
            color: '#666',
            margin: 0
          }}>
            {searchResults.length > 0
              ? `Showing ${searchResults.length} matching position${searchResults.length === 1 ? '' : 's'}`
              : 'Enter a search term below to view individual positions. Search by symbol, security description, or account number.'
            }
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <Search size={24} style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Type to search (e.g., AAPL, Apple Inc, or account number)..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '16px 16px 16px 52px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '16px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.target.style.borderColor = '#2196f3'}
            onBlur={(e) => e.target.style.borderColor = '#ddd'}
          />
          {isLoadingSearch && (
            <span style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '14px',
              color: '#2196f3',
              fontWeight: '500',
            }}>
              Searching...
            </span>
          )}
        </div>

        {!searchQuery && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#e3f2fd',
            borderRadius: '4px',
            fontSize: '13px',
            color: '#1565c0',
            display: 'flex',
            alignItems: 'start',
            gap: '8px',
          }}>
            <TrendingUp size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span>
              <strong>Tip:</strong> For better performance with large datasets, positions are only loaded when you search. Start typing to view results.
            </span>
          </div>
        )}
      </div>

      {/* Data Table */}
      <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
        <SearchableVirtualTable
          data={displayData}
          columns={columns}
          height={600}
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
      </ErrorBoundary>

      {/* Performance Info */}
    </div>
  );
};

export default EnhancedPositionsDataPage;