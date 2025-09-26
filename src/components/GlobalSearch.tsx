import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Clock, Filter, TrendingUp, Users, Target } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';

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

  const [inputValue, setInputValue] = useState(state.globalQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined);

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

    // Show suggestions if there's input
    setShowSuggestions(value.length > 0);
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
    performGlobalSearch('');
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    performGlobalSearch(suggestion);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      if (inputRef.current) {
        inputRef.current.blur();
      }
    }
  };

  const handleToggleAdvancedFilters = () => {
    dispatch({ type: 'TOGGLE_ADVANCED_FILTERS' });
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
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
    <div style={containerStyle}>
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
          value={inputValue}
          onChange={handleInputChange}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length > 0 && setShowSuggestions(true)}
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

        {/* Suggestions Dropdown */}
        {showSuggestions && (
          <div ref={suggestionRef} style={suggestionDropdownStyle}>
            {/* Search History */}
            {state.searchHistory.length > 0 && inputValue.length < 3 && (
              <div>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#666',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Clock size={14} />
                  Recent Searches
                </div>
                {state.searchHistory.slice(0, 5).map((term, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(term)}
                    style={{
                      width: '100%',
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#333',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}

            {/* Search Results Preview */}
            {hasSearchResults && inputValue.length >= 3 && (
              <div>
                <div style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: '#666',
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: '#f8f9fa',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <Target size={14} />
                  Search Results ({state.globalResults.totalResults})
                </div>

                {/* Balance Data Results */}
                {state.globalResults.balanceData.length > 0 && (
                  <div>
                    <div style={{
                      padding: '6px 16px',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#2196f3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <Users size={12} />
                      Accounts ({state.globalResults.balanceData.length})
                    </div>
                    {state.globalResults.balanceData.slice(0, 3).map((account, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '6px 16px 6px 32px',
                          fontSize: '13px',
                          color: '#666',
                          borderLeft: '2px solid #e3f2fd',
                          marginLeft: '14px',
                        }}
                      >
                        {account.accountNumber} - {account.accountName}
                      </div>
                    ))}
                  </div>
                )}

                {/* Positions Data Results */}
                {state.globalResults.positionsData.length > 0 && (
                  <div>
                    <div style={{
                      padding: '6px 16px',
                      fontSize: '11px',
                      fontWeight: '500',
                      color: '#4caf50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <TrendingUp size={12} />
                      Positions ({state.globalResults.positionsData.length})
                    </div>
                    {state.globalResults.positionsData.slice(0, 3).map((position, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '6px 16px 6px 32px',
                          fontSize: '13px',
                          color: '#666',
                          borderLeft: '2px solid #e8f5e8',
                          marginLeft: '14px',
                        }}
                      >
                        {position.symbol} - {position.securityDescription}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {!hasSearchResults && inputValue.length >= 3 && !state.isSearching && (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px',
              }}>
                No results found for "{inputValue}"
              </div>
            )}
          </div>
        )}
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

      {/* Advanced Filters Toggle */}
      {variant !== 'compact' && (
        <button
          onClick={handleToggleAdvancedFilters}
          style={{
            marginLeft: '8px',
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
      )}
    </div>
  );
};

export default GlobalSearch;