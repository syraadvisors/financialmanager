import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { List } from 'react-window';
import { SortAsc, SortDesc, Search, Navigation } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';
import { HighlightedText } from '../utils/textHighlighting';
import LoadingSkeleton from './LoadingSkeleton';
import '../styles/searchHighlighting.css';

export interface SearchableTableColumn<T = any> {
  key: keyof T;
  label: string;
  width: number;
  sortable?: boolean;
  essential?: boolean;
  searchable?: boolean; // New: Whether this column is searchable
  formatter?: (value: any, row: T, highlightTerm?: string) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface SearchableTableProps<T = any> {
  data: T[];
  columns: SearchableTableColumn<T>[];
  height: number;
  rowHeight?: number;
  showAllColumns?: boolean;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  className?: string;
  overscanCount?: number;
  enableHighlighting?: boolean;
  showSearchIndicator?: boolean;
  searchPlaceholder?: string;
  enableKeyboardNavigation?: boolean;
  showSearchStats?: boolean;
  highlightIntensity?: 'low' | 'medium' | 'high';
}

interface RowData<T> {
  items: T[];
  columns: SearchableTableColumn<T>[];
  highlightTerm: string;
  focusedRowIndex: number;
  selectedRowIndex: number;
  searchMatches: Record<number, number>; // Changed from Map to plain object for react-window compatibility
  showSearchIndicator: boolean;
  enableKeyboardNavigation: boolean;
  // Note: All functions removed from this interface to ensure Object.values() compatibility
}

// Row renderer component - defined outside main component for stability
const VirtualizedRow = React.memo(<T extends any>(props: {
  index: number;
  style: React.CSSProperties;
  data?: RowData<T>;
}) => {
  const { index, style, data } = props;

  // Safety check: if data is undefined, render empty row
  if (!data) {
    console.error('[SearchableVirtualTable] No data provided to VirtualizedRow');
    return (
      <div style={{ ...style, padding: '8px', color: '#999' }}>
        No data
      </div>
    );
  }

  const {
    items,
    columns,
    highlightTerm,
    focusedRowIndex,
    selectedRowIndex,
    searchMatches,
    showSearchIndicator,
    enableKeyboardNavigation,
  } = data;

  // Safety check: if item is null/undefined, render empty row
  if (!items || !items[index]) {
    console.error('[SearchableVirtualTable] No item at index:', index);
    return (
      <div style={{ ...style, padding: '8px', color: '#999' }}>
        Invalid data at row {index}
      </div>
    );
  }

  const item = items[index];

  // Check if this row matches the current search
  const matchCount = searchMatches[index] || 0;
  const isMatch = matchCount > 0;
  const isFocused = index === focusedRowIndex;
  const isSelected = index === selectedRowIndex;

  // Determine row background based on state
  let backgroundColor;
  if (isSelected) {
    backgroundColor = '#1976d2';
  } else if (isFocused) {
    backgroundColor = '#e3f2fd';
  } else if (isMatch) {
    backgroundColor = index % 2 === 0 ? '#fff8e1' : '#fff3cd';
  } else {
    backgroundColor = index % 2 === 0 ? 'white' : '#fafafa';
  }

  // Get intensity class based on match count
  const getIntensityClass = (count: number) => {
    if (count >= 3) return 'search-match-intensity--high';
    if (count >= 2) return 'search-match-intensity--medium';
    return 'search-match-intensity--low';
  };

  return (
    <div
      className={`
        ${isMatch ? 'table-row--highlighted' : ''}
        ${isFocused ? 'search-result--focused' : ''}
        ${isSelected ? 'search-result--selected' : ''}
      `.trim()}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor,
        cursor: 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        color: isSelected ? 'white' : '#333',
      }}
    >
      {/* Enhanced search match indicator */}
      {showSearchIndicator && isMatch && (
        <>
          <div
            className={`search-match-intensity ${getIntensityClass(matchCount)}`}
          />
          {matchCount > 1 && (
            <div className="search-results-indicator">
              {matchCount}
            </div>
          )}
        </>
      )}

      {/* Navigation indicator for focused/selected rows */}
      {(isFocused || isSelected) && enableKeyboardNavigation && (
        <div className="search-navigation-indicator">
          {isSelected ? '✓' : '▶'}
        </div>
      )}

      {columns.map((column: SearchableTableColumn<T>, colIndex: number) => {
        const value = item[column.key];
        const displayValue = column.formatter ? column.formatter(value, item) : value;

        // Check if this cell has matches
        const cellHasMatch = highlightTerm && column.searchable !== false && value &&
          value.toString().toLowerCase().includes(highlightTerm.toLowerCase());

        return (
          <div
            key={`${column.key as string}-${colIndex}`}
            className={cellHasMatch ? 'table-cell--has-match' : ''}
            style={{
              width: column.width,
              padding: '8px 12px',
              textAlign: column.align || 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '14px',
              color: isSelected ? 'white' : '#333',
              paddingLeft: showSearchIndicator && colIndex === 0 ? '28px' : '12px',
              position: 'relative',
            }}
            title={`${typeof value === 'string' ? value : String(value)}${
              cellHasMatch ? ` (${matchCount} matches in row)` : ''
            }`}
          >
            {displayValue as React.ReactNode}
          </div>
        );
      })}
    </div>
  );
}) as any; // Type cast to work with react-window's expectations

const SearchableVirtualTable = <T extends any>({
  data,
  columns,
  height,
  rowHeight = 40,
  showAllColumns = false,
  sortField,
  sortDirection,
  onSort,
  onRowClick,
  loading = false,
  className = '',
  overscanCount = 5,
  enableHighlighting = true,
  showSearchIndicator = true,
  enableKeyboardNavigation = true,
  showSearchStats = true,
  highlightIntensity = 'medium',
}: SearchableTableProps<T>): React.JSX.Element => {
  const listRef = useRef<any>(null);
  const { state: searchState } = useSearchContext();

  // Navigation state
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const [selectedRowIndex, setSelectedRowIndex] = useState(-1);
  const [searchMatches, setSearchMatches] = useState<Map<number, number>>(new Map());
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);

  // Store setState functions in a ref to avoid passing them through itemData
  const stateCallbacksRef = useRef({
    setFocusedRowIndex,
    setSelectedRowIndex,
  });

  // Update ref when functions change
  useEffect(() => {
    stateCallbacksRef.current = {
      setFocusedRowIndex,
      setSelectedRowIndex,
    };
  }, [setFocusedRowIndex, setSelectedRowIndex]);

  // Filter columns based on showAllColumns
  const visibleColumns = useMemo(() => {
    return showAllColumns ? columns : columns.filter(col => col.essential !== false);
  }, [columns, showAllColumns]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => sum + col.width, 0);
  }, [visibleColumns]);

  // Calculate search matches and statistics
  const searchStatistics = useMemo(() => {
    if (!searchState.highlightTerm || !enableHighlighting) {
      setSearchMatches(new Map());
      setTotalMatches(0);
      return { totalMatches: 0, rowsWithMatches: 0, averageMatches: 0 };
    }

    const matches = new Map<number, number>();
    let totalCount = 0;
    let rowsWithMatches = 0;

    data.forEach((item, index) => {
      let rowMatches = 0;
      visibleColumns.forEach(column => {
        if (column.searchable === false) return;

        const value = item[column.key];
        if (value) {
          const stringValue = value.toString();
          const regex = new RegExp(searchState.highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const columnMatches = (stringValue.match(regex) || []).length;
          rowMatches += columnMatches;
        }
      });

      if (rowMatches > 0) {
        matches.set(index, rowMatches);
        totalCount += rowMatches;
        rowsWithMatches++;
      }
    });

    setSearchMatches(matches);
    setTotalMatches(totalCount);

    return {
      totalMatches: totalCount,
      rowsWithMatches,
      averageMatches: rowsWithMatches > 0 ? (totalCount / rowsWithMatches).toFixed(1) : 0
    };
  }, [data, visibleColumns, searchState.highlightTerm, enableHighlighting]);

  // Search results summary - moved before early returns to fix hooks rule
  const searchResultsSummary = useMemo(() => {
    if (!searchState.globalQuery && searchState.activeFilters.length === 0) return null;

    const totalOriginalData = searchState.globalResults.balanceData.length + searchState.globalResults.positionsData.length;
    const hasResults = data.length > 0;

    return (
      <div style={{
        padding: '8px 12px',
        backgroundColor: hasResults ? '#e8f5e8' : '#ffebee',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '12px',
        color: hasResults ? '#2e7d32' : '#d32f2f',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
      }}>
        <Search size={14} />
        {searchState.globalQuery && (
          <span>Search: "{searchState.globalQuery}"</span>
        )}
        {searchState.activeFilters.length > 0 && (
          <span>
            {searchState.globalQuery ? ' • ' : ''}
            {searchState.activeFilters.length} filter{searchState.activeFilters.length !== 1 ? 's' : ''} active
          </span>
        )}

        {/* Enhanced search statistics */}
        {showSearchStats && searchStatistics.totalMatches > 0 && (
          <span style={{
            marginLeft: '12px',
            padding: '2px 6px',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            borderRadius: '4px',
            fontSize: '11px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Navigation size={10} />
            {searchStatistics.totalMatches} matches in {searchStatistics.rowsWithMatches} rows
          </span>
        )}

        <span style={{ marginLeft: 'auto', fontWeight: '500' }}>
          {data.length} of {totalOriginalData || 'unknown'} records
        </span>

        {/* Keyboard navigation hints */}
        {enableKeyboardNavigation && searchStatistics.totalMatches > 0 && (
          <div style={{
            position: 'absolute',
            right: '12px',
            bottom: '-18px',
            fontSize: '10px',
            color: '#666',
            backgroundColor: 'white',
            padding: '2px 6px',
            borderRadius: '0 0 4px 4px',
            border: '1px solid #e0e0e0',
            borderTop: 'none',
          }}>
            Use ↑↓ to navigate, Enter to select
          </div>
        )}
      </div>
    );
  }, [searchState, data.length, searchStatistics, showSearchStats, enableKeyboardNavigation]);

  // Enhanced formatter that supports highlighting
  const createHighlightFormatter = useCallback((
    column: SearchableTableColumn<T>,
    originalFormatter?: (value: any, row: T, highlightTerm?: string) => React.ReactNode
  ) => {
    return (value: any, row: T): React.ReactNode => {
      if (originalFormatter) {
        return originalFormatter(value, row, searchState.highlightTerm);
      }

      if (!enableHighlighting || !searchState.highlightTerm || column.searchable === false) {
        return value;
      }

      if (typeof value === 'string' && searchState.highlightTerm) {
        return (
          <HighlightedText
            text={value}
            searchTerm={searchState.highlightTerm}
            options={{ fuzzyMatching: true, maxHighlights: 3 }}
          />
        );
      }

      if (typeof value === 'number' && searchState.highlightTerm) {
        const strValue = value.toString();
        if (strValue.includes(searchState.highlightTerm)) {
          return (
            <HighlightedText
              text={strValue}
              searchTerm={searchState.highlightTerm}
              options={{ fuzzyMatching: false, maxHighlights: 2 }}
            />
          );
        }
      }

      return value;
    };
  }, [enableHighlighting, searchState.highlightTerm]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events when the table is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';

      if (isInputFocused && !e.ctrlKey) return;

      const matchingRows = Array.from(searchMatches.keys());

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (matchingRows.length === 0) {
            // Navigate through all rows if no search
            setFocusedRowIndex(prev => Math.min(prev + 1, data.length - 1));
          } else {
            // Navigate through matching rows only
            const currentIndex = matchingRows.indexOf(focusedRowIndex);
            const nextIndex = currentIndex < matchingRows.length - 1 ? currentIndex + 1 : 0;
            setFocusedRowIndex(matchingRows[nextIndex]);
            setCurrentMatchIndex(nextIndex);
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (matchingRows.length === 0) {
            setFocusedRowIndex(prev => Math.max(prev - 1, 0));
          } else {
            const currentIndex = matchingRows.indexOf(focusedRowIndex);
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : matchingRows.length - 1;
            setFocusedRowIndex(matchingRows[prevIndex]);
            setCurrentMatchIndex(prevIndex);
          }
          break;

        case 'Enter':
          e.preventDefault();
          if (focusedRowIndex >= 0 && focusedRowIndex < data.length) {
            setSelectedRowIndex(focusedRowIndex);
            if (onRowClick) {
              onRowClick(data[focusedRowIndex], focusedRowIndex);
            }
          }
          break;

        case 'Escape':
          e.preventDefault();
          setFocusedRowIndex(-1);
          setSelectedRowIndex(-1);
          break;

        case 'f':
          if (e.ctrlKey) {
            e.preventDefault();
            // Focus search input
            const searchInput = document.querySelector('[data-search="global"]') as HTMLInputElement;
            if (searchInput) {
              searchInput.focus();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardNavigation, focusedRowIndex, searchMatches, data, onRowClick]);

  // Auto-scroll to focused row
  useEffect(() => {
    if (focusedRowIndex >= 0 && listRef.current) {
      listRef.current.scrollToItem(focusedRowIndex, 'smart');
    }
  }, [focusedRowIndex]);

  // Reset focused row when search changes
  useEffect(() => {
    if (searchMatches.size > 0) {
      const firstMatch = Array.from(searchMatches.keys())[0];
      setFocusedRowIndex(firstMatch);
      setCurrentMatchIndex(0);
    } else {
      setFocusedRowIndex(-1);
    }
  }, [searchMatches]);

  // Pre-process columns with formatters
  const processedColumns = useMemo(() => {
    return visibleColumns.map(col => ({
      ...col,
      formatter: createHighlightFormatter(col, col.formatter)
    }));
  }, [visibleColumns, createHighlightFormatter]);

  // Create stable itemData object for react-window
  // Note: We need to ensure all values are serializable for react-window's internal Object.values() call
  const itemData = useMemo(() => {
    // Ensure all required data exists
    if (!data || !processedColumns) {
      console.warn('[SearchableVirtualTable] Missing data or columns for itemData');
      return null;
    }

    // Convert Map to plain object for react-window compatibility
    // react-window uses Object.values() internally which doesn't work with Maps
    const searchMatchesObj = Object.fromEntries(searchMatches || new Map());

    return {
      items: data,
      columns: processedColumns,
      highlightTerm: searchState.highlightTerm || '',
      focusedRowIndex,
      selectedRowIndex,
      searchMatches: searchMatchesObj, // Use plain object instead of Map for react-window compatibility
      showSearchIndicator,
      enableKeyboardNavigation,
      // Note: All functions removed to ensure Object.values() compatibility
    };
  }, [
    data,
    processedColumns,
    searchState.highlightTerm,
    focusedRowIndex,
    selectedRowIndex,
    searchMatches,
    showSearchIndicator,
    enableKeyboardNavigation
  ]);

  // Handle sorting
  const handleSort = useCallback((field: string) => {
    if (!onSort) return;

    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(field, newDirection);
  }, [sortField, sortDirection, onSort]);

  // Render sort icon
  const renderSortIcon = useCallback((field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <SortAsc size={14} style={{ marginLeft: '4px' }} />
      : <SortDesc size={14} style={{ marginLeft: '4px' }} />;
  }, [sortField, sortDirection]);

  // Loading state
  if (loading) {
    return <LoadingSkeleton type="table" count={8} />;
  }

  // Empty state
  if (data.length === 0) {
    const hasSearch = searchState.globalQuery || searchState.activeFilters.length > 0;

    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#666' }}>
          {hasSearch ? (
            <>
              <Search size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No matching results</p>
              <p style={{ fontSize: '14px' }}>
                Try adjusting your search terms or filters
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No data available</p>
              <p style={{ fontSize: '14px' }}>Import data to see results here</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white',
      }}
    >
      {/* Search Results Summary */}
      {searchResultsSummary}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        {visibleColumns.map((column) => (
          <div
            key={column.key as string}
            style={{
              width: column.width,
              padding: '12px',
              paddingLeft: showSearchIndicator ? (visibleColumns.indexOf(column) === 0 ? '20px' : '12px') : '12px',
              fontWeight: '600',
              fontSize: '14px',
              color: '#333',
              borderRight: '1px solid #e0e0e0',
              cursor: column.sortable && onSort ? 'pointer' : 'default',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: column.align === 'right' ? 'flex-end' :
                              column.align === 'center' ? 'center' : 'flex-start',
              position: 'relative',
            }}
            onClick={() => column.sortable && handleSort(column.key as string)}
          >
            {column.label}
            {column.sortable && renderSortIcon(column.key as string)}

            {/* Searchable indicator */}
            {column.searchable !== false && searchState.highlightTerm && (
              <div
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#4caf50',
                  borderRadius: '50%',
                }}
                title="This column is searchable"
              />
            )}
          </div>
        ))}
      </div>

      {/* Virtual List */}
      {data && data.length > 0 && itemData ? (
        <List
          ref={listRef}
          height={height - 50 - (searchResultsSummary ? 32 : 0)}
          width={totalWidth}
          itemCount={data.length}
          itemSize={rowHeight}
          overscanCount={overscanCount}
          itemData={itemData}
        >
          {VirtualizedRow}
        </List>
      ) : (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          {!itemData ? 'Loading table data...' : 'No data to display'}
        </div>
      )}

      {/* Enhanced Footer with detailed search stats */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          fontSize: '12px',
          color: '#666',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span>
          Showing {data.length.toLocaleString()} rows
          {searchStatistics.totalMatches > 0 && (
            <span style={{ marginLeft: '8px', color: '#1976d2' }}>
              • {searchStatistics.totalMatches} matches
              {searchStatistics.rowsWithMatches > 1 && (
                <span> (avg {searchStatistics.averageMatches} per row)</span>
              )}
            </span>
          )}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Keyboard navigation info */}
          {enableKeyboardNavigation && focusedRowIndex >= 0 && (
            <span style={{
              fontSize: '11px',
              color: '#1976d2',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Navigation size={10} />
              Row {focusedRowIndex + 1} of {data.length}
              {searchMatches.size > 0 && (
                <span> • Match {currentMatchIndex + 1} of {searchMatches.size}</span>
              )}
            </span>
          )}

          {/* Highlighting legend */}
          {enableHighlighting && searchState.highlightTerm && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div className="search-match-intensity search-match-intensity--high" style={{ width: '8px', height: '8px', borderRadius: '2px' }} />
                <span>High</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div className="search-match-intensity search-match-intensity--medium" style={{ width: '8px', height: '8px', borderRadius: '2px' }} />
                <span>Med</span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <div className="search-match-intensity search-match-intensity--low" style={{ width: '8px', height: '8px', borderRadius: '2px' }} />
                <span>Low</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Statistics Overlay (when enabled and searching) */}
      {showSearchStats && searchState.highlightTerm && searchStatistics.totalMatches > 0 && (
        <div className="search-stats-overlay">
          <div>🔍 "{searchState.highlightTerm}"</div>
          <div>{searchStatistics.totalMatches} matches • {searchStatistics.rowsWithMatches} rows</div>
          {enableKeyboardNavigation && (
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              ↑↓ navigate • ⏎ select • ⎋ clear
            </div>
          )}
        </div>
      )}

    </div>
  );
};

// Navigation helper functions for external use
export const searchTableNavigationHelpers = {
  focusSearchInput: () => {
    const searchInput = document.querySelector('[data-search="global"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  },

  clearSearch: () => {
    const searchInput = document.querySelector('[data-search="global"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
};

// Export with React.memo for performance optimization
export default React.memo(SearchableVirtualTable) as typeof SearchableVirtualTable;