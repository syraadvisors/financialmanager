import React, { useMemo, useCallback } from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

export interface VirtualTableColumn<T = any> {
  key: keyof T;
  label: string;
  width: number;
  sortable?: boolean;
  essential?: boolean;
  formatter?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface VirtualTableProps<T = any> {
  data: T[];
  columns: VirtualTableColumn<T>[];
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
}

const VirtualScrollTable = <T extends any>({
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
}: VirtualTableProps<T>): React.JSX.Element => {
  console.log('[VirtualScrollTable] Rendering with data:', {
    dataLength: data?.length,
    isArray: Array.isArray(data),
    firstItem: data?.[0]
  });

  // Filter columns based on showAllColumns
  const visibleColumns = useMemo(() => {
    return showAllColumns ? columns : columns.filter(col => col.essential !== false);
  }, [columns, showAllColumns]);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return visibleColumns.reduce((sum, col) => sum + col.width, 0);
  }, [visibleColumns]);

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
  if (!data || data.length === 0) {
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
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No data available</p>
          <p style={{ fontSize: '14px' }}>Import data to see results here</p>
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
      {/* Header */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          minWidth: totalWidth,
        }}
      >
        {visibleColumns.map((column) => (
          <div
            key={column.key as string}
            style={{
              width: column.width,
              padding: '12px',
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
            }}
            onClick={() => column.sortable && handleSort(column.key as string)}
          >
            {column.label}
            {column.sortable && renderSortIcon(column.key as string)}
          </div>
        ))}
      </div>

      {/* Scrollable Body */}
      <div
        style={{
          height: height - 50,
          overflow: 'auto',
          minWidth: totalWidth,
        }}
      >
        {data.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid #e0e0e0',
              backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
              cursor: onRowClick ? 'pointer' : 'default',
              height: rowHeight,
              minWidth: totalWidth,
            }}
            onClick={() => onRowClick && onRowClick(item, index)}
          >
            {visibleColumns.map((column, colIndex) => {
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
                  }}
                  title={typeof value === 'string' ? value : String(value || '')}
                >
                  {displayValue as React.ReactNode}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer with row count */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e0e0e0',
          fontSize: '12px',
          color: '#666',
          textAlign: 'center',
        }}
      >
        Showing {data.length.toLocaleString()} rows
      </div>
    </div>
  );
};

// Performance utilities
export const createVirtualTableHelpers = <T extends any>() => {
  const sortData = (
    data: T[],
    field: keyof T,
    direction: 'asc' | 'desc'
  ): T[] => {
    return [...data].sort((a, b) => {
      const aValue = a[field];
      const bValue = b[field];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      return direction === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  };

  const filterData = (
    data: T[],
    filters: Partial<Record<keyof T, any>>
  ): T[] => {
    return data.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (!value) return true;
        const itemValue = item[key as keyof T];
        if (typeof itemValue === 'string' && typeof value === 'string') {
          return itemValue.toLowerCase().includes(value.toLowerCase());
        }
        return itemValue === value;
      });
    });
  };

  return { sortData, filterData };
};

// Format helpers for common data types
export const formatters = {
  currency: (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value || 0),

  number: (value: number, decimals: number = 0) =>
    new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value || 0),

  percentage: (value: number, decimals: number = 1) =>
    `${(value || 0).toFixed(decimals)}%`,

  date: (value: string | Date): string => {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  },

  truncate: (value: string, maxLength: number = 30) => {
    if (!value || typeof value !== 'string') return value;
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  },
};

export default VirtualScrollTable;
