import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback } from 'react';
import { useAppContext } from './AppContext';
import { AccountBalance, AccountPosition } from '../types/DataTypes';

// Filter types for different data fields
export interface NumericFilter {
  min?: number;
  max?: number;
  exact?: number;
}

export interface DateFilter {
  from?: string;
  to?: string;
  exact?: string;
}

export interface FilterCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in';
  value: any;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface SavedFilter {
  id: string;
  name: string;
  conditions: FilterCondition[];
  createdAt: string;
  lastUsed: string;
  useCount: number;
}

export interface SearchState {
  // Global search
  globalQuery: string;
  globalResults: {
    balanceData: AccountBalance[];
    positionsData: AccountPosition[];
    totalResults: number;
  };
  isSearching: boolean;

  // Advanced filters
  activeFilters: FilterCondition[];
  filteredData: {
    balanceData: AccountBalance[];
    positionsData: AccountPosition[];
  };

  // Search history and saved filters
  searchHistory: string[];
  savedFilters: SavedFilter[];

  // UI state
  showAdvancedFilters: boolean;
  highlightTerm: string;
  sortConfig: {
    field: string;
    direction: 'asc' | 'desc';
  } | null;
}

export type SearchAction =
  | { type: 'SET_GLOBAL_QUERY'; payload: string }
  | { type: 'SET_GLOBAL_RESULTS'; payload: SearchState['globalResults'] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'ADD_FILTER'; payload: FilterCondition }
  | { type: 'REMOVE_FILTER'; payload: string } // field name
  | { type: 'UPDATE_FILTER'; payload: { field: string; condition: FilterCondition } }
  | { type: 'CLEAR_ALL_FILTERS' }
  | { type: 'SET_FILTERED_DATA'; payload: SearchState['filteredData'] }
  | { type: 'ADD_TO_HISTORY'; payload: string }
  | { type: 'CLEAR_HISTORY' }
  | { type: 'SAVE_FILTER'; payload: Omit<SavedFilter, 'id' | 'createdAt'> }
  | { type: 'DELETE_SAVED_FILTER'; payload: string }
  | { type: 'LOAD_SAVED_FILTER'; payload: string }
  | { type: 'TOGGLE_ADVANCED_FILTERS' }
  | { type: 'SET_HIGHLIGHT_TERM'; payload: string }
  | { type: 'SET_SORT_CONFIG'; payload: SearchState['sortConfig'] }
  | { type: 'RESET_SEARCH' };

const initialState: SearchState = {
  globalQuery: '',
  globalResults: {
    balanceData: [],
    positionsData: [],
    totalResults: 0,
  },
  isSearching: false,
  activeFilters: [],
  filteredData: {
    balanceData: [],
    positionsData: [],
  },
  searchHistory: [],
  savedFilters: [],
  showAdvancedFilters: false,
  highlightTerm: '',
  sortConfig: null,
};

// Local storage key
const SEARCH_STORAGE_KEY = 'financial_manager_search_preferences';

const searchReducer = (state: SearchState, action: SearchAction): SearchState => {
  switch (action.type) {
    case 'SET_GLOBAL_QUERY':
      return {
        ...state,
        globalQuery: action.payload,
        highlightTerm: action.payload,
      };

    case 'SET_GLOBAL_RESULTS':
      return {
        ...state,
        globalResults: action.payload,
        isSearching: false,
      };

    case 'SET_SEARCHING':
      return {
        ...state,
        isSearching: action.payload,
      };

    case 'ADD_FILTER':
      const existingFilterIndex = state.activeFilters.findIndex(f => f.field === action.payload.field);
      const newFilters = existingFilterIndex >= 0
        ? state.activeFilters.map((f, i) => i === existingFilterIndex ? action.payload : f)
        : [...state.activeFilters, action.payload];

      return {
        ...state,
        activeFilters: newFilters,
      };

    case 'REMOVE_FILTER':
      return {
        ...state,
        activeFilters: state.activeFilters.filter(f => f.field !== action.payload),
      };

    case 'UPDATE_FILTER':
      return {
        ...state,
        activeFilters: state.activeFilters.map(f =>
          f.field === action.payload.field ? action.payload.condition : f
        ),
      };

    case 'CLEAR_ALL_FILTERS':
      return {
        ...state,
        activeFilters: [],
        filteredData: {
          balanceData: [],
          positionsData: [],
        },
        highlightTerm: '',
      };

    case 'SET_FILTERED_DATA':
      return {
        ...state,
        filteredData: action.payload,
      };

    case 'ADD_TO_HISTORY':
      if (!action.payload.trim() || state.searchHistory.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        searchHistory: [action.payload, ...state.searchHistory.slice(0, 9)], // Keep last 10
      };

    case 'CLEAR_HISTORY':
      return {
        ...state,
        searchHistory: [],
      };

    case 'SAVE_FILTER':
      const newFilter: SavedFilter = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        savedFilters: [newFilter, ...state.savedFilters.slice(0, 19)], // Keep last 20
      };

    case 'DELETE_SAVED_FILTER':
      return {
        ...state,
        savedFilters: state.savedFilters.filter(f => f.id !== action.payload),
      };

    case 'LOAD_SAVED_FILTER':
      const filter = state.savedFilters.find(f => f.id === action.payload);
      if (!filter) return state;

      // Update usage stats
      const updatedFilter = {
        ...filter,
        lastUsed: new Date().toISOString(),
        useCount: filter.useCount + 1,
      };

      return {
        ...state,
        activeFilters: filter.conditions,
        savedFilters: state.savedFilters.map(f => f.id === action.payload ? updatedFilter : f),
      };

    case 'TOGGLE_ADVANCED_FILTERS':
      return {
        ...state,
        showAdvancedFilters: !state.showAdvancedFilters,
      };

    case 'SET_HIGHLIGHT_TERM':
      return {
        ...state,
        highlightTerm: action.payload,
      };

    case 'SET_SORT_CONFIG':
      return {
        ...state,
        sortConfig: action.payload,
      };

    case 'RESET_SEARCH':
      return {
        ...initialState,
        searchHistory: state.searchHistory,
        savedFilters: state.savedFilters,
      };

    default:
      return state;
  }
};

interface SearchContextType {
  state: SearchState;
  dispatch: React.Dispatch<SearchAction>;

  // Search operations
  performGlobalSearch: (query: string) => void;
  addFilter: (condition: FilterCondition) => void;
  removeFilter: (field: string) => void;
  clearAllFilters: () => void;

  // Filter management
  saveCurrentFilters: (name: string) => void;
  loadSavedFilter: (filterId: string) => void;
  deleteSavedFilter: (filterId: string) => void;

  // Utility functions
  getFilteredData: () => { balanceData: AccountBalance[]; positionsData: AccountPosition[] };
  getSearchResults: () => SearchState['globalResults'];
  highlightText: (text: string, term: string) => React.ReactNode;

  // Computed properties
  hasActiveFilters: boolean;
  hasSearchResults: boolean;
  isFiltering: boolean;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const useSearchContext = (): SearchContextType => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearchContext must be used within a SearchProvider');
  }
  return context;
};

interface SearchProviderProps {
  children: ReactNode;
}

export const SearchProvider: React.FC<SearchProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(searchReducer, initialState);
  const { state: appState } = useAppContext();

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SEARCH_STORAGE_KEY);
      if (saved) {
        const preferences = JSON.parse(saved);
        if (preferences.searchHistory) {
          preferences.searchHistory.forEach((term: string) => {
            dispatch({ type: 'ADD_TO_HISTORY', payload: term });
          });
        }
        if (preferences.savedFilters) {
          preferences.savedFilters.forEach((filter: SavedFilter) => {
            dispatch({ type: 'SAVE_FILTER', payload: filter });
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load search preferences:', error);
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    const preferences = {
      searchHistory: state.searchHistory,
      savedFilters: state.savedFilters,
    };

    try {
      localStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save search preferences:', error);
    }
  }, [state.searchHistory, state.savedFilters]);

  // Search utility functions
  const searchInText = useCallback((text: string, query: string): boolean => {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  }, []);

  const searchInNumber = useCallback((number: any, query: string): boolean => {
    if (number === null || number === undefined) return false;
    return number.toString().includes(query);
  }, []);

  const searchInObject = useCallback((obj: any, query: string): boolean => {
    if (!obj || !query) return false;

    const searchableFields = Object.values(obj).filter(value =>
      value !== null && value !== undefined
    );

    return searchableFields.some(value => {
      if (value === null || value === undefined) return false;
      const strValue = value.toString().toLowerCase();
      return strValue.includes(query.toLowerCase());
    });
  }, []);

  // Global search implementation
  const performGlobalSearch = useCallback((query: string) => {
    dispatch({ type: 'SET_GLOBAL_QUERY', payload: query });

    if (!query.trim()) {
      dispatch({ type: 'SET_GLOBAL_RESULTS', payload: { balanceData: [], positionsData: [], totalResults: 0 } });
      return;
    }

    dispatch({ type: 'SET_SEARCHING', payload: true });

    // Add to search history
    dispatch({ type: 'ADD_TO_HISTORY', payload: query });

    // Search in balance data
    const filteredBalanceData = appState.balanceData.filter(item =>
      searchInObject(item, query)
    );

    // Search in positions data
    const filteredPositionsData = appState.positionsData.filter(item =>
      searchInObject(item, query)
    );

    const results = {
      balanceData: filteredBalanceData,
      positionsData: filteredPositionsData,
      totalResults: filteredBalanceData.length + filteredPositionsData.length,
    };

    // Simulate search delay for better UX
    setTimeout(() => {
      dispatch({ type: 'SET_GLOBAL_RESULTS', payload: results });
    }, 100);
  }, [appState.balanceData, appState.positionsData, searchInObject]);

  // Filter implementation
  const applyFilters = useCallback((filters: FilterCondition[]) => {
    if (filters.length === 0) {
      dispatch({ type: 'SET_FILTERED_DATA', payload: { balanceData: [], positionsData: [] } });
      return;
    }

    const applyFilterToItem = (item: any, condition: FilterCondition): boolean => {
      const fieldValue = item[condition.field];

      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }

      switch (condition.operator) {
        case 'equals':
          return fieldValue.toString().toLowerCase() === condition.value.toString().toLowerCase();
        case 'contains':
          return fieldValue.toString().toLowerCase().includes(condition.value.toString().toLowerCase());
        case 'startsWith':
          return fieldValue.toString().toLowerCase().startsWith(condition.value.toString().toLowerCase());
        case 'endsWith':
          return fieldValue.toString().toLowerCase().endsWith(condition.value.toString().toLowerCase());
        case 'gt':
          return parseFloat(fieldValue) > parseFloat(condition.value);
        case 'gte':
          return parseFloat(fieldValue) >= parseFloat(condition.value);
        case 'lt':
          return parseFloat(fieldValue) < parseFloat(condition.value);
        case 'lte':
          return parseFloat(fieldValue) <= parseFloat(condition.value);
        case 'between':
          const numValue = parseFloat(fieldValue);
          return numValue >= condition.value.min && numValue <= condition.value.max;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        default:
          return true;
      }
    };

    const filteredBalanceData = appState.balanceData.filter(item =>
      filters.every(filter => applyFilterToItem(item, filter))
    );

    const filteredPositionsData = appState.positionsData.filter(item =>
      filters.every(filter => applyFilterToItem(item, filter))
    );

    dispatch({ type: 'SET_FILTERED_DATA', payload: {
      balanceData: filteredBalanceData,
      positionsData: filteredPositionsData,
    } });
  }, [appState.balanceData, appState.positionsData]);

  // Update filtered data when filters or app data changes
  useEffect(() => {
    if (state.activeFilters.length > 0) {
      applyFilters(state.activeFilters);
    }
  }, [state.activeFilters, applyFilters]);

  // Action handlers
  const addFilter = useCallback((condition: FilterCondition) => {
    dispatch({ type: 'ADD_FILTER', payload: condition });
  }, []);

  const removeFilter = useCallback((field: string) => {
    dispatch({ type: 'REMOVE_FILTER', payload: field });
  }, []);

  const clearAllFilters = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_FILTERS' });
  }, []);

  const saveCurrentFilters = useCallback((name: string) => {
    if (state.activeFilters.length === 0) return;

    dispatch({ type: 'SAVE_FILTER', payload: {
      name,
      conditions: state.activeFilters,
      lastUsed: new Date().toISOString(),
      useCount: 0,
    } });
  }, [state.activeFilters]);

  const loadSavedFilter = useCallback((filterId: string) => {
    dispatch({ type: 'LOAD_SAVED_FILTER', payload: filterId });
  }, []);

  const deleteSavedFilter = useCallback((filterId: string) => {
    dispatch({ type: 'DELETE_SAVED_FILTER', payload: filterId });
  }, []);

  // Utility functions
  const getFilteredData = useCallback(() => {
    return state.filteredData;
  }, [state.filteredData]);

  const getSearchResults = useCallback(() => {
    return state.globalResults;
  }, [state.globalResults]);

  const highlightText = useCallback((text: string, term: string): React.ReactNode => {
    if (!term || !text) return text;

    const regex = new RegExp(`(${term})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} style={{ backgroundColor: '#ffeb3b', fontWeight: 'bold' }}>
          {part}
        </span>
      ) : part
    );
  }, []);

  // Computed properties
  const hasActiveFilters = state.activeFilters.length > 0;
  const hasSearchResults = state.globalResults.totalResults > 0;
  const isFiltering = hasActiveFilters || state.globalQuery.length > 0;

  const contextValue: SearchContextType = {
    state,
    dispatch,
    performGlobalSearch,
    addFilter,
    removeFilter,
    clearAllFilters,
    saveCurrentFilters,
    loadSavedFilter,
    deleteSavedFilter,
    getFilteredData,
    getSearchResults,
    highlightText,
    hasActiveFilters,
    hasSearchResults,
    isFiltering,
  };

  return (
    <SearchContext.Provider value={contextValue}>
      {children}
    </SearchContext.Provider>
  );
};

export default SearchContext;