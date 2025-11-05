import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Eye, EyeOff, Download, FileSpreadsheet, TrendingUp, Calendar } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSearchContext } from '../contexts/SearchContext';
import { useAuth } from '../contexts/AuthContext';
import { importedPositionsDataService } from '../services/api/importedPositionsData.service';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import SearchableVirtualTable, { SearchableTableColumn } from '../components/SearchableVirtualTable';
import { createVirtualTableHelpers, formatters } from '../components/VirtualScrollTable';
import UndoRedoControls from '../components/UndoRedoControls';

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
  const [databaseData, setDatabaseData] = useState<any[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const { positionsData } = appState;

  // Load available dates on mount
  useEffect(() => {
    const loadAvailableDates = async () => {
      if (!userProfile?.firmId) {
        setIsLoadingDates(false);
        return;
      }

      setIsLoadingDates(true);
      const response = await importedPositionsDataService.getAvailableDates(userProfile.firmId);

      if (response.data) {
        setAvailableDates(response.data);
        // Auto-select the most recent date
        if (response.data.length > 0) {
          setSelectedDate(response.data[0]);
        }
      }
      setIsLoadingDates(false);
    };

    loadAvailableDates();
  }, [userProfile?.firmId]);

  // Load data for selected date
  useEffect(() => {
    const loadDataForDate = async () => {
      if (!selectedDate || !userProfile?.firmId) {
        setDatabaseData([]);
        return;
      }

      setIsLoadingData(true);
      const response = await importedPositionsDataService.getByDate(userProfile.firmId, selectedDate);

      if (response.data) {
        setDatabaseData(response.data);
      } else {
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

    const sourceData = selectedDate ? databaseData : positionsData;

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
  }, [databaseData, positionsData, selectedDate]);

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

  // Get data based on search/filter state
  const displayData = useMemo(() => {
    // Use database data if a date is selected, otherwise use state data
    const sourceData = selectedDate ? databaseData : positionsData;
    let data = sourceData;

    // Apply search results if there's a global search
    if (searchState.globalQuery && searchState.globalResults.positionsData.length >= 0) {
      data = searchState.globalResults.positionsData;
    }

    // Apply filters if there are active filters
    if (searchState.activeFilters.length > 0) {
      const filteredData = getFilteredData();
      data = filteredData.positionsData;
    }

    // Sort the data
    if (sortField) {
      data = sortData(data, sortField, sortDirection);
    }

    return data;
  }, [
    selectedDate,
    databaseData,
    positionsData,
    searchState.globalQuery,
    searchState.globalResults.positionsData,
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
    console.log('Clicked position:', row, 'at index:', index);
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
    if (displayData.length === 0) return null;

    const totalMarketValue = displayData.reduce((sum, position) =>
      sum + (parseFloat(position.marketValue?.toString() || '0') || 0), 0
    );

    // Note: unrealizedGainLoss and costBasis are not in the actual data schema
    // Using marketValue as a proxy for calculations
    const totalUnrealizedGainLoss = 0; // Would need to calculate from actual cost basis
    const totalCostBasis = totalMarketValue; // Placeholder

    // Group by security type
    const securityTypes = displayData.reduce((acc, position) => {
      const type = position.securityType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { count: 0, marketValue: 0 };
      }
      acc[type].count += 1;
      acc[type].marketValue += parseFloat(position.marketValue?.toString() || '0') || 0;
      return acc;
    }, {} as { [key: string]: { count: number; marketValue: number } });

    // Get top security type
    const topSecurityType = Object.entries(securityTypes).reduce(
      (max, [type, data]) => {
        const secData = data as { count: number; marketValue: number };
        return secData.marketValue > max.marketValue ? { type, ...secData } : max;
      },
      { type: 'None', count: 0, marketValue: 0 }
    );

    const uniqueAccounts = new Set(displayData.map(p => p.accountNumber)).size;

    return {
      totalPositions: displayData.length,
      uniqueAccounts,
      totalMarketValue,
      totalUnrealizedGainLoss,
      totalCostBasis,
      returnPercentage: totalCostBasis > 0 ? (totalUnrealizedGainLoss / totalCostBasis) * 100 : 0,
      topSecurityType,
      securityTypes: Object.keys(securityTypes).length,
    };
  }, [displayData]);

  if (positionsData.length === 0 && databaseData.length === 0 && !isLoadingData) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
      }}>
        <TrendingUp size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
        <h2 style={{ color: '#666', marginBottom: '8px' }}>No Positions Data Available</h2>
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Position Holdings
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0,
          }}>
            {isFiltering
              ? `Showing ${displayData.length} of ${positionsData.length} positions`
              : `${displayData.length} positions loaded`
            }
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <UndoRedoControls variant="horizontal" size="small" showLabels={false} />

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
            <div style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: summaryStats.totalUnrealizedGainLoss >= 0 ? '#4caf50' : '#f44336',
              marginBottom: '4px'
            }}>
              {formatters.currency(summaryStats.totalUnrealizedGainLoss)}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Unrealized G/L ({formatters.percentage(summaryStats.returnPercentage)})
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#9c27b0', marginBottom: '4px' }}>
              {summaryStats.topSecurityType.type}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              Top Security Type ({formatters.currency(summaryStats.topSecurityType.marketValue)})
            </div>
          </div>
        </div>
      )}

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
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#1976d2',
        }}>
          <strong>Dev Info:</strong> Showing {displayData.length} rows with virtual scrolling and search highlighting
          {searchState.globalQuery && ` • Search: "${searchState.globalQuery}"`}
          {searchState.activeFilters.length > 0 && ` • ${searchState.activeFilters.length} filters active`}
        </div>
      )}
    </div>
  );
};

export default EnhancedPositionsDataPage;