import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useDebounce Hook
 *
 * Debounces a value by delaying its update until after the specified delay.
 * Useful for search inputs, API calls, and expensive operations.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // This will only run after the user stops typing for 500ms
 *   performSearch(debouncedSearchTerm);
 * }, [debouncedSearchTerm]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timeout if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebouncedCallback Hook
 *
 * Returns a debounced version of a callback function.
 * Useful when you need to debounce a function call rather than a value.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param deps - Dependencies array (like useCallback)
 * @returns Object with debounced callback and cancel function
 *
 * @example
 * const { callback: debouncedSearch, cancel } = useDebouncedCallback(
 *   (searchTerm: string) => {
 *     performSearch(searchTerm);
 *   },
 *   500
 * );
 *
 * // Use it
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 *
 * // Cancel pending debounced call
 * cancel();
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: React.DependencyList = []
): { callback: T; cancel: () => void; isPending: () => boolean } {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      cancel();

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
        timeoutRef.current = null;
      }, delay);
    }) as T,
    [delay, cancel, ...deps]
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    callback: debouncedCallback,
    cancel,
    isPending,
  };
}

/**
 * useThrottle Hook
 *
 * Throttles a value by limiting how often it can update.
 * Unlike debounce (which delays until inactivity), throttle ensures
 * the value updates at most once per specified interval.
 *
 * @param value - The value to throttle
 * @param interval - Minimum time between updates in milliseconds (default: 300ms)
 * @returns The throttled value
 *
 * @example
 * const [scrollPosition, setScrollPosition] = useState(0);
 * const throttledScroll = useThrottle(scrollPosition, 100);
 *
 * // This will update at most every 100ms even if scroll events fire faster
 * useEffect(() => {
 *   updateUI(throttledScroll);
 * }, [throttledScroll]);
 */
export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted.current;

    if (timeSinceLastExecution >= interval) {
      setThrottledValue(value);
      lastExecuted.current = now;
    } else {
      const timer = setTimeout(() => {
        setThrottledValue(value);
        lastExecuted.current = Date.now();
      }, interval - timeSinceLastExecution);

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}

export default {
  useDebounce,
  useDebouncedCallback,
  useThrottle,
};
