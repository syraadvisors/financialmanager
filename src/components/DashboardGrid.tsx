import React, { useState, useMemo } from 'react';
import { LayoutGrid, Maximize2, Minimize2, Move, Settings } from 'lucide-react';
import AssetAllocationChart from './charts/AssetAllocationChart';
import AccountDistributionChart from './charts/AccountDistributionChart';
import TopHoldingsChart from './charts/TopHoldingsChart';
import PortfolioTimelineChart from './charts/PortfolioTimelineChart';
import { AccountBalance, AccountPosition } from '../types/DataTypes';
import { usePortfolioAnalytics } from '../utils/portfolioAnalytics';

interface DashboardGridProps {
  balanceData: AccountBalance[];
  positionsData: AccountPosition[];
  className?: string;
}

interface WidgetConfig {
  id: string;
  component: React.ComponentType<any>;
  title: string;
  defaultProps?: any;
  minWidth?: number;
  minHeight?: number;
  defaultWidth?: number;
  defaultHeight?: number;
}

interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized?: boolean;
  isVisible?: boolean;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({
  balanceData,
  positionsData,
  className = ''
}) => {
  const analytics = usePortfolioAnalytics(balanceData, positionsData);
  const metrics = useMemo(() => analytics.calculateMetrics(), [analytics]);
  const timeSeriesData = useMemo(() => analytics.generateTimeSeriesData(365), [analytics]);

  // Widget configurations
  const widgetConfigs: WidgetConfig[] = [
    {
      id: 'portfolio-timeline',
      component: PortfolioTimelineChart,
      title: 'Portfolio Timeline',
      defaultProps: { data: timeSeriesData },
      minWidth: 600,
      minHeight: 400,
      defaultWidth: 800,
      defaultHeight: 400
    },
    {
      id: 'asset-allocation',
      component: AssetAllocationChart,
      title: 'Asset Allocation',
      defaultProps: {
        data: metrics.assetAllocation,
        innerRadius: 60,
        outerRadius: 120
      },
      minWidth: 400,
      minHeight: 350,
      defaultWidth: 450,
      defaultHeight: 400
    },
    {
      id: 'account-distribution',
      component: AccountDistributionChart,
      title: 'Account Distribution',
      defaultProps: { data: metrics.accountDistribution },
      minWidth: 450,
      minHeight: 350,
      defaultWidth: 500,
      defaultHeight: 400
    },
    {
      id: 'top-holdings',
      component: TopHoldingsChart,
      title: 'Top Holdings',
      defaultProps: {
        data: metrics.topHoldings,
        maxItems: 10
      },
      minWidth: 500,
      minHeight: 400,
      defaultWidth: 600,
      defaultHeight: 500
    }
  ];

  // Default layout
  const defaultLayout: WidgetLayout[] = [
    { id: 'portfolio-timeline', x: 0, y: 0, width: 12, height: 6, isVisible: true },
    { id: 'asset-allocation', x: 0, y: 6, width: 6, height: 6, isVisible: true },
    { id: 'account-distribution', x: 6, y: 6, width: 6, height: 6, isVisible: true },
    { id: 'top-holdings', x: 0, y: 12, width: 12, height: 8, isVisible: true }
  ];

  const [layout, setLayout] = useState<WidgetLayout[]>(defaultLayout);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [isLayoutMode, setIsLayoutMode] = useState(false);

  // Grid configuration
  const gridColumns = 12;
  const gridRowHeight = 60;
  const gridGap = 16;

  // Toggle widget visibility
  const toggleWidgetVisibility = (widgetId: string) => {
    setLayout(prev => prev.map(item =>
      item.id === widgetId
        ? { ...item, isVisible: !item.isVisible }
        : item
    ));
  };

  // Maximize/minimize widget
  const toggleWidgetMaximize = (widgetId: string) => {
    setLayout(prev => prev.map(item =>
      item.id === widgetId
        ? {
            ...item,
            isMaximized: !item.isMaximized,
            x: item.isMaximized ? item.x : 0,
            y: item.isMaximized ? item.y : 0,
            width: item.isMaximized ? item.width : gridColumns,
            height: item.isMaximized ? item.height : 10
          }
        : { ...item, isVisible: item.isMaximized ? true : item.isVisible }
    ));
  };

  // Reset to default layout
  const resetLayout = () => {
    setLayout(defaultLayout);
  };

  // Render widget
  const renderWidget = (config: WidgetConfig, layoutItem: WidgetLayout) => {
    if (!layoutItem.isVisible) return null;

    const Component = config.component;
    const widthPx = (layoutItem.width * (100 / gridColumns)) - (gridGap / gridColumns);
    const heightPx = layoutItem.height * gridRowHeight - gridGap;

    return (
      <div
        key={config.id}
        style={{
          gridColumn: `${layoutItem.x + 1} / span ${layoutItem.width}`,
          gridRow: `${layoutItem.y + 1} / span ${layoutItem.height}`,
          minWidth: config.minWidth,
          minHeight: config.minHeight,
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          position: 'relative',
          transition: 'all 0.3s ease',
          zIndex: layoutItem.isMaximized ? 1000 : 1
        }}
        className={draggedWidget === config.id ? 'dragging' : ''}
      >
        {/* Widget Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: '#fafafa',
          cursor: isLayoutMode ? 'move' : 'default'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isLayoutMode && <Move size={14} color="#666" />}
            <h4 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '600',
              color: '#333'
            }}>
              {config.title}
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => toggleWidgetMaximize(config.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                color: '#666',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title={layoutItem.isMaximized ? 'Minimize' : 'Maximize'}
            >
              {layoutItem.isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* Widget Content */}
        <div style={{
          padding: '16px',
          height: `calc(${heightPx}px - 60px)`,
          overflow: 'auto'
        }}>
          <Component
            {...config.defaultProps}
            height={heightPx - 120}
            className="dashboard-widget"
          />
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {/* Dashboard Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '0 8px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#333' }}>
            Portfolio Dashboard
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '16px', color: '#666' }}>
            Comprehensive view of your investment portfolio
          </p>
        </div>

        {/* Dashboard Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Widget Visibility Controls */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
              Widgets:
            </span>
            {widgetConfigs.map(config => {
              const layoutItem = layout.find(item => item.id === config.id);
              return (
                <button
                  key={config.id}
                  onClick={() => toggleWidgetVisibility(config.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: '500',
                    border: '1px solid #d0d0d0',
                    borderRadius: '4px',
                    backgroundColor: layoutItem?.isVisible ? '#2196F3' : 'white',
                    color: layoutItem?.isVisible ? 'white' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  title={`Toggle ${config.title}`}
                >
                  {config.title.split(' ')[0]}
                </button>
              );
            })}
          </div>

          {/* Layout Controls */}
          <button
            onClick={() => setIsLayoutMode(!isLayoutMode)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: isLayoutMode ? '#e3f2fd' : 'white',
              color: isLayoutMode ? '#1976d2' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Toggle Layout Mode"
          >
            <LayoutGrid size={14} />
            Layout
          </button>

          <button
            onClick={resetLayout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Reset Layout"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            <Settings size={14} />
            Reset
          </button>
        </div>
      </div>

      {/* Layout Mode Notice */}
      {isLayoutMode && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          backgroundColor: '#e3f2fd',
          border: '1px solid #2196F3',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Move size={16} />
          Layout Mode Active - Drag widgets to rearrange them
        </div>
      )}

      {/* Portfolio Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            Total Portfolio Value
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#333' }}>
            {analytics.formatCurrency(metrics.totalValue)}
          </div>
          <div style={{ fontSize: '12px', color: '#4CAF50', marginTop: '4px' }}>
            {metrics.accountCount} accounts
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            Total Cash
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#4CAF50' }}>
            {analytics.formatCurrency(metrics.totalCash)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {analytics.formatPercentage((metrics.totalCash / metrics.totalValue) * 100)} of portfolio
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            Total Invested
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#2196F3' }}>
            {analytics.formatCurrency(metrics.totalInvested)}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
            {metrics.positionCount} positions
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ color: '#666', fontSize: '14px', marginBottom: '8px' }}>
            Top Holding
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#333', marginBottom: '4px' }}>
            {metrics.topHoldings[0]?.symbol || 'N/A'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {metrics.topHoldings[0] ? analytics.formatPercentage(metrics.topHoldings[0].percentage) : 'N/A'} of portfolio
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: `${gridGap}px`,
        gridAutoRows: `${gridRowHeight}px`,
        minHeight: '800px',
        position: 'relative'
      }}>
        {widgetConfigs.map(config => {
          const layoutItem = layout.find(item => item.id === config.id);
          return layoutItem ? renderWidget(config, layoutItem) : null;
        })}
      </div>

      {/* Dashboard Footer */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        textAlign: 'center',
        fontSize: '14px',
        color: '#666'
      }}>
        <div style={{ fontWeight: '500', marginBottom: '4px' }}>
          Dashboard Last Updated
        </div>
        <div style={{ fontSize: '12px' }}>
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>

      <style>{`
        .dashboard-widget {
          transition: all 0.3s ease;
        }
        .dragging {
          opacity: 0.8;
          transform: scale(1.02);
          z-index: 1000;
        }
      `}</style>
    </div>
  );
};

export default React.memo(DashboardGrid);