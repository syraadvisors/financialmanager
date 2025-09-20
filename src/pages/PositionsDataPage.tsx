import React, { useState, useMemo } from 'react';
import { Search, Eye, EyeOff, SortAsc, SortDesc, TrendingUp, DollarSign } from 'lucide-react';
import { AppState } from '../types/NavigationTypes';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import ExportButton from '../components/ExportButton';

interface PositionsDataPageProps {
  appState: AppState;
  onExportData?: (data: any[], format: 'csv' | 'excel') => void;
}

const PositionsDataPage: React.FC<PositionsDataPageProps> = ({ appState, onExportData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('marketValue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState<string>('all');
  const itemsPerPage = 25;

  const { positionsData } = appState;

  // Get unique security types for filter
  const securityTypes = useMemo(() => {
    const types = new Set(positionsData.map(pos => pos.securityType).filter(Boolean));
    return Array.from(types).sort();
  }, [positionsData]);

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = positionsData.filter(position => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = (
          position.accountNumber?.toLowerCase().includes(searchLower) ||
          position.accountName?.toLowerCase().includes(searchLower) ||
          position.symbol?.toLowerCase().includes(searchLower) ||
          position.securityDescription?.toLowerCase().includes(searchLower) ||
          position.securityType?.toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Type filter
      if (filterType !== 'all' && position.securityType !== filterType) {
        return false;
      }

      return true;
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });

    return filtered;
  }, [positionsData, searchTerm, sortField, sortDirection, filterType]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = processedData.slice(startIndex, startIndex + itemsPerPage);

  // Calculate summary statistics
  const totalMarketValue = processedData.reduce((sum, pos) =>
    sum + (parseFloat(pos.marketValue?.toString() || '0') || 0), 0
  );

  const totalPositions = processedData.length;
  const uniqueSymbols = new Set(processedData.map(pos => pos.symbol).filter(Boolean)).size;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);

  const formatNumber = (num: number) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    }).format(num);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection(field === 'marketValue' || field === 'numberOfShares' || field === 'price' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  const columns = [
    { key: 'accountNumber', label: 'Account', sortable: true, essential: true },
    { key: 'symbol', label: 'Symbol', sortable: true, essential: true },
    { key: 'securityDescription', label: 'Description', sortable: true, essential: false },
    { key: 'securityType', label: 'Type', sortable: true, essential: true },
    { key: 'numberOfShares', label: 'Shares', sortable: true, essential: true },
    { key: 'price', label: 'Price', sortable: true, essential: true },
    { key: 'marketValue', label: 'Market Value', sortable: true, essential: true },
    { key: 'longShort', label: 'L/S', sortable: true, essential: false },
    { key: 'dateOfPrice', label: 'Price Date', sortable: true, essential: false },
  ];

  const visibleColumns = showAllColumns ? columns : columns.filter(col => col.essential);

  if (positionsData.length === 0) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <TrendingUp size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
          <h2 style={{ color: '#666', marginBottom: '8px' }}>No Positions Data Available</h2>
          <p style={{ color: '#999' }}>
            Import a positions CSV file to view and analyze your portfolio holdings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Positions Data
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0,
          }}>
            {totalPositions.toLocaleString()} positions • {uniqueSymbols} unique symbols • {formatCurrency(totalMarketValue)} total value
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <ExportButton
            data={processedData}
            dataType="positions"
            title="Positions"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TrendingUp size={20} style={{ color: '#2196f3', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Total Positions</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {totalPositions.toLocaleString()}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <DollarSign size={20} style={{ color: '#4caf50', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Total Market Value</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {formatCurrency(totalMarketValue)}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <TrendingUp size={20} style={{ color: '#ff9800', marginRight: '8px' }} />
            <span style={{ fontSize: '14px', color: '#666' }}>Unique Symbols</span>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
            {uniqueSymbols.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto auto',
          gap: '16px',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#666',
            }} />
            <input
              type="text"
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Security Type Filter */}
          <select
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '120px',
            }}
          >
            <option value="all">All Types</option>
            {securityTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>

          {/* Column Toggle */}
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              background: 'white',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {showAllColumns ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAllColumns ? 'Fewer Columns' : 'All Columns'}
          </button>
        </div>
      </div>

      {/* Data Table */}
      <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {visibleColumns.map(column => (
                    <th
                      key={column.key}
                      onClick={column.sortable ? () => handleSort(column.key) : undefined}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        fontWeight: '600',
                        fontSize: '14px',
                        color: '#333',
                        borderBottom: '2px solid #e0e0e0',
                        cursor: column.sortable ? 'pointer' : 'default',
                        userSelect: 'none',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}>
                        {column.label}
                        {getSortIcon(column.key)}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((position, index) => (
                  <tr
                    key={`${position.accountNumber}-${position.symbol}-${index}`}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    {visibleColumns.map(column => {
                      const value = position[column.key];
                      let displayValue = value;

                      // Format based on column type
                      if (column.key === 'marketValue' && typeof value === 'number') {
                        displayValue = formatCurrency(value);
                      } else if (column.key === 'price' && typeof value === 'number') {
                        displayValue = formatCurrency(value);
                      } else if (column.key === 'numberOfShares' && typeof value === 'number') {
                        displayValue = formatNumber(value);
                      } else if (typeof value === 'string' && value.length > 30 && column.key === 'securityDescription') {
                        displayValue = value.substring(0, 30) + '...';
                      }

                      return (
                        <td
                          key={column.key}
                          style={{
                            padding: '12px',
                            fontSize: '14px',
                            color: '#333',
                            whiteSpace: 'nowrap',
                            textAlign: ['marketValue', 'price', 'numberOfShares'].includes(column.key) ? 'right' : 'left',
                          }}
                          title={typeof value === 'string' && value.length > 30 ? value : undefined}
                        >
                          {displayValue || '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '16px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '14px',
              color: '#666',
            }}>
              <div>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, processedData.length)} of {processedData.length} positions
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: currentPage === 1 ? '#f5f5f5' : 'white',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: currentPage === totalPages ? '#f5f5f5' : 'white',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                  }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </div>
  );
};

export default PositionsDataPage;