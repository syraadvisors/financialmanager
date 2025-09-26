import React, { useMemo, useCallback, useRef } from 'react';
import { List } from 'react-window';
import { SortAsc, SortDesc, Search } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';
import HighlightText from './HighlightText';

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
}

interface RowData<T> {
  items: T[];
  columns: SearchableTableColumn<T>[];
  onRowClick?: (row: T, index: number) => void;
  highlightTerm: string;
  enableHighlighting: boolean;
}

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
}: SearchableTableProps<T>): React.JSX.Element => {
  const listRef = useRef<any>(null);
  const { state: searchState } = useSearchContext();

  // Filter columns based on showAllColumns
  const visibleColumns = useMemo(() => {
    return showAllColumns ? columns : columns.filter(col => col.essential !== false);
  }, [columns, showAllColumns]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => sum + col.width, 0);
  }, [visibleColumns]);

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
        <span style={{ marginLeft: 'auto', fontWeight: '500' }}>
          {data.length} of {totalOriginalData || 'unknown'} records
        </span>
      </div>
    );
  }, [searchState, data.length]);

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
        return <HighlightText text={value} searchTerm={searchState.highlightTerm} />;
      }

      if (typeof value === 'number' && searchState.highlightTerm) {
        const strValue = value.toString();
        if (strValue.includes(searchState.highlightTerm)) {
          return <HighlightText text={strValue} searchTerm={searchState.highlightTerm} />;
        }
      }

      return value;
    };
  }, [enableHighlighting, searchState.highlightTerm]);

  // Memoized row data to prevent unnecessary re-renders
  const rowData = useMemo<RowData<T>>(() => ({
    items: data,
    columns: visibleColumns.map(col => ({
      ...col,
      formatter: createHighlightFormatter(col, col.formatter)
    })),
    onRowClick,
    highlightTerm: searchState.highlightTerm,
    enableHighlighting,
  }), [data, visibleColumns, onRowClick, searchState.highlightTerm, enableHighlighting, createHighlightFormatter]);

  // Row renderer component with highlighting support
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const { items, columns, onRowClick, highlightTerm } = rowData;
    const item = items[index];

    const handleClick = () => {
      if (onRowClick) {
        onRowClick(item, index);
      }
    };

    // Check if this row matches the current search
    const isMatch = highlightTerm && columns.some(column => {
      if (column.searchable === false) return false;
      const value = item[column.key];
      if (!value) return false;
      return value.toString().toLowerCase().includes(highlightTerm.toLowerCase());
    });

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: isMatch
            ? (index % 2 === 0 ? '#fff3cd' : '#ffeaa7')
            : (index % 2 === 0 ? 'white' : '#fafafa'),
          cursor: onRowClick ? 'pointer' : 'default',
          transition: 'background-color 0.2s ease',
        }}
        onClick={handleClick}
      >
        {/* Search match indicator */}
        {showSearchIndicator && isMatch && (
          <div
            style={{
              position: 'absolute',
              left: '2px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '3px',
              height: '60%',
              backgroundColor: '#ff9800',
              borderRadius: '2px',
            }}
          />
        )}

        {columns.map((column: SearchableTableColumn<T>, colIndex: number) => {
          const value = item[column.key];
          const displayValue = column.formatter ? column.formatter(value, item) : value;

          return (
            <div
              key={`${column.key as string}-${colIndex}`}
              style={{
                width: column.width,
                padding: '8px 12px',
                textAlign: column.align || 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                fontSize: '14px',
                color: '#333',
                paddingLeft: showSearchIndicator && colIndex === 0 ? '20px' : '12px',
              }}
              title={typeof value === 'string' ? value : String(value)}
            >
              {displayValue as React.ReactNode}
            </div>
          );
        })}
      </div>
    );
  }, [rowData, showSearchIndicator]);

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
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fafafa',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #2196f3',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#666', fontSize: '14px' }}>Loading data...</p>
        </div>
      </div>
    );
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
      <List
        ref={listRef}
        height={height - 50 - (searchResultsSummary ? 32 : 0)}
        width={totalWidth}
        itemCount={data.length}
        itemSize={rowHeight}
        overscanCount={overscanCount}
      >
        {Row}
      </List>

      {/* Footer with row count and search stats */}
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
        </span>

        {enableHighlighting && searchState.highlightTerm && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#ffeb3b',
              borderRadius: '2px',
            }} />
            Highlighted matches
          </span>
        )}
      </div>

    </div>
  );
};

export default SearchableVirtualTable;