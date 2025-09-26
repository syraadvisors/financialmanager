import React, { useState, useMemo, useCallback } from 'react';
import { Eye, EyeOff, Download, FileSpreadsheet, Database } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useSearchContext } from '../contexts/SearchContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import SearchableVirtualTable, { SearchableTableColumn } from '../components/SearchableVirtualTable';
import { createVirtualTableHelpers, formatters } from '../components/VirtualScrollTable';
import UndoRedoControls from '../components/UndoRedoControls';

interface EnhancedBalanceDataPageProps {
  onExportData?: (data: any[], format: 'csv' | 'excel') => void;
}

const EnhancedBalanceDataPage: React.FC<EnhancedBalanceDataPageProps> = ({ onExportData }) => {
  const { state: appState } = useAppContext();
  const { state: searchState, getFilteredData, isFiltering } = useSearchContext();

  const [sortField, setSortField] = useState<string>('accountNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAllColumns, setShowAllColumns] = useState(false);

  const { balanceData } = appState;

  // Define table columns with search capabilities
  const columns: SearchableTableColumn[] = [
    {
      key: 'accountNumber',
      label: 'Account Number',
      width: 140,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'accountName',
      label: 'Account Name',
      width: 200,
      sortable: true,
      essential: true,
      searchable: true,
    },
    {
      key: 'portfolioValue',
      label: 'Portfolio Value',
      width: 140,
      sortable: true,
      essential: true,
      align: 'right',
      formatter: (value) => formatters.currency(value),
    },
    {
      key: 'totalCash',
      label: 'Total Cash',
      width: 120,
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
  ];

  // Create table helpers
  const { sortData } = createVirtualTableHelpers<any>();

  // Get data based on search/filter state
  const displayData = useMemo(() => {
    let data = balanceData;

    // Apply search results if there's a global search
    if (searchState.globalQuery && searchState.globalResults.balanceData.length >= 0) {
      data = searchState.globalResults.balanceData;
    }

    // Apply filters if there are active filters
    if (searchState.activeFilters.length > 0) {
      const filteredData = getFilteredData();
      data = filteredData.balanceData;
    }

    // Sort the data
    if (sortField) {
      data = sortData(data, sortField, sortDirection);
    }

    return data;
  }, [
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
    if (displayData.length === 0) return null;

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

  if (balanceData.length === 0) {
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
            Account Balances
          </h1>
          <p style={{
            color: '#666',
            fontSize: '14px',
            margin: 0,
          }}>
            {isFiltering
              ? `Showing ${displayData.length} of ${balanceData.length} accounts`
              : `${displayData.length} accounts loaded`
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
          <strong>Dev Info:</strong> Showing {displayData.length} rows with virtual scrolling
          {searchState.globalQuery && ` • Search: "${searchState.globalQuery}"`}
          {searchState.activeFilters.length > 0 && ` • ${searchState.activeFilters.length} filters active`}
        </div>
      )}
    </div>
  );
};

export default EnhancedBalanceDataPage;