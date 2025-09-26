import { useRef, useCallback, useEffect } from 'react';

interface SearchWorkerResult {
  results: any[];
  metrics: {
    searchTime: number;
    totalResults: number;
    matchingStrategies?: number;
    totalBatches?: number;
  };
}

interface SearchWorkerHookResult {
  searchWorker: Worker | null;
  buildIndex: (data: any[], fields: string[]) => Promise<any>;
  search: (data: any[], query: string, fields: string[], options?: any) => Promise<SearchWorkerResult>;
  batchSearch: (data: any[], query: string, fields: string[], options?: any, batchSize?: number) => Promise<SearchWorkerResult>;
  terminateWorker: () => void;
  isWorkerReady: boolean;
  workerError: string | null;
}

export const useSearchWorker = (): SearchWorkerHookResult => {
  const workerRef = useRef<Worker | null>(null);
  const isWorkerReadyRef = useRef(false);
  const workerErrorRef = useRef<string | null>(null);
  const messageHandlersRef = useRef(new Map());

  // Initialize worker
  useEffect(() => {
    if (typeof Worker !== 'undefined') {
      try {
        workerRef.current = new Worker('/searchWorker.js');

        workerRef.current.onmessage = (e) => {
          const { type, success, ...data } = e.data;

          if (success === false) {
            workerErrorRef.current = data.message || 'Worker error occurred';
            console.error('Search worker error:', data);
          } else {
            workerErrorRef.current = null;
          }

          // Handle specific message types
          if (type === 'indexBuilt') {
            isWorkerReadyRef.current = true;
          }

          // Call registered handlers
          const handler = messageHandlersRef.current.get(type);
          if (handler) {
            handler(data);
            messageHandlersRef.current.delete(type);
          }
        };

        workerRef.current.onerror = (error) => {
          workerErrorRef.current = `Worker error: ${error.message}`;
          console.error('Search worker error:', error);
        };

        console.log('Search worker initialized');
      } catch (error) {
        workerErrorRef.current = `Failed to initialize worker: ${error}`;
        console.error('Failed to initialize search worker:', error);
      }
    } else {
      workerErrorRef.current = 'Web Workers not supported';
      console.warn('Web Workers not supported in this environment');
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
        isWorkerReadyRef.current = false;
      }
    };
  }, []);

  const buildIndex = useCallback((data: any[], fields: string[]): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }

      const startTime = performance.now();

      messageHandlersRef.current.set('indexBuilt', (result: any) => {
        const totalTime = performance.now() - startTime;
        resolve({
          ...result,
          totalTime,
          workerTime: result.stats?.indexingTime || 0
        });
      });

      messageHandlersRef.current.set('error', (error: any) => {
        reject(new Error(error.message));
      });

      workerRef.current.postMessage({
        type: 'buildIndex',
        data: { items: data, fields }
      });
    });
  }, []);

  const search = useCallback((
    data: any[],
    query: string,
    fields: string[],
    options: any = {}
  ): Promise<SearchWorkerResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }

      if (!query?.trim()) {
        resolve({ results: [], metrics: { searchTime: 0, totalResults: 0 } });
        return;
      }

      messageHandlersRef.current.set('searchComplete', (result: SearchWorkerResult) => {
        resolve(result);
      });

      messageHandlersRef.current.set('error', (error: any) => {
        reject(new Error(error.message));
      });

      workerRef.current.postMessage({
        type: 'search',
        data: { items: data, query, fields, options }
      });
    });
  }, []);

  const batchSearch = useCallback((
    data: any[],
    query: string,
    fields: string[],
    options: any = {},
    batchSize: number = 1000
  ): Promise<SearchWorkerResult> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }

      if (!query?.trim()) {
        resolve({ results: [], metrics: { searchTime: 0, totalResults: 0 } });
        return;
      }

      const progressHandler = (data: any) => {
        // Optional: emit progress events
        if (options.onProgress) {
          options.onProgress(data.progress, data.processedItems);
        }
      };

      messageHandlersRef.current.set('progress', progressHandler);

      messageHandlersRef.current.set('batchSearchComplete', (result: SearchWorkerResult) => {
        messageHandlersRef.current.delete('progress');
        resolve(result);
      });

      messageHandlersRef.current.set('error', (error: any) => {
        messageHandlersRef.current.delete('progress');
        reject(new Error(error.message));
      });

      workerRef.current.postMessage({
        type: 'batchSearch',
        data: { items: data, query, fields, options, batchSize }
      });
    });
  }, []);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
      isWorkerReadyRef.current = false;
      messageHandlersRef.current.clear();
    }
  }, []);

  return {
    searchWorker: workerRef.current,
    buildIndex,
    search,
    batchSearch,
    terminateWorker,
    isWorkerReady: isWorkerReadyRef.current,
    workerError: workerErrorRef.current
  };
};