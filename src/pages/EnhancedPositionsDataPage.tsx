import React, { useState, useMemo, useCallback } from 'react';
import { Eye, EyeOff, Download, FileSpreadsheet, TrendingUp } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSearchContext } from '../contexts/SearchContext';
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

  const [sortField, setSortField] = useState<string>('marketValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllColumns, setShowAllColumns] = useState(false);

  const { positionsData } = appState;

  // Define table columns with search capabilities
  const columns: SearchableTableColumn[] = [
    {
      key: 'accountNumber',
      label: 'Account',
      width: 120,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'symbol',
      label: 'Symbol',
      width: 100,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'securityDescription',
      label: 'Description',
      width: 200,
      sortable: true,
      essential: true,
      searchable: true,
      formatter: (value) => formatters.truncate(value, 40),
    },
    {
      key: 'securityType',
      label: 'Type',
      width: 100,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'marketValue',
      label: 'Market Value',
      width: 120,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'numberOfShares',
      label: 'Shares',
      width: 100,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.number(value, 2),
    },
    {
      key: 'price',
      label: 'Price',
      width: 100,
      sortable: true,
      essential: false,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'longShort',
      label: 'Long/Short',
      width: 100,
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
      width: 100,
      sortable: true,
      essential: false,
      align: 'center',
    },
  ];

  // Create table helpers
  const { sortData } = createVirtualTableHelpers<any>();

  // Get data based on search/filter state
  const displayData = useMemo(() => {
    let data = positionsData;

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
    const topSecurityType = Object.entries(securityTypes).reduce((max, [type, data]) =>
      data.marketValue > max.marketValue ? { type, ...data } : max,
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

  if (positionsData.length === 0) {
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
          rowHeight={50}
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