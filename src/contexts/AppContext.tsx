import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { FileType, AccountBalance, AccountPosition } from '../types/DataTypes';
import { PageType } from '../types/NavigationTypes';

// Extended interface for file history with better typing
export interface FileHistoryEntry {
  id: string;
  fileName: string;
  fileType: FileType;
  importDate: string;
  recordCount: number;
  summary: any;
}

// Enhanced last import interface
export interface LastImport {
  type: FileType | null;
  summary: any;
  timestamp: string;
  fileName?: string;
}

// Application state interface
export interface AppState {
  currentPage: PageType;
  balanceData: AccountBalance[];
  positionsData: AccountPosition[];
  fileHistory: FileHistoryEntry[];
  isLoading: boolean;
  lastImport: LastImport;
  error: string | null;
  // New state management features
  undoStack: AppState[];
  redoStack: AppState[];
  isDirty: boolean; // Has unsaved changes
}

// Action types for state management
export type AppAction =
  | { type: 'SET_CURRENT_PAGE'; payload: PageType }
  | { type: 'SET_BALANCE_DATA'; payload: AccountBalance[] }
  | { type: 'SET_POSITIONS_DATA'; payload: AccountPosition[] }
  | { type: 'ADD_FILE_HISTORY'; payload: FileHistoryEntry }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_LAST_IMPORT'; payload: LastImport }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ALL_DATA' }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SAVE_STATE' }
  | { type: 'RESTORE_STATE'; payload: Partial<AppState> }
  | { type: 'MARK_CLEAN' }
  | { type: 'MARK_DIRTY' };

// Initial state
const initialState: AppState = {
  currentPage: PageType.OVERVIEW,
  balanceData: [],
  positionsData: [],
  fileHistory: [],
  isLoading: false,
  lastImport: { type: null, summary: null, timestamp: '' },
  error: null,
  undoStack: [],
  redoStack: [],
  isDirty: false,
};

// Local storage keys
const STORAGE_KEYS = {
  APP_STATE: 'financial_manager_state',
  SETTINGS: 'financial_manager_settings',
} as const;

// Utility function to create a state snapshot for undo/redo
const createStateSnapshot = (state: AppState): AppState => ({
  ...state,
  undoStack: [], // Don't include undo/redo stacks in snapshots
  redoStack: [],
  isDirty: false,
});

// State reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  const createUndoableState = (newState: Partial<AppState>): AppState => {
    const snapshot = createStateSnapshot(state);
    return {
      ...state,
      ...newState,
      undoStack: [snapshot, ...state.undoStack.slice(0, 9)], // Keep last 10 states
      redoStack: [], // Clear redo stack on new action
      isDirty: true,
    };
  };

  switch (action.type) {
    case 'SET_CURRENT_PAGE':
      return { ...state, currentPage: action.payload };

    case 'SET_BALANCE_DATA':
      return createUndoableState({
        balanceData: action.payload,
        error: null,
      });

    case 'SET_POSITIONS_DATA':
      return createUndoableState({
        positionsData: action.payload,
        error: null,
      });

    case 'ADD_FILE_HISTORY':
      return createUndoableState({
        fileHistory: [action.payload, ...state.fileHistory.slice(0, 9)], // Keep last 10
      });

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_LAST_IMPORT':
      return { ...state, lastImport: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'CLEAR_ALL_DATA':
      return createUndoableState({
        balanceData: [],
        positionsData: [],
        fileHistory: [],
        lastImport: { type: null, summary: null, timestamp: '' },
        error: null,
      });

    case 'UNDO':
      if (state.undoStack.length === 0) return state;
      const previousState = state.undoStack[0];
      const remainingUndoStack = state.undoStack.slice(1);
      const newRedoStack = [createStateSnapshot(state), ...state.redoStack.slice(0, 9)];

      return {
        ...previousState,
        currentPage: state.currentPage, // Keep current page
        isLoading: state.isLoading, // Keep loading state
        undoStack: remainingUndoStack,
        redoStack: newRedoStack,
        isDirty: remainingUndoStack.length > 0,
      };

    case 'REDO':
      if (state.redoStack.length === 0) return state;
      const nextState = state.redoStack[0];
      const remainingRedoStack = state.redoStack.slice(1);
      const newUndoStack = [createStateSnapshot(state), ...state.undoStack.slice(0, 9)];

      return {
        ...nextState,
        currentPage: state.currentPage, // Keep current page
        isLoading: state.isLoading, // Keep loading state
        undoStack: newUndoStack,
        redoStack: remainingRedoStack,
        isDirty: true,
      };

    case 'SAVE_STATE':
      return { ...state, isDirty: false };

    case 'RESTORE_STATE':
      return { ...state, ...action.payload, isDirty: false };

    case 'MARK_CLEAN':
      return { ...state, isDirty: false };

    case 'MARK_DIRTY':
      return { ...state, isDirty: true };

    default:
      return state;
  }
};

// Context interface
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Convenience methods
  setCurrentPage: (page: PageType) => void;
  setBalanceData: (data: AccountBalance[]) => void;
  setPositionsData: (data: AccountPosition[]) => void;
  addFileHistory: (entry: FileHistoryEntry) => void;
  setLoading: (loading: boolean) => void;
  setLastImport: (lastImport: LastImport) => void;
  setError: (error: string | null) => void;
  clearAllData: () => void;
  undo: () => void;
  redo: () => void;
  saveState: () => void;
  restoreState: (state: Partial<AppState>) => void;
  // Data import helper
  handleDataImported: (data: any[], fileType: FileType, summary: any, fileName?: string) => void;
  // Computed properties
  canUndo: boolean;
  canRedo: boolean;
  hasData: boolean;
  totalRecords: number;
}

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook to use the context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Provider component
interface AppProviderProps {
  children: ReactNode;
  enablePersistence?: boolean;
}

export const AppProvider: React.FC<AppProviderProps> = ({
  children,
  enablePersistence = true
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.APP_STATE);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Validate the saved state structure
        if (parsedState && typeof parsedState === 'object') {
          // Ensure arrays are valid
          const validatedState = {
            ...parsedState,
            balanceData: Array.isArray(parsedState.balanceData)
              ? parsedState.balanceData.filter((row: any) => row != null && typeof row === 'object')
              : [],
            positionsData: Array.isArray(parsedState.positionsData)
              ? parsedState.positionsData.filter((row: any) => row != null && typeof row === 'object')
              : [],
            fileHistory: Array.isArray(parsedState.fileHistory) ? parsedState.fileHistory : [],
          };
          console.log('[AppContext] Loading state from localStorage:', {
            balanceDataLength: validatedState.balanceData.length,
            positionsDataLength: validatedState.positionsData.length,
            firstBalanceRow: validatedState.balanceData[0]
          });
          dispatch({ type: 'RESTORE_STATE', payload: validatedState });
        }
      }
    } catch (error) {
      console.warn('Failed to load saved state:', error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEYS.APP_STATE);
    }
  }, [enablePersistence]);

  // Save state to localStorage when it changes (debounced)
  useEffect(() => {
    if (!enablePersistence) return;

    const saveTimeout = setTimeout(() => {
      try {
        const stateToSave = {
          balanceData: state.balanceData,
          positionsData: state.positionsData,
          fileHistory: state.fileHistory,
          lastImport: state.lastImport,
          // Don't persist UI state, loading states, or undo/redo stacks
        };
        localStorage.setItem(STORAGE_KEYS.APP_STATE, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save state:', error);
      }
    }, 1000); // Debounce saves by 1 second

    return () => clearTimeout(saveTimeout);
  }, [state.balanceData, state.positionsData, state.fileHistory, state.lastImport, enablePersistence]);

  // Convenience methods
  const setCurrentPage = (page: PageType) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
  };

  const setBalanceData = (data: AccountBalance[]) => {
    dispatch({ type: 'SET_BALANCE_DATA', payload: data });
  };

  const setPositionsData = (data: AccountPosition[]) => {
    dispatch({ type: 'SET_POSITIONS_DATA', payload: data });
  };

  const addFileHistory = (entry: FileHistoryEntry) => {
    dispatch({ type: 'ADD_FILE_HISTORY', payload: entry });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setLastImport = (lastImport: LastImport) => {
    dispatch({ type: 'SET_LAST_IMPORT', payload: lastImport });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearAllData = () => {
    dispatch({ type: 'CLEAR_ALL_DATA' });
  };

  const undo = () => {
    dispatch({ type: 'UNDO' });
  };

  const redo = () => {
    dispatch({ type: 'REDO' });
  };

  const saveState = () => {
    dispatch({ type: 'SAVE_STATE' });
  };

  const restoreState = (newState: Partial<AppState>) => {
    dispatch({ type: 'RESTORE_STATE', payload: newState });
  };

  // Enhanced data import handler
  const handleDataImported = (data: any[], fileType: FileType, summary: any, fileName?: string) => {
    console.log('[AppContext] handleDataImported called with:', {
      dataLength: data?.length,
      fileType,
      firstRow: data?.[0],
      summary
    });

    const timestamp = new Date().toLocaleString();

    // Create file history entry
    const historyEntry: FileHistoryEntry = {
      id: Date.now().toString(),
      fileName: fileName || `${fileType.toLowerCase()}_data.csv`,
      fileType: fileType,
      importDate: timestamp,
      recordCount: data.length,
      summary: summary,
    };

    // Add to history
    addFileHistory(historyEntry);

    // Update appropriate data
    if (fileType === FileType.ACCOUNT_BALANCE) {
      console.log('[AppContext] Setting balance data with', data.length, 'rows');
      setBalanceData(data);
    } else if (fileType === FileType.POSITIONS) {
      setPositionsData(data);
    }

    // Update last import
    setLastImport({
      type: fileType,
      summary,
      timestamp,
      fileName: historyEntry.fileName
    });

    // Clear any previous errors
    setError(null);
  };

  // Computed properties
  const canUndo = state.undoStack.length > 0;
  const canRedo = state.redoStack.length > 0;
  const hasData = state.balanceData.length > 0 || state.positionsData.length > 0;
  const totalRecords = state.balanceData.length + state.positionsData.length;

  const contextValue: AppContextType = {
    state,
    dispatch,
    setCurrentPage,
    setBalanceData,
    setPositionsData,
    addFileHistory,
    setLoading,
    setLastImport,
    setError,
    clearAllData,
    undo,
    redo,
    saveState,
    restoreState,
    handleDataImported,
    canUndo,
    canRedo,
    hasData,
    totalRecords,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

export default AppContext;