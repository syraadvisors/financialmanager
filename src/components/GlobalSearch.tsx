import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Filter, History } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';
import { useAppContext } from '../contexts/AppContext';
import { searchSuggestionEngine, SearchSuggestion } from '../utils/searchSuggestions';
import SearchSuggestionsDropdown from './SearchSuggestionsDropdown';
import RecentSearches from './RecentSearches';
import { useSearchHistory } from '../utils/searchHistoryManager';

interface GlobalSearchProps {
  placeholder?: string;
  showResultsCount?: boolean;
  autoFocus?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'compact';
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({
  placeholder = "Search accounts, positions, symbols...",
  showResultsCount = true,
  autoFocus = false,
  size = 'medium',
  variant = 'default'
}) => {
  const {
    state,
    performGlobalSearch,
    hasSearchResults,
    dispatch
  } = useSearchContext();

  const { state: appState } = useAppContext();

  const [inputValue, setInputValue] = useState(state.globalQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const recentSearchesRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const { getRecentSearches, getPopularSearches } = useSearchHistory();

  // Size configurations
  const sizeConfig = {
    small: { height: '32px', fontSize: '12px', padding: '6px 12px', iconSize: 16 },
    medium: { height: '40px', fontSize: '14px', padding: '8px 16px', iconSize: 18 },
    large: { height: '48px', fontSize: '16px', padding: '12px 20px', iconSize: 20 }
  };

  const config = sizeConfig[size];

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Sync with context state
  useEffect(() => {
    setInputValue(state.globalQuery);
  }, [state.globalQuery]);

  // Enhanced suggestions with search history integration
  const generateSuggestions = useCallback((query: string) => {
    // Get search history suggestions
    const recentSearches = getRecentSearches(3);
    const popularSearches = getPopularSearches(2);

    // Generate AI suggestions
    const newSuggestions = searchSuggestionEngine.generateSuggestions(
      query,
      appState.balanceData,
      appState.positionsData,
      {
        maxSuggestions: 5,
        includeRecentSearches: false, // We'll add these manually
        includePopularSearches: false, // We'll add these manually
        includeDataSuggestions: true,
        includePatternSuggestions: true
      }
    );

    // Combine with history-based suggestions
    const historySuggestions: SearchSuggestion[] = [
      ...recentSearches.map((search, index) => ({
        id: `recent-${search.id || index}`,
        text: search.query,
        category: 'recent' as const,
        type: 'exact' as const,
        relevanceScore: 0.9,
        metadata: {
          count: search.resultCount,
          lastUsed: search.timestamp,
          dataType: search.category
        },
        description: `${search.resultCount} results`
      })),
      ...popularSearches.map((search, index) => ({
        id: `popular-${search.id || index}`,
        text: search.query,
        category: 'popular' as const,
        type: 'exact' as const,
        relevanceScore: 0.85,
        metadata: {
          count: search.resultCount,
          lastUsed: search.timestamp,
          dataType: search.category
        },
        description: `Popular • ${search.resultCount} results`
      }))
    ];

    // Merge and deduplicate suggestions
    const allSuggestions = [...historySuggestions, ...newSuggestions];
    const uniqueSuggestions = allSuggestions.filter(
      (suggestion, index, self) =>
        self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase()) === index
    );

    setSuggestions(uniqueSuggestions.slice(0, 8));
    setSelectedSuggestionIndex(0);
  }, [appState.balanceData, appState.positionsData, getRecentSearches, getPopularSearches]);

  // Debounced search
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (!isComposing) {
        performGlobalSearch(query);
      }
    }, 300);
  }, [performGlobalSearch, isComposing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);

    // Generate suggestions
    generateSuggestions(value);

    // Show suggestions if there's input or when focused
    setShowSuggestions(true);
  };

  const handleCompositionStart = () => {
    setIsComposing(true);
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    debouncedSearch(e.currentTarget.value);
  };

  const handleClearSearch = () => {
    setInputValue('');
    performGlobalSearch('', 'manual');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    const searchText = suggestion.text;
    setInputValue(searchText);
    performGlobalSearch(searchText, 'suggestion');

    // Close both dropdowns
    setShowSuggestions(false);
    setShowRecentSearches(false);

    // Record the search for future suggestions
    searchSuggestionEngine.recordSearch(searchText);
  };

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    handleSuggestionClick(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (suggestions[selectedSuggestionIndex]) {
          handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
        } else {
          // No suggestion selected, perform regular search
          performGlobalSearch(inputValue, 'manual');
          setShowSuggestions(false);
          searchSuggestionEngine.recordSearch(inputValue);
        }
        break;

      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setShowRecentSearches(false);
        if (inputRef.current) {
          inputRef.current.blur();
        }
        break;

      case 'Tab':
        // Allow tab to close dropdowns without selecting
        setShowSuggestions(false);
        setShowRecentSearches(false);
        break;
    }
  };

  const handleToggleAdvancedFilters = () => {
    dispatch({ type: 'TOGGLE_ADVANCED_FILTERS' });
  };

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside all relevant elements
      const isOutsideInput = inputRef.current && !inputRef.current.contains(target);
      const isOutsideSuggestions = !suggestionRef.current || !suggestionRef.current.contains(target);
      const isOutsideRecent = !recentSearchesRef.current || !recentSearchesRef.current.contains(target);

      // Also check if the click is outside the main container
      const containerElement = inputRef.current?.parentElement;
      const isOutsideContainer = !containerElement || !containerElement.contains(target);

      if (isOutsideInput && isOutsideSuggestions && isOutsideRecent) {
        setShowSuggestions(false);
        setShowRecentSearches(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: variant === 'compact' ? 'inline-flex' : 'flex',
    alignItems: 'center',
    width: variant === 'compact' ? 'auto' : '100%',
    maxWidth: variant === 'compact' ? '300px' : '600px',
  };

  const inputContainerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    transition: 'all 0.2s ease',
    flex: 1,
    minWidth: variant === 'compact' ? '200px' : '300px',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: config.height,
    padding: config.padding,
    paddingLeft: `${parseInt(config.padding.split(' ')[1]) + config.iconSize + 8}px`,
    paddingRight: inputValue || state.isSearching ? `${parseInt(config.padding.split(' ')[1]) + config.iconSize + 16}px` : config.padding,
    fontSize: config.fontSize,
    border: 'none',
    outline: 'none',
    backgroundColor: 'transparent',
    color: '#333',
  };

  const searchIconStyle: React.CSSProperties = {
    position: 'absolute',
    left: config.padding.split(' ')[1],
    top: '50%',
    transform: 'translateY(-50%)',
    color: state.isSearching ? '#2196f3' : '#666',
    pointerEvents: 'none',
  };

  const clearButtonStyle: React.CSSProperties = {
    position: 'absolute',
    right: config.padding.split(' ')[1],
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '4px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    transition: 'all 0.2s ease',
  };

  const suggestionDropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: 'white',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  };

  return (
    <div className="global-search-container" style={containerStyle}>
      {/* Search Input */}
      <div
        style={{
          ...inputContainerStyle,
          borderColor: showSuggestions ? '#2196f3' : '#e0e0e0',
          boxShadow: showSuggestions ? '0 0 0 2px rgba(33, 150, 243, 0.1)' : 'none',
        }}
      >
        <Search
          size={config.iconSize}
          style={searchIconStyle}
        />

        <input
          ref={inputRef}
          type="text"
          data-search="global"
          value={inputValue}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            generateSuggestions(inputValue);
            setShowSuggestions(true);
          }}
          placeholder={placeholder}
          style={inputStyle}
          aria-label="Global search"
          aria-describedby="search-results-count"
        />

        {(inputValue || state.isSearching) && (
          <button
            onClick={handleClearSearch}
            style={clearButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Clear search"
          >
            <X size={config.iconSize - 2} />
          </button>
        )}

        {/* Loading indicator */}
        {state.isSearching && (
          <div style={{
            position: 'absolute',
            right: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '16px',
            height: '16px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        )}

        {/* Enhanced Suggestions Dropdown */}
        <div ref={suggestionRef}>
          <SearchSuggestionsDropdown
            suggestions={suggestions}
            isVisible={showSuggestions}
            selectedIndex={selectedSuggestionIndex}
            onSelect={handleSuggestionClick}
            onMouseEnter={(index) => setSelectedSuggestionIndex(index)}
          />
        </div>

        {/* Recent Searches Dropdown */}
        <div ref={recentSearchesRef}>
          <RecentSearches
            isVisible={showRecentSearches}
            variant="dropdown"
            maxItems={8}
            showStatistics={false}
            showControls={true}
            onClose={() => setShowRecentSearches(false)}
          />
        </div>
      </div>

      {/* Results Count */}
      {showResultsCount && hasSearchResults && (
        <div
          id="search-results-count"
          style={{
            marginLeft: '12px',
            fontSize: '12px',
            color: '#666',
            whiteSpace: 'nowrap',
          }}
        >
          {state.globalResults.totalResults} results
        </div>
      )}

      {/* Controls */}
      {variant !== 'compact' && (
        <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
          {/* Recent Searches Toggle */}
          <button
            onClick={() => {
              setShowRecentSearches(!showRecentSearches);
              setShowSuggestions(false);
              if (!showRecentSearches && inputRef.current) {
                inputRef.current.focus();
              }
            }}
            style={{
              padding: '8px 12px',
              backgroundColor: showRecentSearches ? '#4caf50' : 'white',
              color: showRecentSearches ? 'white' : '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!showRecentSearches) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!showRecentSearches) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
            title="Show recent searches"
          >
            <History size={14} />
            Recent
          </button>

          {/* Advanced Filters Toggle */}
          <button
            onClick={handleToggleAdvancedFilters}
            style={{
              padding: '8px 12px',
              backgroundColor: state.showAdvancedFilters ? '#2196f3' : 'white',
              color: state.showAdvancedFilters ? 'white' : '#666',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              if (!state.showAdvancedFilters) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (!state.showAdvancedFilters) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            <Filter size={14} />
            Filters
          </button>
        </div>
      )}
    </div>
  );
};

// Export with React.memo for performance optimization
export default React.memo(GlobalSearch);
