import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, Zap, Database, Clock, TrendingUp, BarChart3, Settings, X } from 'lucide-react';
import { searchOptimizer, metricsCollector } from '../utils/searchUtils';
import { useSearchWorker } from '../hooks/useSearchWorker';

interface PerformanceMetrics {
  averageSearchTime: number;
  indexingTime: number;
  cacheHitRate: number;
  totalSearches: number;
  cacheHits: number;
  indexSize: number;
  invertedIndexSize: number;
  ngramIndexSize: number;
  cacheSize: number;
  lruCacheSize: number;
}

interface SearchPerformanceMonitorProps {
  isVisible: boolean;
  onClose: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const SearchPerformanceMonitor: React.FC<SearchPerformanceMonitorProps> = ({
  isVisible,
  onClose,
  position = 'bottom-right'
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [searchTrend, setSearchTrend] = useState<number[]>([]);
  const [workerMetrics, setWorkerMetrics] = useState<any>(null);
  const [refreshInterval, setRefreshInterval] = useState(2000);
  const [showDetails, setShowDetails] = useState(false);

  const { searchWorker, isWorkerReady, workerError } = useSearchWorker();

  // Position styling
  const positionStyles = useMemo(() => {
    const base = {
      position: 'fixed' as const,
      zIndex: 1000,
      width: showDetails ? '400px' : '300px',
      maxHeight: '80vh',
      overflow: 'auto'
    };

    switch (position) {
      case 'bottom-right':
        return { ...base, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...base, bottom: '20px', left: '20px' };
      case 'top-right':
        return { ...base, top: '20px', right: '20px' };
      case 'top-left':
        return { ...base, top: '20px', left: '20px' };
      default:
        return { ...base, bottom: '20px', right: '20px' };
    }
  }, [position, showDetails]);

  // Collect metrics
  const collectMetrics = useCallback(() => {
    try {
      const currentMetrics = searchOptimizer.getPerformanceMetrics();
      setMetrics(currentMetrics);

      // Update search trend
      if (currentMetrics.averageSearchTime > 0) {
        setSearchTrend(prev => {
          const newTrend = [...prev, currentMetrics.averageSearchTime];
          return newTrend.slice(-20); // Keep last 20 measurements
        });
      }
    } catch (error) {
      console.error('Failed to collect search metrics:', error);
    }
  }, []);

  // Auto-refresh metrics
  useEffect(() => {
    if (!isVisible) return;

    collectMetrics();
    const interval = setInterval(collectMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [isVisible, refreshInterval, collectMetrics]);

  // Performance status indicator
  const getPerformanceStatus = useCallback((avgTime: number, cacheHitRate: number) => {
    if (avgTime < 10 && cacheHitRate > 0.8) return { status: 'excellent', color: '#4caf50' };
    if (avgTime < 50 && cacheHitRate > 0.6) return { status: 'good', color: '#2196f3' };
    if (avgTime < 100 && cacheHitRate > 0.4) return { status: 'fair', color: '#ff9800' };
    return { status: 'poor', color: '#f44336' };
  }, []);

  // Format time in appropriate units
  const formatTime = useCallback((ms: number) => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  // Format memory size
  const formatSize = useCallback((size: number) => {
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  }, []);

  // Mini trend chart
  const TrendChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
    if (data.length < 2) return <div style={{ width: '60px', height: '20px' }} />;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 58 + 1;
      const y = 19 - ((value - min) / range) * 18;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="60" height="20" style={{ display: 'block' }}>
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  if (!isVisible) return null;

  const performanceStatus = metrics ? getPerformanceStatus(metrics.averageSearchTime, metrics.cacheHitRate) : null;

  return (
    <div
      style={{
        ...positionStyles,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '12px',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} />
          <span style={{ fontWeight: '600' }}>Search Performance</span>
          {performanceStatus && (
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: performanceStatus.color,
                boxShadow: `0 0 8px ${performanceStatus.color}40`
              }}
            />
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Settings size={12} />
          </button>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '16px' }}>
        {metrics ? (
          <>
            {/* Key Metrics Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: showDetails ? '1fr 1fr' : '1fr',
              gap: '12px',
              marginBottom: '16px'
            }}>
              {/* Search Speed */}
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Zap size={14} color="#2196f3" />
                  <span style={{ fontWeight: '500', color: '#333' }}>Avg Speed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '18px', fontWeight: '600', color: performanceStatus?.color }}>
                    {formatTime(metrics.averageSearchTime)}
                  </span>
                  <TrendChart data={searchTrend} color={performanceStatus?.color || '#2196f3'} />
                </div>
              </div>

              {/* Cache Hit Rate */}
              <div style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Database size={14} color="#4caf50" />
                  <span style={{ fontWeight: '500', color: '#333' }}>Cache Hit</span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>
                  {(metrics.cacheHitRate * 100).toFixed(1)}%
                </div>
              </div>

              {showDetails && (
                <>
                  {/* Index Size */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <BarChart3 size={14} color="#ff9800" />
                      <span style={{ fontWeight: '500', color: '#333' }}>Index Size</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ff9800' }}>
                      {metrics.indexSize} fields
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      {metrics.ngramIndexSize} n-grams
                    </div>
                  </div>

                  {/* Total Searches */}
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <TrendingUp size={14} color="#9c27b0" />
                      <span style={{ fontWeight: '500', color: '#333' }}>Searches</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#9c27b0' }}>
                      {metrics.totalSearches}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                      {metrics.cacheHits} cached
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Status Summary */}
            <div style={{
              padding: '8px 12px',
              backgroundColor: `${performanceStatus?.color}15`,
              border: `1px solid ${performanceStatus?.color}30`,
              borderRadius: '6px',
              textAlign: 'center',
              marginBottom: showDetails ? '16px' : '0'
            }}>
              <span style={{ color: performanceStatus?.color, fontWeight: '500', textTransform: 'capitalize' }}>
                {performanceStatus?.status} Performance
              </span>
            </div>

            {/* Detailed Stats */}
            {showDetails && (
              <div style={{ marginTop: '16px' }}>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  color: '#666',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Detailed Statistics
                </div>

                <div style={{ display: 'grid', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Indexing Time:</span>
                    <span style={{ fontWeight: '500' }}>{formatTime(metrics.indexingTime)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Cache Size:</span>
                    <span style={{ fontWeight: '500' }}>{metrics.cacheSize} / {metrics.lruCacheSize}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>Inverted Index:</span>
                    <span style={{ fontWeight: '500' }}>{metrics.invertedIndexSize} terms</span>
                  </div>

                  {/* Worker Status */}
                  <div style={{
                    marginTop: '12px',
                    padding: '8px',
                    backgroundColor: isWorkerReady ? '#e8f5e8' : '#ffebee',
                    borderRadius: '4px',
                    border: `1px solid ${isWorkerReady ? '#c8e6c9' : '#ffcdd2'}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: isWorkerReady ? '#4caf50' : workerError ? '#f44336' : '#ff9800'
                      }} />
                      <span style={{
                        fontSize: '11px',
                        color: isWorkerReady ? '#2e7d32' : '#d32f2f',
                        fontWeight: '500'
                      }}>
                        Web Worker: {isWorkerReady ? 'Ready' : workerError ? 'Error' : 'Loading'}
                      </span>
                    </div>
                    {workerError && (
                      <div style={{
                        fontSize: '10px',
                        color: '#d32f2f',
                        marginTop: '4px',
                        wordBreak: 'break-word'
                      }}>
                        {workerError}
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div style={{
                    marginTop: '12px',
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap'
                  }}>
                    <button
                      onClick={() => searchOptimizer.clearCache()}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Cache
                    </button>
                    <button
                      onClick={() => searchOptimizer.optimizeIndex()}
                      style={{
                        padding: '4px 8px',
                        fontSize: '10px',
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Optimize
                    </button>
                    <select
                      value={refreshInterval}
                      onChange={(e) => setRefreshInterval(Number(e.target.value))}
                      style={{
                        padding: '4px',
                        fontSize: '10px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      <option value={1000}>1s refresh</option>
                      <option value={2000}>2s refresh</option>
                      <option value={5000}>5s refresh</option>
                      <option value={10000}>10s refresh</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            color: '#666'
          }}>
            <Clock size={16} style={{ marginRight: '8px' }} />
            Loading metrics...
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPerformanceMonitor;