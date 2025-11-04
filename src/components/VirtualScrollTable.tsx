import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { SortAsc, SortDesc } from 'lucide-react';
import LoadingSkeleton from './LoadingSkeleton';

export interface VirtualTableColumn<T = any> {
  key: keyof T;
  label: string;
  width?: number; // Made optional for auto-sizing
  minWidth?: number;
  maxWidth?: number;
  sortable?: boolean;
  essential?: boolean;
  formatter?: (value: any, row: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  resizable?: boolean;
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
  enableColumnResize?: boolean;
  autoSizeColumns?: boolean;
}

// Helper function to calculate optimal column width based on content
const calculateOptimalWidth = (
  columnKey: string,
  data: any[],
  headerLabel: string,
  formatter?: (value: any, row: any) => React.ReactNode,
  minWidth: number = 100,
  maxWidth: number = 500
): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 150;

  context.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Measure header
  const headerWidth = context.measureText(headerLabel).width + 40; // padding + sort icon space

  // Sample up to 100 rows for performance
  const sampleSize = Math.min(100, data.length);
  const step = Math.max(1, Math.floor(data.length / sampleSize));

  let maxContentWidth = headerWidth;

  for (let i = 0; i < data.length; i += step) {
    const row = data[i];
    const value = row[columnKey];
    const displayValue = formatter ? formatter(value, row) : value;

    // Extract text from React nodes if needed
    let textValue = '';
    if (typeof displayValue === 'object' && displayValue !== null && 'props' in displayValue) {
      // If it's a React element, try to extract text from children
      textValue = String(displayValue.props?.children || value || '');
    } else {
      textValue = String(displayValue || '');
    }

    const width = context.measureText(textValue).width + 40; // increased padding for better visibility
    maxContentWidth = Math.max(maxContentWidth, width);
  }

  return Math.min(Math.max(maxContentWidth, minWidth), maxWidth);
};

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
  enableColumnResize = true,
  autoSizeColumns = true,
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

  // Auto-size columns based on content
  const autoSizedColumns = useMemo(() => {
    if (!autoSizeColumns || !data || data.length === 0) {
      return visibleColumns.map(col => ({
        ...col,
        width: col.width || 150,
      }));
    }

    return visibleColumns.map(col => ({
      ...col,
      width: col.width || calculateOptimalWidth(
        col.key as string,
        data,
        col.label,
        col.formatter,
        col.minWidth || 100,
        col.maxWidth || 500
      ),
    }));
  }, [visibleColumns, data, autoSizeColumns]);

  // Track manually resized columns
  const manuallyResizedRef = useRef<Set<string>>(new Set());

  // State for column widths (for resizing)
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    const widths: Record<string, number> = {};
    autoSizedColumns.forEach(col => {
      widths[col.key as string] = col.width || 150;
    });
    return widths;
  });

  // Update column widths when auto-sized columns change (but preserve manually resized columns)
  useEffect(() => {
    setColumnWidths(prev => {
      const widths: Record<string, number> = {};
      autoSizedColumns.forEach(col => {
        const key = col.key as string;
        // Keep manually resized width, otherwise use auto-sized width
        widths[key] = manuallyResizedRef.current.has(key) ? prev[key] : (col.width || 150);
      });
      return widths;
    });
  }, [autoSizedColumns]);

  // Resize state
  const [resizing, setResizing] = useState<{ columnKey: string; startX: number; startWidth: number } | null>(null);

  // Calculate total width
  const totalWidth = useMemo(() => {
    return autoSizedColumns.reduce((sum, col) => sum + (columnWidths[col.key as string] || col.width || 150), 0);
  }, [autoSizedColumns, columnWidths]);

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

  // Column resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, columnKey: string) => {
    if (!enableColumnResize) return;
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      columnKey,
      startX: e.clientX,
      startWidth: columnWidths[columnKey],
    });
  }, [columnWidths, enableColumnResize]);

  // Double-click to auto-resize column
  const handleResizeDoubleClick = useCallback((e: React.MouseEvent, column: VirtualTableColumn) => {
    if (!enableColumnResize) return;
    e.preventDefault();
    e.stopPropagation();

    const columnKey = column.key as string;
    const optimalWidth = calculateOptimalWidth(
      columnKey,
      data,
      column.label,
      column.formatter,
      column.minWidth || 100,
      column.maxWidth || 500
    );

    // Mark as manually resized and update width
    manuallyResizedRef.current.add(columnKey);
    setColumnWidths(prev => ({
      ...prev,
      [columnKey]: optimalWidth,
    }));
  }, [data, enableColumnResize]);

  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizing) return;
    const delta = e.clientX - resizing.startX;
    const newWidth = Math.max(50, resizing.startWidth + delta);

    // Mark this column as manually resized
    manuallyResizedRef.current.add(resizing.columnKey);

    setColumnWidths(prev => ({
      ...prev,
      [resizing.columnKey]: newWidth,
    }));
  }, [resizing]);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  // Add/remove mouse event listeners for resize
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizing, handleResizeMove, handleResizeEnd]);

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
          minWidth: totalWidth + 20, // Add buffer to match row width
        }}
      >
        {autoSizedColumns.map((column) => {
          const colWidth = columnWidths[column.key as string] || column.width || 150;
          return (
            <div
              key={column.key as string}
              style={{
                width: colWidth,
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
                position: 'relative',
              }}
              onClick={() => column.sortable && handleSort(column.key as string)}
            >
              {column.label}
              {column.sortable && renderSortIcon(column.key as string)}

              {/* Resize Handle */}
              {enableColumnResize && (column.resizable !== false) && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '4px',
                    cursor: 'col-resize',
                    backgroundColor: resizing?.columnKey === column.key ? '#2196f3' : 'transparent',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleResizeStart(e, column.key as string);
                  }}
                  onDoubleClick={(e) => handleResizeDoubleClick(e, column)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseEnter={(e) => {
                    if (!resizing) {
                      (e.target as HTMLElement).style.backgroundColor = '#e0e0e0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!resizing) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Scrollable Body */}
      <div
        style={{
          height: height - 50,
          overflow: 'auto',
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
              minWidth: totalWidth + 20, // Add buffer to prevent last column cutoff
            }}
            onClick={() => onRowClick && onRowClick(item, index)}
          >
            {autoSizedColumns.map((column, colIndex) => {
              const value = item[column.key];
              const displayValue = column.formatter ? column.formatter(value, item) : value;
              const colWidth = columnWidths[column.key as string] || column.width || 150;

              return (
                <div
                  key={`${column.key as string}-${colIndex}`}
                  style={{
                    width: colWidth,
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

    // If it's already a Date object, use it directly
    if (value instanceof Date) {
      return isNaN(value.getTime()) ? String(value) : value.toLocaleDateString();
    }

    // For date strings in format YYYY-MM-DD, parse as local date to avoid timezone shift
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return date.toLocaleDateString();
    }

    // Fallback for other date formats
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
  },

  truncate: (value: string, maxLength: number = 30) => {
    if (!value || typeof value !== 'string') return value;
    return value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  },
};

export default VirtualScrollTable;
