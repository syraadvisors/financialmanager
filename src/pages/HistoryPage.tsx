import React, { useState, useMemo } from 'react';
import { History, FileText, Download, Upload, Calendar, Filter, Search, Eye } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { FileType } from '../types/DataTypes';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';

interface HistoryPageProps {}

interface HistoryEntry {
  id: string;
  fileName: string;
  fileType: FileType;
  importDate: string;
  recordCount: number;
  summary: any;
  action?: 'import' | 'export';
}

const HistoryPage: React.FC<HistoryPageProps> = () => {
  const { state } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'balance' | 'positions' | 'export'>('all');
  const [sortField, setSortField] = useState<'date' | 'type' | 'records'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);

  const { fileHistory } = state;

  // Convert fileHistory to HistoryEntry format and add mock export entries for demo
  const allHistory = useMemo(() => {
    const importHistory: HistoryEntry[] = fileHistory.map(entry => ({
      ...entry,
      fileType: entry.fileType as FileType,
      action: 'import' as const,
    }));

    // Add some mock export history entries for demonstration
    const mockExportHistory: HistoryEntry[] = [
      {
        id: 'export-1',
        fileName: 'portfolio_export_2024_01_15.csv',
        fileType: FileType.ACCOUNT_BALANCE,
        importDate: new Date(Date.now() - 86400000).toLocaleString(), // 1 day ago
        recordCount: 2150,
        summary: { format: 'CSV', includeMetadata: true },
        action: 'export',
      },
      {
        id: 'export-2',
        fileName: 'positions_data_2024_01_14.xlsx',
        fileType: FileType.POSITIONS,
        importDate: new Date(Date.now() - 172800000).toLocaleString(), // 2 days ago
        recordCount: 8523,
        summary: { format: 'Excel', includeMetadata: false },
        action: 'export',
      },
    ];

    return [...importHistory, ...mockExportHistory];
  }, [fileHistory]);

  // Filter and sort history
  const processedHistory = useMemo(() => {
    let filtered = allHistory.filter(entry => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        if (!entry.fileName.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'export' && entry.action !== 'export') return false;
        if (filterType === 'balance' && entry.fileType !== FileType.ACCOUNT_BALANCE) return false;
        if (filterType === 'positions' && entry.fileType !== FileType.POSITIONS) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortField) {
        case 'date':
          aValue = new Date(a.importDate).getTime();
          bValue = new Date(b.importDate).getTime();
          break;
        case 'type':
          aValue = `${a.action}-${a.fileType}`;
          bValue = `${b.action}-${b.fileType}`;
          break;
        case 'records':
          aValue = a.recordCount;
          bValue = b.recordCount;
          break;
        default:
          aValue = a.importDate;
          bValue = b.importDate;
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [allHistory, searchTerm, filterType, sortField, sortDirection]);

  // Statistics
  const stats = useMemo(() => {
    const importEntries = allHistory.filter(e => e.action === 'import');
    const exportEntries = allHistory.filter(e => e.action === 'export');
    const balanceEntries = allHistory.filter(e => e.fileType === FileType.ACCOUNT_BALANCE);
    const positionsEntries = allHistory.filter(e => e.fileType === FileType.POSITIONS);

    const totalRecords = allHistory.reduce((sum, entry) => sum + entry.recordCount, 0);

    return {
      totalEntries: allHistory.length,
      importCount: importEntries.length,
      exportCount: exportEntries.length,
      balanceCount: balanceEntries.length,
      positionsCount: positionsEntries.length,
      totalRecords,
    };
  }, [allHistory]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'import':
        return <Upload size={16} style={{ color: '#4caf50' }} />;
      case 'export':
        return <Download size={16} style={{ color: '#2196f3' }} />;
      default:
        return <FileText size={16} style={{ color: '#666' }} />;
    }
  };

  const getFileTypeLabel = (fileType: FileType) => {
    switch (fileType) {
      case FileType.ACCOUNT_BALANCE:
        return 'Balance';
      case FileType.POSITIONS:
        return 'Positions';
      default:
        return 'Unknown';
    }
  };

  const getFileTypeColor = (fileType: FileType) => {
    switch (fileType) {
      case FileType.ACCOUNT_BALANCE:
        return '#e3f2fd';
      case FileType.POSITIONS:
        return '#f3e5f5';
      default:
        return '#f5f5f5';
    }
  };

  if (allHistory.length === 0) {
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
          <History size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
          <h2 style={{ color: '#666', marginBottom: '8px' }}>No Import/Export History</h2>
          <p style={{ color: '#999' }}>
            Your file import and export activities will be tracked here for easy reference.
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
            Import/Export History
          </h1>
          <p style={{
            color: '#666',
            fontSize: '16px',
            margin: 0,
          }}>
            Track and manage your data import and export activities
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
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
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <History size={20} style={{ color: '#2196f3' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {stats.totalEntries}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Activities</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Upload size={20} style={{ color: '#4caf50' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {stats.importCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Imports</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Download size={20} style={{ color: '#2196f3' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {stats.exportCount}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Exports</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <FileText size={20} style={{ color: '#ff9800' }} />
          <div>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {stats.totalRecords.toLocaleString()}
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>Total Records</div>
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
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 8px 8px 36px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} style={{ color: '#666' }} />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '120px',
              }}
            >
              <option value="all">All Types</option>
              <option value="balance">Balance Files</option>
              <option value="positions">Position Files</option>
              <option value="export">Exports Only</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={`${sortField}-${sortDirection}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSortField(field as any);
              setSortDirection(direction as any);
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
              minWidth: '140px',
            }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="type-asc">Type A-Z</option>
            <option value="records-desc">Most Records</option>
          </select>
        </div>
      </div>

      {/* History Table */}
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
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                  }}>
                    Action
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                  }}>
                    File Name
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                  }}>
                    Type
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'right',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                  }}>
                    Records
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                  }}>
                    Date/Time
                  </th>
                  <th style={{
                    padding: '12px',
                    textAlign: 'center',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#333',
                    borderBottom: '2px solid #e0e0e0',
                    width: '60px',
                  }}>
                    Details
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedHistory.map((entry, index) => (
                  <tr
                    key={entry.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '12px' }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}>
                        {getActionIcon(entry.action || 'import')}
                        <span style={{
                          fontSize: '14px',
                          fontWeight: '500',
                          color: '#333',
                          textTransform: 'capitalize',
                        }}>
                          {entry.action || 'Import'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                      <div style={{
                        maxWidth: '200px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {entry.fileName}
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: getFileTypeColor(entry.fileType),
                        color: '#333',
                      }}>
                        {getFileTypeLabel(entry.fileType)}
                      </span>
                    </td>
                    <td style={{
                      padding: '12px',
                      fontSize: '14px',
                      color: '#333',
                      textAlign: 'right',
                      fontWeight: '500',
                    }}>
                      {entry.recordCount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        {entry.importDate}
                      </div>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        style={{
                          padding: '4px 8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {processedHistory.length === 0 && (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666',
            }}>
              <FileText size={32} style={{ color: '#ccc', marginBottom: '12px' }} />
              <div>No entries match your current filters</div>
              <div style={{ fontSize: '14px', color: '#999', marginTop: '4px' }}>
                Try adjusting your search or filter criteria
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>

      {/* Details Modal */}
      {selectedEntry && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#333',
                margin: 0,
              }}>
                Entry Details
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: '#666',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <strong>Action:</strong> {selectedEntry.action || 'Import'}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>File Name:</strong> {selectedEntry.fileName}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>File Type:</strong> {getFileTypeLabel(selectedEntry.fileType)}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Records:</strong> {selectedEntry.recordCount.toLocaleString()}
            </div>
            <div style={{ marginBottom: '16px' }}>
              <strong>Date/Time:</strong> {selectedEntry.importDate}
            </div>

            {selectedEntry.summary && (
              <div>
                <strong>Summary:</strong>
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(selectedEntry.summary, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <div style={{
              marginTop: '24px',
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}>
              <button
                onClick={() => setSelectedEntry(null)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;