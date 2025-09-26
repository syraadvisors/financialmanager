import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Play, Download, BarChart3, Clock, Zap, Database, TrendingUp, AlertTriangle } from 'lucide-react';
import { benchmarkRunner, BenchmarkSuite, BenchmarkResult } from '../utils/searchBenchmark';

interface SearchBenchmarkDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

const SearchBenchmarkDashboard: React.FC<SearchBenchmarkDashboardProps> = ({
  isVisible,
  onClose
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSuite, setCurrentSuite] = useState<BenchmarkSuite | null>(null);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState<BenchmarkResult | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState<BenchmarkResult[]>([]);

  // Run comprehensive benchmark
  const runBenchmarkSuite = useCallback(async () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    setCurrentSuite(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + Math.random() * 15, 95));
      }, 500);

      const suite = await benchmarkRunner.runComprehensiveBenchmark();

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentSuite(suite);

      console.log('Benchmark suite completed:', suite);
    } catch (error) {
      console.error('Benchmark failed:', error);
    } finally {
      setIsRunning(false);
      setTimeout(() => setProgress(0), 2000);
    }
  }, [isRunning]);

  // Export results
  const exportResults = useCallback(() => {
    if (!currentSuite) return;

    const exportData = benchmarkRunner.exportResults(currentSuite);
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `search-benchmark-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [currentSuite]);

  // Performance status colors
  const getPerformanceColor = useCallback((avgTime: number): string => {
    if (avgTime < 10) return '#4caf50';
    if (avgTime < 50) return '#2196f3';
    if (avgTime < 100) return '#ff9800';
    return '#f44336';
  }, []);

  // Format time
  const formatTime = useCallback((ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }, []);

  // Benchmark result card
  const BenchmarkCard: React.FC<{ result: BenchmarkResult; onClick: () => void }> = ({ result, onClick }) => (
    <div
      onClick={onClick}
      style={{
        padding: '16px',
        backgroundColor: selectedResult?.testName === result.testName ? '#f3e5f5' : '#f8f9fa',
        border: selectedResult?.testName === result.testName ? '2px solid #9c27b0' : '1px solid #e0e0e0',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        marginBottom: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{result.testName}</h4>
        <div style={{
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: getPerformanceColor(result.averageTime),
          color: 'white',
          fontSize: '10px',
          fontWeight: '600'
        }}>
          {formatTime(result.averageTime)}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '11px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Database size={12} color="#666" />
          <span>{result.dataSize} records</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Zap size={12} color="#666" />
          <span>{result.throughput.toFixed(0)}/s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TrendingUp size={12} color="#666" />
          <span>{(result.cacheHitRate * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );

  // Performance chart
  const PerformanceChart: React.FC<{ results: BenchmarkResult[] }> = ({ results }) => {
    const chartData = useMemo(() => {
      return results.map((result, index) => ({
        x: index * (300 / (results.length - 1 || 1)),
        y: 180 - (result.averageTime / Math.max(...results.map(r => r.averageTime)) * 160),
        result
      }));
    }, [results]);

    if (results.length < 2) return null;

    return (
      <div style={{ marginTop: '16px' }}>
        <h4 style={{ fontSize: '12px', fontWeight: '600', color: '#666', marginBottom: '8px' }}>
          Performance Trend
        </h4>
        <svg width="320" height="200" style={{ border: '1px solid #e0e0e0', borderRadius: '4px', backgroundColor: 'white' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(percent => (
            <line
              key={percent}
              x1="20"
              y1={20 + (percent / 100) * 160}
              x2="300"
              y2={20 + (percent / 100) * 160}
              stroke="#f0f0f0"
              strokeWidth="1"
            />
          ))}

          {/* Performance line */}
          <polyline
            points={chartData.map(d => `${d.x + 20},${d.y + 20}`).join(' ')}
            fill="none"
            stroke="#2196f3"
            strokeWidth="2"
          />

          {/* Data points */}
          {chartData.map((point, index) => (
            <circle
              key={index}
              cx={point.x + 20}
              cy={point.y + 20}
              r="3"
              fill={getPerformanceColor(point.result.averageTime)}
              stroke="white"
              strokeWidth="2"
            />
          ))}

          {/* Y-axis label */}
          <text x="10" y="15" fontSize="10" fill="#666" textAnchor="middle">ms</text>
        </svg>
      </div>
    );
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '80vw',
      maxWidth: '900px',
      maxHeight: '80vh',
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
      zIndex: 1001,
      overflow: 'hidden',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        backgroundColor: '#667eea',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BarChart3 size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Search Benchmark Dashboard</h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                Comprehensive performance analysis and optimization insights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px'
            }}
          >
            ×
          </button>
        </div>

        {/* Progress bar */}
        {isRunning && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px' }}>Running benchmark suite...</span>
              <span style={{ fontSize: '14px', fontWeight: '600' }}>{progress.toFixed(0)}%</span>
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                backgroundColor: 'white',
                borderRadius: '2px',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', height: 'calc(80vh - 120px)' }}>
        {/* Controls */}
        <div style={{
          width: '300px',
          padding: '24px',
          borderRight: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={runBenchmarkSuite}
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: isRunning ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: isRunning ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px'
              }}
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Run Benchmark Suite'}
            </button>

            {currentSuite && (
              <button
                onClick={exportResults}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Download size={16} />
                Export Results
              </button>
            )}
          </div>

          {currentSuite && (
            <>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '12px' }}>
                Benchmark Results
              </h3>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {currentSuite.results.map((result, index) => (
                  <BenchmarkCard
                    key={index}
                    result={result}
                    onClick={() => setSelectedResult(result)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
          {!currentSuite ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#666',
              textAlign: 'center'
            }}>
              <BarChart3 size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No benchmark data available</h3>
              <p style={{ fontSize: '14px', maxWidth: '400px', lineHeight: 1.5 }}>
                Run the benchmark suite to analyze search performance across different data sizes and query complexities.
                This will help identify optimization opportunities.
              </p>
            </div>
          ) : (
            <div>
              {/* Suite summary */}
              <div style={{
                padding: '20px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                marginBottom: '24px',
                border: '1px solid #e0e0e0'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                  {currentSuite.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
                  {currentSuite.description}
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '4px' }}>
                      Best Performance
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#4caf50' }}>
                      {formatTime(currentSuite.summary.bestPerformance.averageTime)}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                      {currentSuite.summary.bestPerformance.testName}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '4px' }}>
                      Average Throughput
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#2196f3' }}>
                      {currentSuite.summary.averagePerformance.toFixed(0)}/s
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '4px' }}>
                      Total Time
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '600', color: '#ff9800' }}>
                      {formatTime(currentSuite.totalTime)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance chart */}
              <PerformanceChart results={currentSuite.results} />

              {/* Recommendations */}
              <div style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: '#fff3e0',
                border: '1px solid #ffcc02',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <AlertTriangle size={16} color="#ff9800" />
                  <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#ff9800', margin: 0 }}>
                    Performance Recommendations
                  </h4>
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#333' }}>
                  {currentSuite.summary.recommendedOptimizations.map((rec, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
                  ))}
                </ul>
              </div>

              {/* Selected result details */}
              {selectedResult && (
                <div style={{
                  marginTop: '24px',
                  padding: '20px',
                  backgroundColor: 'white',
                  border: '2px solid #2196f3',
                  borderRadius: '8px'
                }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: '#2196f3' }}>
                    {selectedResult.testName} - Detailed Metrics
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Average Time</div>
                      <div>{formatTime(selectedResult.averageTime)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Min/Max</div>
                      <div>{formatTime(selectedResult.minTime)} / {formatTime(selectedResult.maxTime)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Std Deviation</div>
                      <div>{formatTime(selectedResult.standardDeviation)}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Cache Hit Rate</div>
                      <div>{(selectedResult.cacheHitRate * 100).toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBenchmarkDashboard;