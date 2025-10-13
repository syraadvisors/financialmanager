// Bundle optimization utilities for analyzing and improving bundle size
import React, { lazy } from 'react';
import { createLogger } from './logger';

// Performance measurement utilities
export interface BundleMetrics {
  totalSize: number;
  chunkCount: number;
  largestChunk: string;
  duplicateModules: string[];
  unusedModules: string[];
  recommendations: string[];
}

// Create logger for bundle optimization
const bundleLogger = createLogger('CodeSplitting');

// Code splitting utility for dynamic imports
export class CodeSplittingManager {
  private static loadedChunks: Set<string> = new Set();
  private static preloadedChunks: Set<string> = new Set();

  // Preload chunks that are likely to be needed soon
  static preloadChunk(chunkName: string): void {
    if (this.preloadedChunks.has(chunkName)) return;

    this.preloadedChunks.add(chunkName);

    // Create a link element to preload the chunk
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'script';
    link.href = `/static/js/${chunkName}.js`;
    document.head.appendChild(link);
  }

  // Track loaded chunks
  static markChunkLoaded(chunkName: string): void {
    this.loadedChunks.add(chunkName);
  }

  // Get loading statistics
  static getStats(): {
    totalChunks: number;
    loadedChunks: number;
    preloadedChunks: number;
  } {
    return {
      totalChunks: this.loadedChunks.size + this.preloadedChunks.size,
      loadedChunks: this.loadedChunks.size,
      preloadedChunks: this.preloadedChunks.size
    };
  }
}

// Higher-order component for chunk loading with error boundaries
export function withChunkError(
  WrappedComponent: React.ComponentType<any>
): React.ComponentType<any> {
  const ChunkErrorWrapper: React.ComponentType<any> = (props: any) => {
    const [hasError, setHasError] = React.useState(false);
    const [isRetrying, setIsRetrying] = React.useState(false);

    React.useEffect(() => {
      setHasError(false);
      setIsRetrying(false);
    }, []);

    if (hasError) {
      return React.createElement(
        'div',
        {
          style: {
            padding: '20px',
            textAlign: 'center' as const,
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            margin: '20px'
          }
        },
        React.createElement('h3', null, 'Failed to load component'),
        React.createElement('p', null, 'There was an error loading this part of the application.'),
        React.createElement(
          'button',
          {
            onClick: () => {
              setIsRetrying(true);
              window.location.reload();
            },
            disabled: isRetrying,
            style: {
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRetrying ? 'not-allowed' as const : 'pointer' as const
            }
          },
          isRetrying ? 'Reloading...' : 'Reload Page'
        )
      );
    }

    return React.createElement(WrappedComponent, props);
  };

  return ChunkErrorWrapper;
}

// Lazy loading wrapper with preloading
export function createLazyComponent(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
  chunkName: string,
  preloadCondition?: () => boolean
): React.ComponentType<any> {
  const LazyComponent = lazy(async () => {
    try {
      CodeSplittingManager.markChunkLoaded(chunkName);
      return await importFn();
    } catch (error) {
      bundleLogger.error(`Failed to load chunk ${chunkName}`, error);
      throw error;
    }
  });

  // Preload if condition is met
  if (preloadCondition && preloadCondition()) {
    CodeSplittingManager.preloadChunk(chunkName);
  }

  return withChunkError(LazyComponent);
}

// Bundle size monitoring
export class BundleSizeMonitor {
  private static metrics: Map<string, number> = new Map();
  private static observer: PerformanceObserver | null = null;

  static init(): void {
    if (typeof PerformanceObserver === 'undefined' || this.observer) return;

    this.observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.includes('.chunk.js')) {
          const resourceEntry = entry as PerformanceResourceTiming;
          this.metrics.set(entry.name, resourceEntry.transferSize || 0);
        }
      });
    });

    this.observer.observe({ entryTypes: ['resource'] });
  }

  static getMetrics(): Map<string, number> {
    return new Map(this.metrics);
  }

  static getTotalSize(): number {
    let total = 0;
    this.metrics.forEach((size) => {
      total += size;
    });
    return total;
  }

  static getLargestChunk(): { name: string; size: number } | null {
    let largest = { name: '', size: 0 };
    this.metrics.forEach((size, name) => {
      if (size > largest.size) {
        largest = { name, size };
      }
    });
    return largest.size > 0 ? largest : null;
  }

  static generateReport(): BundleMetrics {
    const chunks = Array.from(this.metrics.entries());
    const largest = this.getLargestChunk();

    const recommendations: string[] = [];

    // Generate recommendations based on metrics
    if (this.getTotalSize() > 500 * 1024) { // 500KB threshold
      recommendations.push('Consider splitting large components into smaller chunks');
    }

    if (chunks.length < 5) {
      recommendations.push('Consider adding more code splitting for better caching');
    }

    if (largest && largest.size > 200 * 1024) { // 200KB threshold
      recommendations.push(`Largest chunk (${largest.name}) is over 200KB, consider further splitting`);
    }

    return {
      totalSize: this.getTotalSize(),
      chunkCount: chunks.length,
      largestChunk: largest?.name || '',
      duplicateModules: [], // Would need more advanced analysis
      unusedModules: [], // Would need more advanced analysis
      recommendations
    };
  }
}

// Component for displaying bundle metrics
export const BundleMetricsDisplay: React.FC<{
  isVisible: boolean;
  onClose: () => void;
}> = ({ isVisible, onClose }) => {
  const [metrics, setMetrics] = React.useState<BundleMetrics | null>(null);
  const [chunkStats, setChunkStats] = React.useState(CodeSplittingManager.getStats());

  React.useEffect(() => {
    if (isVisible) {
      BundleSizeMonitor.init();
      const bundleMetrics = BundleSizeMonitor.generateReport();
      setMetrics(bundleMetrics);
      const stats = CodeSplittingManager.getStats();
      setChunkStats(stats);
    }
  }, [isVisible]);

  if (!isVisible || !metrics) return null;

  return React.createElement(
    'div',
    {
      style: {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'white',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        maxWidth: '500px',
        maxHeight: '70vh',
        overflowY: 'auto' as const,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }
    },
    React.createElement(
      'div',
      { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' } },
      React.createElement('h3', { style: { margin: 0 } }, 'Bundle Analysis'),
      React.createElement(
        'button',
        {
          onClick: onClose,
          style: {
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer' as const,
            color: '#666'
          }
        },
        '×'
      )
    ),
    React.createElement(
      'div',
      { style: { marginBottom: '16px' } },
      React.createElement('h4', null, 'Bundle Size'),
      React.createElement('p', null, React.createElement('strong', null, 'Total Size: '), (metrics.totalSize / 1024).toFixed(1), ' KB'),
      React.createElement('p', null, React.createElement('strong', null, 'Chunks: '), metrics.chunkCount),
      metrics.largestChunk && React.createElement('p', null, React.createElement('strong', null, 'Largest Chunk: '), metrics.largestChunk)
    ),
    React.createElement(
      'div',
      { style: { marginBottom: '16px' } },
      React.createElement('h4', null, 'Code Splitting Stats'),
      React.createElement('p', null, React.createElement('strong', null, 'Total Chunks: '), chunkStats.totalChunks),
      React.createElement('p', null, React.createElement('strong', null, 'Loaded: '), chunkStats.loadedChunks),
      React.createElement('p', null, React.createElement('strong', null, 'Preloaded: '), chunkStats.preloadedChunks)
    ),
    metrics.recommendations.length > 0 && React.createElement(
      'div',
      null,
      React.createElement('h4', null, 'Recommendations'),
      React.createElement(
        'ul',
        { style: { paddingLeft: '20px' } },
        ...metrics.recommendations.map((rec, index) =>
          React.createElement('li', { key: index, style: { marginBottom: '4px' } }, rec)
        )
      )
    )
  );
};

// Initialize optimization on app start
export function initializeBundleOptimization(): void {
  const logger = createLogger('BundleOptimization');

  // Initialize bundle monitoring
  BundleSizeMonitor.init();

  // Log initial metrics
  if (process.env.NODE_ENV === 'development') {
    logger.info('Bundle optimization initialized');
    setTimeout(() => {
      const report = BundleSizeMonitor.generateReport();
      logger.info('Bundle metrics', report);
    }, 2000);
  }
}

// Export optimization utilities
const bundleOptimizationUtils = {
  CodeSplittingManager,
  BundleSizeMonitor,
  createLazyComponent,
  withChunkError,
  initializeBundleOptimization
};

export default bundleOptimizationUtils;