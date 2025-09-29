// Enhanced virtualization utilities for improved performance with large datasets
import { useEffect, useRef, useCallback, useMemo, useState } from 'react';

// Dynamic row height calculator for variable-height rows
export class DynamicRowHeightCalculator {
  private heightCache: Map<number, number> = new Map();
  private averageHeight = 40;
  private measuredRows = 0;

  setItemHeight(index: number, height: number): void {
    if (this.heightCache.get(index) !== height) {
      this.heightCache.set(index, height);
      this.updateAverageHeight(height);
    }
  }

  getItemHeight(index: number): number {
    return this.heightCache.get(index) || this.estimateItemHeight(index);
  }

  private estimateItemHeight(index: number): number {
    // Use average height for unmeasured items
    return this.averageHeight;
  }

  private updateAverageHeight(newHeight: number): void {
    const totalHeight = this.averageHeight * this.measuredRows + newHeight;
    this.measuredRows += 1;
    this.averageHeight = totalHeight / this.measuredRows;
  }

  getAverageHeight(): number {
    return this.averageHeight;
  }

  getTotalHeight(itemCount: number): number {
    let totalHeight = 0;
    for (let i = 0; i < itemCount; i++) {
      totalHeight += this.getItemHeight(i);
    }
    return totalHeight;
  }

  clear(): void {
    this.heightCache.clear();
    this.averageHeight = 40;
    this.measuredRows = 0;
  }
}

// Intersection Observer-based visibility tracker
export class VirtualizedVisibilityTracker {
  private observer: IntersectionObserver | null = null;
  private visibleItems: Set<number> = new Set();
  private callbacks: Array<(visibleItems: Set<number>) => void> = [];

  constructor() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const index = parseInt(
              (entry.target as HTMLElement).dataset.index || '0',
              10
            );

            if (entry.isIntersecting) {
              this.visibleItems.add(index);
            } else {
              this.visibleItems.delete(index);
            }
          });

          this.notifyCallbacks();
        },
        {
          threshold: 0,
          rootMargin: '100px', // Pre-load items slightly outside viewport
        }
      );
    }
  }

  observe(element: HTMLElement, index: number): void {
    if (this.observer) {
      element.dataset.index = index.toString();
      this.observer.observe(element);
    }
  }

  unobserve(element: HTMLElement): void {
    if (this.observer) {
      this.observer.unobserve(element);
    }
  }

  onVisibilityChange(callback: (visibleItems: Set<number>) => void): () => void {
    this.callbacks.push(callback);

    // Return cleanup function
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach((callback) => {
      callback(new Set(this.visibleItems));
    });
  }

  destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.callbacks = [];
    this.visibleItems.clear();
  }
}

// Advanced virtual scrolling with chunking for massive datasets
export class ChunkedVirtualScroller {
  private chunkSize = 1000;
  private loadedChunks: Map<number, any[]> = new Map();
  private loadingChunks: Set<number> = new Set();
  private chunkLoader?: (chunkIndex: number, chunkSize: number) => Promise<any[]>;

  constructor(chunkSize = 1000) {
    this.chunkSize = chunkSize;
  }

  setChunkLoader(loader: (chunkIndex: number, chunkSize: number) => Promise<any[]>): void {
    this.chunkLoader = loader;
  }

  async getItem(index: number): Promise<any | null> {
    const chunkIndex = Math.floor(index / this.chunkSize);
    const itemIndex = index % this.chunkSize;

    if (this.loadedChunks.has(chunkIndex)) {
      const chunk = this.loadedChunks.get(chunkIndex)!;
      return chunk[itemIndex] || null;
    }

    if (this.loadingChunks.has(chunkIndex)) {
      // Wait for chunk to load
      await this.waitForChunk(chunkIndex);
      return this.getItem(index);
    }

    // Load chunk
    await this.loadChunk(chunkIndex);
    return this.getItem(index);
  }

  private async loadChunk(chunkIndex: number): Promise<void> {
    if (!this.chunkLoader || this.loadingChunks.has(chunkIndex)) {
      return;
    }

    this.loadingChunks.add(chunkIndex);

    try {
      const chunk = await this.chunkLoader(chunkIndex, this.chunkSize);
      this.loadedChunks.set(chunkIndex, chunk);
    } catch (error) {
      console.error(`Failed to load chunk ${chunkIndex}:`, error);
    } finally {
      this.loadingChunks.delete(chunkIndex);
    }
  }

  private async waitForChunk(chunkIndex: number): Promise<void> {
    return new Promise((resolve) => {
      const checkChunk = () => {
        if (this.loadedChunks.has(chunkIndex) || !this.loadingChunks.has(chunkIndex)) {
          resolve();
        } else {
          setTimeout(checkChunk, 10);
        }
      };
      checkChunk();
    });
  }

  preloadChunks(startIndex: number, endIndex: number): void {
    const startChunk = Math.floor(startIndex / this.chunkSize);
    const endChunk = Math.floor(endIndex / this.chunkSize);

    for (let chunkIndex = startChunk; chunkIndex <= endChunk; chunkIndex++) {
      if (!this.loadedChunks.has(chunkIndex) && !this.loadingChunks.has(chunkIndex)) {
        this.loadChunk(chunkIndex);
      }
    }
  }

  isChunkLoaded(chunkIndex: number): boolean {
    return this.loadedChunks.has(chunkIndex);
  }

  getLoadedChunkCount(): number {
    return this.loadedChunks.size;
  }

  clear(): void {
    this.loadedChunks.clear();
    this.loadingChunks.clear();
  }
}

// Hook for enhanced virtual scrolling
export function useEnhancedVirtualization<T>(
  items: T[],
  containerHeight: number,
  options: {
    itemHeight?: number;
    overscan?: number;
    dynamicHeight?: boolean;
    chunkSize?: number;
    enableIntersectionObserver?: boolean;
  } = {}
) {
  const {
    itemHeight = 40,
    overscan = 5,
    dynamicHeight = false,
    chunkSize = 1000,
    enableIntersectionObserver = false,
  } = options;

  const scrollElementRef = useRef<HTMLDivElement | null>(null);
  const heightCalculatorRef = useRef<DynamicRowHeightCalculator | null>(null);
  const visibilityTrackerRef = useRef<VirtualizedVisibilityTracker | null>(null);

  // Initialize height calculator for dynamic heights
  if (dynamicHeight && !heightCalculatorRef.current) {
    heightCalculatorRef.current = new DynamicRowHeightCalculator();
  }

  // Initialize visibility tracker
  if (enableIntersectionObserver && !visibilityTrackerRef.current) {
    visibilityTrackerRef.current = new VirtualizedVisibilityTracker();
  }

  const [scrollTop, setScrollTop] = useState(0);
  const [containerClientHeight, setContainerClientHeight] = useState(containerHeight);

  // Calculate visible range
  const { startIndex, endIndex, totalHeight } = useMemo(() => {
    const calculator = heightCalculatorRef.current;

    if (calculator) {
      // Dynamic height calculation
      let accumulatedHeight = 0;
      let start = 0;
      let end = items.length - 1;

      // Find start index
      for (let i = 0; i < items.length; i++) {
        const height = calculator.getItemHeight(i);
        if (accumulatedHeight + height > scrollTop) {
          start = Math.max(0, i - overscan);
          break;
        }
        accumulatedHeight += height;
      }

      // Find end index
      accumulatedHeight = 0;
      for (let i = start; i < items.length; i++) {
        const height = calculator.getItemHeight(i);
        accumulatedHeight += height;
        if (accumulatedHeight > containerClientHeight + overscan * itemHeight) {
          end = Math.min(items.length - 1, i + overscan);
          break;
        }
      }

      return {
        startIndex: start,
        endIndex: end,
        totalHeight: calculator.getTotalHeight(items.length),
      };
    } else {
      // Fixed height calculation
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
      const visibleItemCount = Math.ceil(containerClientHeight / itemHeight);
      const end = Math.min(items.length - 1, start + visibleItemCount + overscan);

      return {
        startIndex: start,
        endIndex: end,
        totalHeight: items.length * itemHeight,
      };
    }
  }, [items.length, scrollTop, containerClientHeight, itemHeight, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  // Item renderer with height measurement
  const renderItem = useCallback(
    (
      itemData: T,
      index: number,
      style: React.CSSProperties,
      ref?: React.RefObject<HTMLDivElement>
    ) => {
      const itemRef = useRef<HTMLDivElement>(null);
      const actualRef = ref || itemRef;

      useEffect(() => {
        if (dynamicHeight && actualRef.current && heightCalculatorRef.current) {
          const element = actualRef.current;
          const height = element.getBoundingClientRect().height;
          heightCalculatorRef.current.setItemHeight(index, height);
        }

        if (enableIntersectionObserver && actualRef.current && visibilityTrackerRef.current) {
          const element = actualRef.current;
          visibilityTrackerRef.current.observe(element, index);

          return () => {
            visibilityTrackerRef.current?.unobserve(element);
          };
        }
      }, [index]);

      return {
        ref: actualRef,
        style: {
          ...style,
          position: 'absolute' as const,
          top: dynamicHeight
            ? heightCalculatorRef.current?.getTotalHeight(index) || index * itemHeight
            : index * itemHeight,
          width: '100%',
        },
      };
    },
    [dynamicHeight, enableIntersectionObserver, itemHeight]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      heightCalculatorRef.current?.clear();
      visibilityTrackerRef.current?.destroy();
    };
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    startIndex,
    endIndex,
    handleScroll,
    renderItem,
    setItemHeight: heightCalculatorRef.current?.setItemHeight.bind(heightCalculatorRef.current),
  };
}

// Performance monitoring for virtualization
export class VirtualizationPerformanceMonitor {
  private renderTimes: number[] = [];
  private scrollEvents: number = 0;
  private lastScrollTime: number = 0;
  private frameRates: number[] = [];
  private lastFrameTime: number = performance.now();

  recordRenderTime(startTime: number): void {
    const renderTime = performance.now() - startTime;
    this.renderTimes.push(renderTime);

    // Keep only recent measurements
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift();
    }
  }

  recordScrollEvent(): void {
    this.scrollEvents++;
    this.lastScrollTime = performance.now();
  }

  recordFrame(): void {
    const now = performance.now();
    const frameTime = now - this.lastFrameTime;

    if (frameTime > 0) {
      const fps = 1000 / frameTime;
      this.frameRates.push(fps);

      // Keep only recent measurements
      if (this.frameRates.length > 60) {
        this.frameRates.shift();
      }
    }

    this.lastFrameTime = now;
  }

  getMetrics(): {
    averageRenderTime: number;
    maxRenderTime: number;
    scrollEventsPerSecond: number;
    averageFPS: number;
    minFPS: number;
  } {
    const avgRenderTime = this.renderTimes.length > 0
      ? this.renderTimes.reduce((sum, time) => sum + time, 0) / this.renderTimes.length
      : 0;

    const maxRenderTime = this.renderTimes.length > 0
      ? Math.max(...this.renderTimes)
      : 0;

    const scrollEventsPerSecond = this.scrollEvents / ((performance.now() - this.lastScrollTime) / 1000);

    const avgFPS = this.frameRates.length > 0
      ? this.frameRates.reduce((sum, fps) => sum + fps, 0) / this.frameRates.length
      : 0;

    const minFPS = this.frameRates.length > 0
      ? Math.min(...this.frameRates)
      : 0;

    return {
      averageRenderTime: avgRenderTime,
      maxRenderTime: maxRenderTime,
      scrollEventsPerSecond: scrollEventsPerSecond || 0,
      averageFPS: avgFPS,
      minFPS: minFPS,
    };
  }

  reset(): void {
    this.renderTimes = [];
    this.scrollEvents = 0;
    this.frameRates = [];
    this.lastFrameTime = performance.now();
    this.lastScrollTime = performance.now();
  }
}

// Export singleton performance monitor
export const virtualizationPerformanceMonitor = new VirtualizationPerformanceMonitor();

// Utility for optimizing large lists with buffering
export function createBufferedList<T>(
  items: T[],
  bufferSize: number = 50
): {
  getItems: (startIndex: number, count: number) => T[];
  getTotalCount: () => number;
  preloadBuffer: (centerIndex: number) => void;
} {
  const buffer: Map<number, T> = new Map();

  const getItems = (startIndex: number, count: number): T[] => {
    const result: T[] = [];

    for (let i = 0; i < count; i++) {
      const index = startIndex + i;
      if (index < items.length) {
        result.push(items[index]);
      }
    }

    return result;
  };

  const preloadBuffer = (centerIndex: number): void => {
    const start = Math.max(0, centerIndex - bufferSize);
    const end = Math.min(items.length - 1, centerIndex + bufferSize);

    for (let i = start; i <= end; i++) {
      if (!buffer.has(i)) {
        buffer.set(i, items[i]);
      }
    }

    // Clean up distant items
    const keysToDelete: number[] = [];
    buffer.forEach((_, index) => {
      if (index < start - bufferSize || index > end + bufferSize) {
        keysToDelete.push(index);
      }
    });
    keysToDelete.forEach(index => buffer.delete(index));
  };

  return {
    getItems,
    getTotalCount: () => items.length,
    preloadBuffer,
  };
}