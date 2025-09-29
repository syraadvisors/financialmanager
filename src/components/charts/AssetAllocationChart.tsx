import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, LabelList } from 'recharts';
import { Filter, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { AssetAllocation, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';
import { useSearchContext } from '../../contexts/SearchContext';

interface AssetAllocationChartProps {
  data: AssetAllocation[];
  height?: number;
  showLegend?: boolean;
  showLabels?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  onSliceClick?: (data: AssetAllocation) => void;
  className?: string;
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({
  data,
  height = 400,
  showLegend = true,
  showLabels = true,
  innerRadius = 0,
  outerRadius = 150,
  onSliceClick,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [hiddenItems, setHiddenItems] = useState<Set<string>>(new Set());
  const { performGlobalSearch } = useSearchContext();

  // Filter out hidden items
  const visibleData = useMemo(() =>
    data.filter(item => !hiddenItems.has(item.name)),
    [data, hiddenItems]
  );

  // Handle mouse enter/leave for hover effects
  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Handle slice click
  const handleSliceClick = (item: AssetAllocation, index: number) => {
    if (onSliceClick) {
      onSliceClick(item);
    } else {
      // Default behavior: filter search by asset type
      const searchTerm = item.name.toLowerCase();
      performGlobalSearch(searchTerm, 'filter');
    }
  };

  // Toggle visibility of legend items
  const toggleItemVisibility = (itemName: string) => {
    const newHiddenItems = new Set(hiddenItems);
    if (hiddenItems.has(itemName)) {
      newHiddenItems.delete(itemName);
    } else {
      newHiddenItems.add(itemName);
    }
    setHiddenItems(newHiddenItems);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload as AssetAllocation;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '12px 16px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: data.color }}>
            {data.name}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Value:</strong> {formatCurrency(data.value)}
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Percentage:</strong> {formatPercentage(data.percentage)}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {data.count} position{data.count !== 1 ? 's' : ''}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  const CustomLegend = ({ payload }: any) => {
    if (!showLegend || !payload) return null;

    return (
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '16px',
        marginTop: '20px',
        fontSize: '14px'
      }}>
        {payload.map((entry: any, index: number) => {
          const isHidden = hiddenItems.has(entry.value);
          return (
            <div
              key={`legend-${index}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: isHidden ? '#f5f5f5' : 'white',
                border: '1px solid #e0e0e0',
                cursor: 'pointer',
                opacity: isHidden ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
              onClick={() => toggleItemVisibility(entry.value)}
              onMouseEnter={(e) => {
                if (!isHidden) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = isHidden ? '#f5f5f5' : 'white';
              }}
            >
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: entry.color,
                  borderRadius: '2px',
                  opacity: isHidden ? 0.4 : 1
                }}
              />
              <span style={{ color: isHidden ? '#999' : '#333' }}>
                {entry.value}
              </span>
              <span style={{ color: '#666', fontSize: '12px' }}>
                {formatPercentage(entry.payload.percentage)}
              </span>
              {isHidden ? <EyeOff size={14} color="#999" /> : <Eye size={14} color="#666" />}
            </div>
          );
        })}
      </div>
    );
  };

  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (!showLabels || percent < 0.05) return null; // Don't show labels for slices < 5%

    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
    const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize="12"
        fontWeight="bold"
        style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.5)' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div
        className={className}
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          color: '#666',
          fontSize: '14px'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <TrendingUp size={48} color="#ccc" style={{ marginBottom: '16px' }} />
          <div>No asset allocation data available</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Import portfolio data to see asset breakdown
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Chart Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '0 8px'
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>
            Asset Allocation
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Portfolio breakdown by asset type
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <Filter size={14} />
          Click slices to filter
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={visibleData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomLabel}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleSliceClick}
              animationBegin={0}
              animationDuration={800}
            >
              {visibleData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={activeIndex === index ? '#333' : 'none'}
                  strokeWidth={activeIndex === index ? 2 : 0}
                  style={{
                    cursor: 'pointer',
                    filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label for donut charts */}
        {innerRadius > 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(visibleData.reduce((sum, item) => sum + item.value, 0))}
            </div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
              Total Value
            </div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div style={{
        marginTop: '16px',
        padding: '16px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Asset Classes
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {visibleData.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Total Positions
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {visibleData.reduce((sum, item) => sum + item.count, 0)}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Largest Allocation
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {visibleData.length > 0 ? formatPercentage(visibleData[0].percentage) : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Diversification
            </div>
            <div style={{ fontWeight: 'bold', color: visibleData.length >= 4 ? '#4CAF50' : visibleData.length >= 2 ? '#FF9800' : '#F44336' }}>
              {visibleData.length >= 4 ? 'Good' : visibleData.length >= 2 ? 'Fair' : 'Low'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AssetAllocationChart);