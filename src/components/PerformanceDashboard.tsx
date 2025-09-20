import React, { memo, useState, useEffect } from 'react';
import { Monitor, Clock, MemoryStick, Activity, RefreshCw } from 'lucide-react';
import { usePerformanceMonitor, PerformanceMetrics } from '../hooks/usePerformanceMonitor';

interface PerformanceDashboardProps {
  isVisible?: boolean;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  className?: string;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = memo(({
  isVisible = true,
  position = 'bottom-right',
  className = ''
}) => {
  const {
    metrics,
    getMemoryUsage,
    resetMetrics,
    getAverageRenderTime,
    getRenderHistory
  } = usePerformanceMonitor();

  const [isExpanded, setIsExpanded] = useState(false);
  const [history, setHistory] = useState<PerformanceMetrics[]>([]);

  useEffect(() => {
    if (isExpanded) {
      setHistory(getRenderHistory());
    }
  }, [isExpanded, getRenderHistory]);

  if (!isVisible) return null;

  const positionStyles = {
    'top-right': { top: '20px', right: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'top-left': { top: '20px', left: '20px' }
  };

  const formatMemory = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    return `${bytes.toFixed(1)} MB`;
  };

  const formatTime = (ms: number) => {
    return `${ms.toFixed(2)}ms`;
  };

  const getPerformanceColor = (renderTime: number) => {
    if (renderTime < 16) return '#4caf50'; // Green - good performance (60fps)
    if (renderTime < 33) return '#ff9800'; // Orange - moderate performance (30fps)
    return '#f44336'; // Red - poor performance (<30fps)
  };

  return (
    <div
      className={className}
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1000,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: '8px',
        padding: isExpanded ? '16px' : '8px',
        minWidth: isExpanded ? '300px' : '120px',
        fontSize: '12px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isExpanded ? '12px' : '0',
          cursor: 'pointer',
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Monitor size={14} />
          <span style={{ fontWeight: 'bold' }}>Performance</span>
        </div>
        <Activity
          size={12}
          style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        />
      </div>

      {/* Main metrics */}
      <div style={{ display: 'flex', flexDirection: isExpanded ? 'column' : 'row', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} />
          <span
            style={{
              color: getPerformanceColor(metrics.renderTime),
              fontWeight: 'bold',
            }}
          >
            {formatTime(metrics.renderTime)}
          </span>
        </div>

        {metrics.memoryUsage && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MemoryStick size={12} />
            <span>{formatMemory(metrics.memoryUsage)}</span>
          </div>
        )}
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div style={{ marginTop: '12px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '12px',
            fontSize: '11px',
          }}>
            <div>
              <div style={{ opacity: 0.7 }}>Avg Render:</div>
              <div style={{ color: getPerformanceColor(getAverageRenderTime()) }}>
                {formatTime(getAverageRenderTime())}
              </div>
            </div>
            <div>
              <div style={{ opacity: 0.7 }}>Measurements:</div>
              <div>{history.length}</div>
            </div>
          </div>

          {/* Recent history */}
          {history.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ opacity: 0.7, marginBottom: '4px', fontSize: '10px' }}>
                Recent (last {Math.min(5, history.length)}):
              </div>
              <div style={{ fontSize: '10px' }}>
                {history.slice(-5).map((metric, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '2px 0',
                      borderBottom: index < 4 ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                    }}
                  >
                    <span style={{ opacity: 0.8 }}>
                      {metric.componentName || metric.operationName || 'render'}
                    </span>
                    <span style={{ color: getPerformanceColor(metric.renderTime) }}>
                      {formatTime(metric.renderTime)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'space-between',
          }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                getMemoryUsage();
              }}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <RefreshCw size={10} />
              Refresh
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetMetrics();
                setHistory([]);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '10px',
                backgroundColor: 'rgba(244, 67, 54, 0.2)',
                border: '1px solid rgba(244, 67, 54, 0.5)',
                borderRadius: '4px',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>

          {/* Performance tips */}
          {getAverageRenderTime() > 50 && (
            <div style={{
              marginTop: '8px',
              padding: '6px',
              backgroundColor: 'rgba(255, 152, 0, 0.2)',
              borderRadius: '4px',
              fontSize: '10px',
              border: '1px solid rgba(255, 152, 0, 0.3)',
            }}>
              ⚠️ Performance may be slow. Consider using virtual scrolling for large datasets.
            </div>
          )}
        </div>
      )}
    </div>
  );
});

PerformanceDashboard.displayName = 'PerformanceDashboard';

export default PerformanceDashboard;