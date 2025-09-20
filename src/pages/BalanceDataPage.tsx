import React, { useState, useMemo } from 'react';
import { Search, Eye, EyeOff, SortAsc, SortDesc } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import ExportButton from '../components/ExportButton';

interface BalanceDataPageProps {
  onExportData?: (data: any[], format: 'csv' | 'excel') => void;
}

const BalanceDataPage: React.FC<BalanceDataPageProps> = ({ onExportData }) => {
  const { state } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<string>('accountNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const { balanceData } = state;

  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = balanceData.filter(account => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        account.accountNumber?.toLowerCase().includes(searchLower) ||
        account.accountName?.toLowerCase().includes(searchLower) ||
        account.asOfBusinessDate?.toLowerCase().includes(searchLower)
      );
    });

    // Sort data
    filtered.sort((a, b) => {
      const aValue = a[sortField as keyof typeof a];
      const bValue = b[sortField as keyof typeof b];

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
  }, [balanceData, searchTerm, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Summary statistics
  const stats = useMemo(() => {
    const totalPortfolio = processedData.reduce((sum, acc) =>
      sum + (parseFloat(acc.portfolioValue?.toString() || '0') || 0), 0
    );
    const totalCash = processedData.reduce((sum, acc) =>
      sum + (parseFloat(acc.totalCash?.toString() || '0') || 0), 0
    );
    const avgPortfolio = totalPortfolio / (processedData.length || 1);
    const avgCash = totalCash / (processedData.length || 1);

    return {
      totalPortfolio,
      totalCash,
      avgPortfolio,
      avgCash,
      cashPercentage: (totalCash / totalPortfolio) * 100,
    };
  }, [processedData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <SortAsc size={14} /> : <SortDesc size={14} />;
  };

  if (balanceData.length === 0) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          border: '1px solid #e0e0e0',
          maxWidth: '400px',
        }}>
          <h2 style={{
            fontSize: '24px',
            color: '#333',
            marginBottom: '16px',
          }}>
            No Balance Data
          </h2>
          <p style={{
            color: '#666',
            marginBottom: '0',
          }}>
            Import balance data to view detailed account information.
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Balance Data
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0,
          }}>
            {processedData.length} of {balanceData.length} accounts
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowAllColumns(!showAllColumns)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAllColumns ? '#ff9800' : '#f5f5f5',
              color: showAllColumns ? 'white' : '#333',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {showAllColumns ? <EyeOff size={16} /> : <Eye size={16} />}
            {showAllColumns ? 'Hide Details' : 'Show All'}
          </button>

          <ExportButton
            data={processedData}
            dataType="balance"
            title="Balance Data"
            variant="dialog"
            size="medium"
          />
        </div>
      </div>

      <ErrorBoundary
        level="section"
        fallback={
          <DataProcessingErrorFallback
            title="Balance Data Display Error"
            message="Unable to display balance data table."
          />
        }
      >
        {/* Summary Statistics */}
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
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Total Portfolio Value
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
              {formatCurrency(stats.totalPortfolio)}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Total Cash
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
              {formatCurrency(stats.totalCash)}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Average Portfolio
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
              {formatCurrency(stats.avgPortfolio)}
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
              Cash Percentage
            </div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#9c27b0' }}>
              {stats.cashPercentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          marginBottom: '20px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#999',
            }} />
            <input
              type="text"
              placeholder="Search accounts, names, or dates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>
        </div>

        {/* Data Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
            }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  <th
                    onClick={() => handleSort('asOfBusinessDate')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      userSelect: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    Date {getSortIcon('asOfBusinessDate')}
                  </th>
                  <th
                    onClick={() => handleSort('accountNumber')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Account Number {getSortIcon('accountNumber')}
                  </th>
                  <th
                    onClick={() => handleSort('accountName')}
                    style={{
                      padding: '12px',
                      textAlign: 'left',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      userSelect: 'none',
                      minWidth: '200px',
                    }}
                  >
                    Account Name {getSortIcon('accountName')}
                  </th>
                  <th
                    onClick={() => handleSort('portfolioValue')}
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Portfolio Value {getSortIcon('portfolioValue')}
                  </th>
                  <th
                    onClick={() => handleSort('totalCash')}
                    style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #e0e0e0',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    Total Cash {getSortIcon('totalCash')}
                  </th>
                  {showAllColumns && (
                    <th style={{
                      padding: '12px',
                      textAlign: 'right',
                      borderBottom: '1px solid #e0e0e0',
                    }}>
                      Cash %
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((account, index) => {
                  const portfolioValue = parseFloat(account.portfolioValue?.toString() || '0') || 0;
                  const totalCash = parseFloat(account.totalCash?.toString() || '0') || 0;
                  const cashPercentage = portfolioValue > 0 ? (totalCash / portfolioValue) * 100 : 0;

                  return (
                    <tr
                      key={index}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        {account.asOfBusinessDate}
                      </td>
                      <td style={{
                        padding: '12px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                      }}>
                        {account.accountNumber}
                      </td>
                      <td style={{
                        padding: '12px',
                        maxWidth: '250px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {account.accountName}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#2196f3',
                      }}>
                        {formatCurrency(portfolioValue)}
                      </td>
                      <td style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#4caf50',
                      }}>
                        {formatCurrency(totalCash)}
                      </td>
                      {showAllColumns && (
                        <td style={{
                          padding: '12px',
                          textAlign: 'right',
                          fontSize: '13px',
                          color: '#666',
                        }}>
                          {cashPercentage.toFixed(1)}%
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{
              padding: '16px 20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, processedData.length)} of {processedData.length} accounts
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: currentPage === 1 ? '#f5f5f5' : '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                  }}
                >
                  Previous
                </button>

                <span style={{
                  padding: '6px 12px',
                  fontSize: '13px',
                  color: '#666',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: currentPage === totalPages ? '#f5f5f5' : '#fff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '4px',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
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

export default BalanceDataPage;