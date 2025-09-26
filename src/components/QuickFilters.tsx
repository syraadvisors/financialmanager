import React, { useMemo, useCallback } from 'react';
import { Filter, DollarSign, TrendingUp, Building, Target, Star, Clock, AlertTriangle } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';
import { useAppContext } from '../contexts/AppContext';

interface QuickFilterOption {
  id: string;
  label: string;
  description: string;
  searchQuery: string;
  icon: React.ReactNode;
  color: string;
  category: 'value' | 'type' | 'account' | 'performance' | 'alert';
  badge?: string;
  condition?: (data: any[]) => boolean;
}

interface QuickFiltersProps {
  isVisible?: boolean;
  variant?: 'horizontal' | 'grid' | 'compact';
  maxItems?: number;
  showCategories?: boolean;
  className?: string;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({
  isVisible = true,
  variant = 'horizontal',
  maxItems = 8,
  showCategories = false,
  className = ''
}) => {
  const { performGlobalSearch } = useSearchContext();
  const { state: appState } = useAppContext();

  // Generate quick filters based on available data
  const quickFilters = useMemo((): QuickFilterOption[] => {
    const filters: QuickFilterOption[] = [];

    // High-value account filters
    const hasHighValueAccounts = appState.balanceData.some(account =>
      account.portfolioValue > 100000
    );

    if (hasHighValueAccounts) {
      filters.push({
        id: 'high-value-accounts',
        label: 'High Value',
        description: 'Accounts over $100K',
        searchQuery: 'portfolioValue:>100000',
        icon: <DollarSign size={16} />,
        color: '#4caf50',
        category: 'value',
        badge: appState.balanceData.filter(a => a.portfolioValue > 100000).length.toString()
      });
    }

    // IRA accounts
    const iraCount = appState.balanceData.filter(account =>
      account.accountName?.toLowerCase().includes('ira') ||
      account.accountNumber?.toLowerCase().includes('ira')
    ).length;

    if (iraCount > 0) {
      filters.push({
        id: 'ira-accounts',
        label: 'IRA Accounts',
        description: 'Individual Retirement Accounts',
        searchQuery: 'IRA',
        icon: <Building size={16} />,
        color: '#2196f3',
        category: 'account',
        badge: iraCount.toString()
      });
    }

    // Stock positions
    const stockCount = appState.positionsData.filter(position =>
      position.securityType?.toLowerCase().includes('stock') ||
      position.securityType?.toLowerCase().includes('equity')
    ).length;

    if (stockCount > 0) {
      filters.push({
        id: 'stock-positions',
        label: 'Stocks',
        description: 'Stock positions',
        searchQuery: 'securityType:Stock',
        icon: <TrendingUp size={16} />,
        color: '#ff9800',
        category: 'type',
        badge: stockCount.toString()
      });
    }

    // Bond positions
    const bondCount = appState.positionsData.filter(position =>
      position.securityType?.toLowerCase().includes('bond')
    ).length;

    if (bondCount > 0) {
      filters.push({
        id: 'bond-positions',
        label: 'Bonds',
        description: 'Bond positions',
        searchQuery: 'securityType:Bond',
        icon: <Target size={16} />,
        color: '#9c27b0',
        category: 'type',
        badge: bondCount.toString()
      });
    }

    // Cash positions
    const cashCount = appState.balanceData.filter(account =>
      account.totalCash > 1000
    ).length;

    if (cashCount > 0) {
      filters.push({
        id: 'cash-positions',
        label: 'Cash Heavy',
        description: 'Accounts with significant cash',
        searchQuery: 'totalCash:>1000',
        icon: <DollarSign size={16} />,
        color: '#607d8b',
        category: 'value',
        badge: cashCount.toString()
      });
    }

    // Large positions
    const largePositionCount = appState.positionsData.filter(position =>
      position.marketValue > 10000
    ).length;

    if (largePositionCount > 0) {
      filters.push({
        id: 'large-positions',
        label: 'Large Positions',
        description: 'Positions over $10K',
        searchQuery: 'marketValue:>10000',
        icon: <Star size={16} />,
        color: '#e91e63',
        category: 'value',
        badge: largePositionCount.toString()
      });
    }

    // Recent activity (if timestamps available)
    filters.push({
      id: 'recent-activity',
      label: 'Recent',
      description: 'Recently updated accounts',
      searchQuery: 'recent',
      icon: <Clock size={16} />,
      color: '#00bcd4',
      category: 'performance'
    });

    // Popular symbols (most common)
    const symbolCounts = new Map<string, number>();
    appState.positionsData.forEach(position => {
      if (position.symbol) {
        symbolCounts.set(position.symbol, (symbolCounts.get(position.symbol) || 0) + 1);
      }
    });

    const topSymbol = Array.from(symbolCounts.entries())
      .sort(([,a], [,b]) => b - a)[0];

    if (topSymbol && topSymbol[1] > 1) {
      filters.push({
        id: 'top-symbol',
        label: topSymbol[0],
        description: `Most held symbol (${topSymbol[1]} positions)`,
        searchQuery: topSymbol[0],
        icon: <TrendingUp size={16} />,
        color: '#ff5722',
        category: 'type',
        badge: topSymbol[1].toString()
      });
    }

    // Warning filters (hypothetical - would need real logic)
    if (appState.positionsData.some(p => p.marketValue < 100)) {
      filters.push({
        id: 'small-positions',
        label: 'Small Positions',
        description: 'Positions under $100',
        searchQuery: 'marketValue:<100',
        icon: <AlertTriangle size={16} />,
        color: '#f44336',
        category: 'alert'
      });
    }

    return filters.slice(0, maxItems);
  }, [appState.balanceData, appState.positionsData, maxItems]);

  // Handle filter click
  const handleFilterClick = useCallback((filter: QuickFilterOption) => {
    performGlobalSearch(filter.searchQuery);
  }, [performGlobalSearch]);

  // Group filters by category
  const categorizedFilters = useMemo(() => {
    if (!showCategories) return { all: quickFilters };

    const categories: { [key: string]: QuickFilterOption[] } = {};
    quickFilters.forEach(filter => {
      if (!categories[filter.category]) {
        categories[filter.category] = [];
      }
      categories[filter.category].push(filter);
    });

    return categories;
  }, [quickFilters, showCategories]);

  // Category display names
  const getCategoryName = useCallback((category: string): string => {
    const names = {
      value: 'Value',
      type: 'Asset Types',
      account: 'Accounts',
      performance: 'Performance',
      alert: 'Alerts'
    };
    return names[category as keyof typeof names] || category;
  }, []);

  if (!isVisible || quickFilters.length === 0) {
    return null;
  }

  const renderFilter = (filter: QuickFilterOption) => (
    <button
      key={filter.id}
      onClick={() => handleFilterClick(filter)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 12px',
        backgroundColor: 'white',
        border: `2px solid ${filter.color}15`,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '13px',
        fontWeight: '500',
        color: '#333',
        minWidth: variant === 'compact' ? 'auto' : '120px',
        justifyContent: variant === 'compact' ? 'center' : 'flex-start'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${filter.color}10`;
        e.currentTarget.style.borderColor = `${filter.color}40`;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'white';
        e.currentTarget.style.borderColor = `${filter.color}15`;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      title={filter.description}
    >
      <div style={{ color: filter.color, display: 'flex', alignItems: 'center' }}>
        {filter.icon}
      </div>

      {variant !== 'compact' && (
        <span>{filter.label}</span>
      )}

      {filter.badge && (
        <div style={{
          padding: '2px 6px',
          backgroundColor: filter.color,
          color: 'white',
          borderRadius: '10px',
          fontSize: '10px',
          fontWeight: '600',
          minWidth: '16px',
          textAlign: 'center'
        }}>
          {filter.badge}
        </div>
      )}
    </button>
  );

  const containerStyle: React.CSSProperties = {
    display: variant === 'grid' ? 'grid' : 'flex',
    gridTemplateColumns: variant === 'grid' ? 'repeat(auto-fit, minmax(140px, 1fr))' : undefined,
    flexWrap: variant === 'horizontal' ? 'wrap' : undefined,
    gap: '8px',
    alignItems: 'flex-start'
  };

  return (
    <div className={`quick-filters ${className}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {showCategories ? (
        Object.entries(categorizedFilters).map(([category, filters]) => (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: '#666',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {getCategoryName(category)}
            </div>
            <div style={containerStyle}>
              {filters.map(renderFilter)}
            </div>
          </div>
        ))
      ) : (
        <div style={containerStyle}>
          {quickFilters.map(renderFilter)}
        </div>
      )}
    </div>
  );
};

export default QuickFilters;