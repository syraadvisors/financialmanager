import React, { useState, useCallback, useRef, useEffect } from 'react';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number | null;
  timestamp: number;
  componentName?: string;
  operationName?: string;
}

export interface PerformanceHook {
  metrics: PerformanceMetrics;
  startMeasurement: (name: string, componentName?: string) => void;
  endMeasurement: (name: string) => void;
  getMemoryUsage: () => void;
  resetMetrics: () => void;
  getAverageRenderTime: () => number;
  getRenderHistory: () => PerformanceMetrics[];
}

export const usePerformanceMonitor = (): PerformanceHook => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: null,
    timestamp: Date.now(),
  });

  const renderHistoryRef = useRef<PerformanceMetrics[]>([]);
  const maxHistorySize = 100; // Keep last 100 measurements

  const startMeasurement = useCallback((name: string, componentName?: string) => {
    performance.mark(`${name}-start`);
    setMetrics(prev => ({
      ...prev,
      operationName: name,
      componentName,
    }));
  }, []);

  const endMeasurement = useCallback((name: string) => {
    try {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      const measurement = performance.getEntriesByName(name)[0];
      if (measurement) {
        const newMetric: PerformanceMetrics = {
          renderTime: measurement.duration,
          memoryUsage: metrics.memoryUsage,
          timestamp: Date.now(),
          componentName: metrics.componentName,
          operationName: name,
        };

        setMetrics(newMetric);

        // Add to history
        renderHistoryRef.current.push(newMetric);
        if (renderHistoryRef.current.length > maxHistorySize) {
          renderHistoryRef.current = renderHistoryRef.current.slice(-maxHistorySize);
        }

        // Clean up performance entries
        performance.clearMarks(`${name}-start`);
        performance.clearMarks(`${name}-end`);
        performance.clearMeasures(name);
      }
    } catch (error) {
      console.warn('Performance measurement failed:', error);
    }
  }, [metrics.memoryUsage, metrics.componentName]);

  const getMemoryUsage = useCallback(() => {
    try {
      // @ts-ignore - performance.memory is not in TypeScript definitions
      if (performance.memory) {
        // @ts-ignore
        const memory = performance.memory;
        const memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100; // MB

        setMetrics(prev => ({
          ...prev,
          memoryUsage,
          timestamp: Date.now(),
        }));
      }
    } catch (error) {
      console.warn('Memory usage measurement failed:', error);
    }
  }, []);

  const resetMetrics = useCallback(() => {
    setMetrics({
      renderTime: 0,
      memoryUsage: null,
      timestamp: Date.now(),
    });
    renderHistoryRef.current = [];
  }, []);

  const getAverageRenderTime = useCallback(() => {
    const history = renderHistoryRef.current;
    if (history.length === 0) return 0;

    const totalTime = history.reduce((sum, metric) => sum + metric.renderTime, 0);
    return totalTime / history.length;
  }, []);

  const getRenderHistory = useCallback(() => {
    return [...renderHistoryRef.current];
  }, []);

  // Automatic memory monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      getMemoryUsage();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [getMemoryUsage]);

  return {
    metrics,
    startMeasurement,
    endMeasurement,
    getMemoryUsage,
    resetMetrics,
    getAverageRenderTime,
    getRenderHistory,
  };
};

// Higher-order component to automatically measure component performance
export const withPerformanceMonitoring = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) => {
  const MonitoredComponent = React.memo((props: P) => {
    const { startMeasurement, endMeasurement } = usePerformanceMonitor();

    React.useEffect(() => {
      startMeasurement('render', componentName);
      return () => {
        endMeasurement('render');
      };
    }, [startMeasurement, endMeasurement, componentName]);

    return <WrappedComponent {...props} />;
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  return MonitoredComponent;
};

// Hook for measuring specific operations
export const useOperationMeasurement = () => {
  const measureOperation = useCallback(async (
    operationName: string,
    operation: () => Promise<any> | any
  ) => {
    const startTime = performance.now();

    try {
      const result = await operation();
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Operation "${operationName}" took ${duration.toFixed(2)}ms`);

      return result;
    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      console.log(`Operation "${operationName}" failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }, []);

  return { measureOperation };
};

export default usePerformanceMonitor;