import React, { useState, useEffect, useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Grid, List as ListIcon } from 'lucide-react';
import SearchableVirtualTable, { SearchableTableColumn, SearchableTableProps } from './SearchableVirtualTable';
import MobileSearchCard from './MobileSearchCard';
import { useSearchContext } from '../contexts/SearchContext';

interface ResponsiveDataTableProps<T = any> extends Omit<SearchableTableProps<T>, 'height'> {
  minHeight?: number;
  maxHeight?: number;
  mobileCardConfig?: {
    primaryField: string;
    secondaryField?: string;
    valueField?: string;
  };
  forceMobile?: boolean;
  forceDesktop?: boolean;
}

type ViewMode = 'table' | 'cards';

const ResponsiveDataTable = <T extends Record<string, any>>({
  data,
  columns,
  minHeight = 400,
  maxHeight = 800,
  mobileCardConfig,
  forceMobile = false,
  forceDesktop = false,
  ...tableProps
}: ResponsiveDataTableProps<T>): React.JSX.Element => {
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { state: searchState } = useSearchContext();

  // Responsive detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (forceMobile) {
        setIsMobile(true);
        setViewMode('cards');
      } else if (forceDesktop) {
        setIsMobile(false);
        setViewMode('table');
      } else if (mobile) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [forceMobile, forceDesktop]);

  // Calculate optimal height
  const tableHeight = useMemo(() => {
    const availableHeight = window.innerHeight - 200; // Account for headers/footers
    return Math.min(Math.max(minHeight, availableHeight), maxHeight);
  }, [minHeight, maxHeight]);

  // Mobile card configuration
  const cardConfig = useMemo(() => {
    if (mobileCardConfig) return mobileCardConfig;

    // Auto-detect based on columns
    const essentialColumns = columns.filter(col => col.essential !== false);

    return {
      primaryField: essentialColumns[0]?.key as string || columns[0]?.key as string,
      secondaryField: essentialColumns[1]?.key as string || columns[1]?.key as string,
      valueField: columns.find(col =>
        col.formatter?.toString().includes('currency') ||
        col.formatter?.toString().includes('number') ||
        col.key.toString().toLowerCase().includes('value') ||
        col.key.toString().toLowerCase().includes('amount')
      )?.key as string
    };
  }, [mobileCardConfig, columns]);

  // Calculate container width for mobile cards
  const containerWidth = useMemo(() => {
    return window.innerWidth > 768 ? Math.min(600, window.innerWidth - 40) : window.innerWidth - 32;
  }, []);

  // Button active states to avoid TypeScript narrowing issues
  const isCardsActive = viewMode === 'cards';
  const isTableActive = viewMode === 'table';

  // Mobile card renderer for virtual list
  const MobileCardItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];

    return (
      <div style={style}>
        <MobileSearchCard
          data={item}
          searchTerm={searchState.highlightTerm}
          primaryField={cardConfig.primaryField}
          secondaryField={cardConfig.secondaryField}
          valueField={cardConfig.valueField}
          fields={columns.map(col => ({
            key: col.key as string,
            label: col.label,
            formatter: col.formatter ? (value: any) => col.formatter!(value, item) : undefined,
            searchable: col.searchable
          }))}
          onClick={tableProps.onRowClick ? (data) => {
            const rowIndex = index;
            tableProps.onRowClick?.(data as T, rowIndex);
          } : undefined}
        />
      </div>
    );
  };

  // Styles object for inline styling
  const styles = {
    responsiveDataTableMobile: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      height: '100%',
      background: '#f8f9fa'
    },
    responsiveDataTableDesktop: {
      display: 'flex' as const,
      flexDirection: 'column' as const,
      height: '100%'
    },
    viewToggle: {
      display: 'flex',
      gap: '4px',
      padding: '12px 16px',
      background: 'white',
      borderBottom: '1px solid #e9ecef'
    },
    viewToggleDesktop: {
      display: 'flex',
      gap: '4px',
      padding: '8px 16px',
      background: 'white',
      borderBottom: '1px solid #e9ecef',
      justifyContent: 'flex-end' as const
    },
    viewToggleButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      border: '1px solid #dee2e6',
      borderRadius: '6px',
      background: 'white',
      color: '#6c757d',
      cursor: 'pointer' as const,
      transition: 'all 0.2s ease'
    },
    viewToggleButtonActive: {
      background: '#007bff',
      borderColor: '#007bff',
      color: 'white'
    },
    mobileLoading: {
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      height: '200px',
      color: '#6c757d',
      background: 'white',
      margin: '16px',
      borderRadius: '8px',
      border: '1px solid #e9ecef'
    },
    mobileLoadingSpinner: {
      width: '32px',
      height: '32px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      marginBottom: '16px'
    },
    mobileCardsContainer: {
      flex: 1,
      padding: isMobile ? '8px 16px' : '8px 16px',
      overflow: 'hidden' as const
    },
    mobileCardsList: {
      paddingRight: '8px'
    }
  };

  // View Toggle Component
  const ViewToggle = ({ desktop = false }: { desktop?: boolean }) => (
    <div style={desktop ? styles.viewToggleDesktop : styles.viewToggle}>
      <button
        style={{
          ...styles.viewToggleButton,
          ...(isCardsActive ? styles.viewToggleButtonActive : {})
        }}
        onClick={() => setViewMode('cards')}
        aria-label="Card view"
      >
        <Grid size={16} />
      </button>
      <button
        style={{
          ...styles.viewToggleButton,
          ...(isTableActive ? styles.viewToggleButtonActive : {})
        }}
        onClick={() => setViewMode('table')}
        aria-label="Table view"
      >
        <ListIcon size={16} />
      </button>
    </div>
  );

  if (isCardsActive) {
    return (
      <div style={styles.responsiveDataTableMobile}>
        {/* Mobile View Toggle */}
        {!forceMobile && !isMobile && <ViewToggle />}

        {/* Loading State */}
        {tableProps.loading && (
          <div style={styles.mobileLoading}>
            <div style={styles.mobileLoadingSpinner} />
            <p>Loading data...</p>
          </div>
        )}

        {/* Empty State */}
        {!tableProps.loading && data.length === 0 && (
          <div style={styles.mobileLoading}>
            <Grid size={48} />
            <p>No data available</p>
          </div>
        )}

        {/* Cards List */}
        {!tableProps.loading && data.length > 0 && (
          <div style={styles.mobileCardsContainer}>
            <List
              height={tableHeight - ((!forceMobile && !isMobile) ? 60 : 0)}
              width={containerWidth}
              itemCount={data.length}
              itemSize={isMobile ? 140 : 160}
              overscanCount={5}
              style={styles.mobileCardsList}
            >
              {MobileCardItem}
            </List>
          </div>
        )}

        {/* Add keyframes for spinner animation */}
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Desktop table view
  return (
    <div style={styles.responsiveDataTableDesktop}>
      {/* Desktop View Toggle */}
      {!forceDesktop && <ViewToggle desktop />}

      <SearchableVirtualTable
        {...tableProps}
        data={data}
        columns={columns}
        height={tableHeight - (!forceDesktop ? 48 : 0)}
      />
    </div>
  );
};

// Export with React.memo for performance optimization
export default React.memo(ResponsiveDataTable) as typeof ResponsiveDataTable;