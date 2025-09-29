import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Search,
  TrendingUp,
  BarChart3,
  X,
  Star,
  History,
  Download,
  Upload,
  Trash2,
  Filter,
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useSearchHistory } from '../utils/searchHistoryManager';
import { useSearchContext } from '../contexts/SearchContext';

interface RecentSearchesProps {
  isVisible?: boolean;
  variant?: 'dropdown' | 'panel' | 'compact';
  maxItems?: number;
  showStatistics?: boolean;
  showControls?: boolean;
  onClose?: () => void;
  className?: string;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
  isVisible = true,
  variant = 'dropdown',
  maxItems = 10,
  showStatistics = false,
  showControls = false,
  onClose,
  className = ''
}) => {
  const {
    getRecentSearches,
    getPopularSearches,
    getSuggestions,
    getStatistics,
    clearHistory,
    exportHistory,
    importHistory,
    clearOldSearches
  } = useSearchHistory();

  const { performGlobalSearch } = useSearchContext();

  const [activeTab, setActiveTab] = useState<'recent' | 'popular' | 'stats'>('recent');
  const [isExpanded, setIsExpanded] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Force refresh data when component becomes visible
  useEffect(() => {
    if (isVisible) {
      setRefreshKey(prev => prev + 1);
    }
  }, [isVisible]);

  // Get search data
  const recentSearches = useMemo(() =>
    getRecentSearches(maxItems),
    [maxItems, refreshKey]
  );

  const popularSearches = useMemo(() =>
    getPopularSearches(Math.min(maxItems, 5)),
    [maxItems, refreshKey]
  );

  const statistics = useMemo(() =>
    getStatistics(),
    [refreshKey]
  );

  // Handle search selection
  const handleSearchSelect = useCallback((query: string) => {
    performGlobalSearch(query, 'recent');
    if (onClose) {
      onClose();
    }
  }, [performGlobalSearch, onClose]);

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    // eslint-disable-next-line no-restricted-globals
    if (confirm('Are you sure you want to clear all search history? This cannot be undone.')) {
      clearHistory();
      setRefreshKey(prev => prev + 1);
    }
  }, [clearHistory]);

  // Handle export
  const handleExport = useCallback(() => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-history-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exportHistory]);

  // Handle import
  const handleImport = useCallback(() => {
    if (!importData.trim()) return;

    const result = importHistory(importData);
    alert(result.message);

    if (result.success) {
      setImportData('');
      setShowImportDialog(false);
      setRefreshKey(prev => prev + 1);
    }
  }, [importData, importHistory]);

  // Handle file import
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImportData(e.target?.result as string);
        setShowImportDialog(true);
      };
      reader.readAsText(file);
    }
  }, []);

  // Clear old searches
  const handleClearOld = useCallback((days: number) => {
    const removed = clearOldSearches(days);
    alert(`Removed ${removed} old search entries.`);
    setRefreshKey(prev => prev + 1);
  }, [clearOldSearches]);

  if (!isVisible) return null;

  // Compact variant
  if (variant === 'compact') {
    return (
      <div className={`recent-searches-compact ${className}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '4px 8px',
        backgroundColor: 'white',
        borderRadius: '6px',
        border: '1px solid #e0e0e0',
        fontSize: '12px'
      }}>
        <Clock size={14} style={{ color: '#666' }} />
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {recentSearches.slice(0, 3).map((search, index) => (
            <button
              key={search.id}
              onClick={() => handleSearchSelect(search.query)}
              style={{
                padding: '2px 6px',
                backgroundColor: '#f5f5f5',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
                e.currentTarget.style.borderColor = '#2196f3';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              {search.query}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const containerStyle: React.CSSProperties = {
    position: variant === 'dropdown' ? 'absolute' : 'relative',
    top: variant === 'dropdown' ? '100%' : 'auto',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    marginTop: variant === 'dropdown' ? '4px' : '0',
    maxHeight: '400px',
    overflow: 'hidden',
    minWidth: '300px'
  };

  const renderSearchItem = (search: any, index: number, icon: React.ReactNode, showStats = false) => (
    <div
      key={search.id || `item-${index}`}
      onClick={() => handleSearchSelect(search.query)}
      style={{
        padding: '8px 12px',
        cursor: 'pointer',
        borderBottom: '1px solid #f0f0f0',
        transition: 'background-color 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
        <div style={{ color: '#666', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '500',
            color: '#333',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {search.query}
          </div>
          {showStats && search.resultCount !== undefined && (
            <div style={{
              fontSize: '11px',
              color: '#666',
              marginTop: '2px'
            }}>
              {search.resultCount} results
              {search.timestamp && (
                <span> • {new Date(search.timestamp).toLocaleDateString()}</span>
              )}
              {search.executionTime && (
                <span> • {Math.round(search.executionTime)}ms</span>
              )}
            </div>
          )}
        </div>
      </div>
      <ArrowRight size={12} style={{ color: '#ccc', flexShrink: 0 }} />
    </div>
  );

  return (
    <div className={`recent-searches-${variant} ${className}`} style={containerStyle}>
      {/* Header with tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', flex: 1 }}>
          <button
            onClick={() => setActiveTab('recent')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: activeTab === 'recent' ? '#f0f7ff' : 'transparent',
              color: activeTab === 'recent' ? '#1976d2' : '#666',
              fontWeight: activeTab === 'recent' ? '600' : 'normal',
              fontSize: '12px',
              cursor: 'pointer',
              borderBottom: activeTab === 'recent' ? '2px solid #1976d2' : 'none'
            }}
          >
            <Clock size={14} style={{ marginRight: '4px' }} />
            Recent
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: activeTab === 'popular' ? '#f0f7ff' : 'transparent',
              color: activeTab === 'popular' ? '#1976d2' : '#666',
              fontWeight: activeTab === 'popular' ? '600' : 'normal',
              fontSize: '12px',
              cursor: 'pointer',
              borderBottom: activeTab === 'popular' ? '2px solid #1976d2' : 'none'
            }}
          >
            <TrendingUp size={14} style={{ marginRight: '4px' }} />
            Popular
          </button>
          {showStatistics && (
            <button
              onClick={() => setActiveTab('stats')}
              style={{
                flex: 1,
                padding: '8px 12px',
                border: 'none',
                backgroundColor: activeTab === 'stats' ? '#f0f7ff' : 'transparent',
                color: activeTab === 'stats' ? '#1976d2' : '#666',
                fontWeight: activeTab === 'stats' ? '600' : 'normal',
                fontSize: '12px',
                cursor: 'pointer',
                borderBottom: activeTab === 'stats' ? '2px solid #1976d2' : 'none'
              }}
            >
              <BarChart3 size={14} style={{ marginRight: '4px' }} />
              Stats
            </button>
          )}
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {activeTab === 'recent' && (
          <div>
            {recentSearches.length > 0 ? (
              recentSearches.map((search, index) =>
                renderSearchItem(search, index, <Clock size={14} />, true)
              )
            ) : (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                <History size={32} style={{ color: '#ccc', marginBottom: '8px' }} />
                <div>No recent searches</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Your search history will appear here
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'popular' && (
          <div>
            {popularSearches.length > 0 ? (
              popularSearches.map((search, index) =>
                renderSearchItem(search, index, <Star size={14} />, true)
              )
            ) : (
              <div style={{
                padding: '24px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                <TrendingUp size={32} style={{ color: '#ccc', marginBottom: '8px' }} />
                <div>No popular searches yet</div>
                <div style={{ fontSize: '12px', marginTop: '4px' }}>
                  Search more to build popularity data
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && showStatistics && (
          <div style={{ padding: '12px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '12px'
            }}>
              <div style={{
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#1976d2' }}>
                  {statistics.totalSearches}
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Total Searches</div>
              </div>
              <div style={{
                padding: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>
                  {statistics.successRate.toFixed(0)}%
                </div>
                <div style={{ fontSize: '11px', color: '#666' }}>Success Rate</div>
              </div>
            </div>

            <div style={{
              padding: '8px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '12px'
            }}>
              <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>
                Categories
              </div>
              {Object.entries(statistics.categoryCounts).map(([category, count]) => (
                <div key={category} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#666',
                  marginBottom: '2px'
                }}>
                  <span>{category}</span>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div style={{
          borderTop: '1px solid #e0e0e0',
          padding: '8px',
          backgroundColor: '#fafafa'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {isExpanded ? 'Less' : 'More'}
            </button>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={handleExport}
                style={{
                  padding: '4px 8px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Export search history"
              >
                <Download size={10} />
                Export
              </button>

              <label style={{
                padding: '4px 8px',
                border: '1px solid #ddd',
                backgroundColor: 'white',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Upload size={10} />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {isExpanded && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              fontSize: '10px'
            }}>
              <button
                onClick={() => handleClearOld(7)}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear 7d+
              </button>
              <button
                onClick={() => handleClearOld(30)}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                Clear 30d+
              </button>
              <button
                onClick={handleClearHistory}
                style={{
                  padding: '3px 6px',
                  border: '1px solid #f44336',
                  backgroundColor: '#fff',
                  color: '#f44336',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={10} style={{ marginRight: '2px' }} />
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            maxWidth: '400px',
            width: '90%'
          }}>
            <h3>Import Search History</h3>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste search history JSON data here..."
              style={{
                width: '100%',
                height: '200px',
                marginBottom: '12px',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '12px',
                fontFamily: 'monospace'
              }}
            />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowImportDialog(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(RecentSearches);