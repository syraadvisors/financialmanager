import { useRef, useCallback, useEffect, useState } from 'react';

export interface WorkerMessage {
  type: string;
  data?: any;
  error?: string;
  result?: any;
  progress?: number;
  processed?: number;
  total?: number;
}

export interface WorkerState {
  isReady: boolean;
  isProcessing: boolean;
  progress: number;
  error: string | null;
  lastResult: any;
}

export interface UseWebWorkerReturn {
  state: WorkerState;
  postMessage: (type: string, data?: any) => void;
  terminateWorker: () => void;
  restartWorker: () => void;
}

export const useWebWorker = (
  workerPath: string,
  onMessage?: (message: WorkerMessage) => void,
  onError?: (error: ErrorEvent) => void
): UseWebWorkerReturn => {
  const workerRef = useRef<Worker | null>(null);
  const messageHandlerRef = useRef(onMessage);
  const errorHandlerRef = useRef(onError);

  const [state, setState] = useState<WorkerState>({
    isReady: false,
    isProcessing: false,
    progress: 0,
    error: null,
    lastResult: null,
  });

  // Update refs when handlers change
  useEffect(() => {
    messageHandlerRef.current = onMessage;
    errorHandlerRef.current = onError;
  }, [onMessage, onError]);

  // Initialize worker
  const initializeWorker = useCallback(() => {
    try {
      const worker = new Worker(workerPath);

      worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;

        setState(prev => {
          const newState = { ...prev };

          switch (message.type) {
            case 'worker_ready':
              newState.isReady = true;
              newState.error = null;
              break;

            case 'parsing_started':
            case 'extraction_started':
            case 'sorting_started':
            case 'filtering_started':
              newState.isProcessing = true;
              newState.progress = 0;
              newState.error = null;
              break;

            case 'progress':
            case 'extraction_progress':
              newState.progress = message.progress || 0;
              break;

            case 'parsing_complete':
            case 'extraction_complete':
            case 'validation_complete':
            case 'sorting_complete':
            case 'filtering_complete':
              newState.isProcessing = false;
              newState.progress = 100;
              newState.lastResult = message.result;
              newState.error = null;
              break;

            case 'error':
              newState.isProcessing = false;
              newState.error = message.error || 'Unknown worker error';
              break;

            default:
              // Handle custom message types
              break;
          }

          return newState;
        });

        // Call custom message handler if provided
        if (messageHandlerRef.current) {
          messageHandlerRef.current(message);
        }
      };

      worker.onerror = (error: ErrorEvent) => {
        setState(prev => ({
          ...prev,
          isReady: false,
          isProcessing: false,
          error: error.message || 'Worker error occurred',
        }));

        if (errorHandlerRef.current) {
          errorHandlerRef.current(error);
        }
      };

      worker.onmessageerror = (error: MessageEvent) => {
        setState(prev => ({
          ...prev,
          error: 'Worker message error occurred',
        }));

        console.error('Worker message error:', error);
      };

      workerRef.current = worker;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to initialize worker: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    }
  }, [workerPath]);

  // Post message to worker
  const postMessage = useCallback((type: string, data?: any) => {
    if (!workerRef.current) {
      console.warn('Worker not initialized');
      return;
    }

    if (!state.isReady) {
      console.warn('Worker not ready');
      return;
    }

    try {
      workerRef.current.postMessage({ type, data });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Failed to post message: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }));
    }
  }, [state.isReady]);

  // Terminate worker
  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setState({
      isReady: false,
      isProcessing: false,
      progress: 0,
      error: null,
      lastResult: null,
    });
  }, []);

  // Restart worker
  const restartWorker = useCallback(() => {
    terminateWorker();
    setTimeout(initializeWorker, 100);
  }, [terminateWorker, initializeWorker]);

  // Initialize worker on mount
  useEffect(() => {
    initializeWorker();

    // Cleanup on unmount
    return () => {
      terminateWorker();
    };
  }, [initializeWorker, terminateWorker]);

  return {
    state,
    postMessage,
    terminateWorker,
    restartWorker,
  };
};

// Specialized hooks for common operations
export const useCsvWorker = (
  onParsingComplete?: (result: any) => void,
  onValidationComplete?: (result: any) => void,
  onExtractionComplete?: (result: any) => void,
  onError?: (error: string) => void
) => {
  const handleMessage = useCallback((message: WorkerMessage) => {
    switch (message.type) {
      case 'parsing_complete':
        if (onParsingComplete) onParsingComplete(message.result);
        break;
      case 'validation_complete':
        if (onValidationComplete) onValidationComplete(message.result);
        break;
      case 'extraction_complete':
        if (onExtractionComplete) onExtractionComplete(message.result);
        break;
      case 'error':
        if (onError) onError(message.error || 'Unknown error');
        break;
      default:
        break;
    }
  }, [onParsingComplete, onValidationComplete, onExtractionComplete, onError]);

  const handleError = useCallback((error: ErrorEvent) => {
    if (onError) onError(error.message || 'Worker error');
  }, [onError]);

  const worker = useWebWorker('/csvWorker.js', handleMessage, handleError);

  // Convenience methods
  const parseCSV = useCallback((fileContent: string, fileName: string) => {
    worker.postMessage('parse_csv', { fileContent, fileName });
  }, [worker]);

  const extractColumns = useCallback((rawData: any[], fileType: string) => {
    worker.postMessage('extract_columns', { rawData, fileType });
  }, [worker]);

  const sortData = useCallback((data: any[], field: string, direction: 'asc' | 'desc') => {
    worker.postMessage('sort_data', { data, field, direction });
  }, [worker]);

  const filterData = useCallback((data: any[], filters: Record<string, any>) => {
    worker.postMessage('filter_data', { data, filters });
  }, [worker]);

  return {
    ...worker,
    parseCSV,
    extractColumns,
    sortData,
    filterData,
  };
};
