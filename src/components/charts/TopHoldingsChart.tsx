import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, TrendingDown, ArrowUpDown, Star, Search } from 'lucide-react';
import { TopHolding, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';
import { useSearchContext } from '../../contexts/SearchContext';

interface TopHoldingsChartProps {
  data: TopHolding[];
  height?: number;
  maxItems?: number;
  sortBy?: 'marketValue' | 'percentage' | 'gainLoss' | 'symbol';
  sortDirection?: 'asc' | 'desc';
  showGainLoss?: boolean;
  onHoldingClick?: (holding: TopHolding) => void;
  className?: string;
}

const TopHoldingsChart: React.FC<TopHoldingsChartProps> = ({
  data,
  height = 400,
  maxItems = 10,
  sortBy = 'marketValue',
  sortDirection = 'desc',
  showGainLoss = false,
  onHoldingClick,
  className = ''
}) => {
  const [activeSortBy, setActiveSortBy] = useState(sortBy);
  const [activeSortDirection, setActiveSortDirection] = useState(sortDirection);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);
  const { performGlobalSearch } = useSearchContext();

  // Sort and limit data
  const processedData = useMemo(() => {
    let sortedData = [...data];

    // Sort data
    sortedData.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (activeSortBy) {
        case 'marketValue':
          aValue = a.marketValue;
          bValue = b.marketValue;
          break;
        case 'percentage':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'gainLoss':
          aValue = a.gainLoss || 0;
          bValue = b.gainLoss || 0;
          break;
        case 'symbol':
          return activeSortDirection === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        default:
          aValue = a.marketValue;
          bValue = b.marketValue;
      }

      return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    return sortedData.slice(0, maxItems).map((holding, index) => ({
      ...holding,
      displayName: holding.symbol || `Position ${index + 1}`,
      shortDescription: holding.description.length > 30
        ? holding.description.substring(0, 30) + '...'
        : holding.description,
      barColor: showGainLoss
        ? (holding.gainLoss || 0) >= 0 ? '#4CAF50' : '#F44336'
        : `hsl(${210 - (index * 15)}, 70%, 50%)`,
      rank: index + 1
    }));
  }, [data, activeSortBy, activeSortDirection, maxItems, showGainLoss]);

  const maxValue = Math.max(...processedData.map(item => item.marketValue));

  // Handle sorting
  const handleSort = (newSortBy: typeof activeSortBy) => {
    if (newSortBy === activeSortBy) {
      setActiveSortDirection(activeSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setActiveSortBy(newSortBy);
      setActiveSortDirection('desc');
    }
  };

  // Handle bar click
  const handleBarClick = (data: any, index: number) => {
    const holding = processedData[index];
    if (onHoldingClick) {
      onHoldingClick(holding);
    } else {
      // Default behavior: search for the symbol
      performGlobalSearch(holding.symbol, 'filter');
    }
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          minWidth: '250px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Star size={16} color={data.barColor} />
            {data.symbol}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            {data.description}
          </div>
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Market Value:</span>
              <strong>{formatCurrency(data.marketValue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Portfolio %:</span>
              <strong>{formatPercentage(data.percentage)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Shares:</span>
              <span>{data.shares.toLocaleString()}</span>
            </div>
            {showGainLoss && (data.gainLoss !== undefined && data.gainLoss !== 0) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Gain/Loss:</span>
                <span style={{ color: data.gainLoss >= 0 ? '#4CAF50' : '#F44336', fontWeight: 'bold' }}>
                  {data.gainLoss >= 0 ? '+' : ''}{formatCurrency(data.gainLoss)}
                  {data.gainLossPercentage !== undefined && (
                    <span style={{ fontSize: '11px', marginLeft: '4px' }}>
                      ({data.gainLossPercentage >= 0 ? '+' : ''}{formatPercentage(data.gainLossPercentage)})
                    </span>
                  )}
                </span>
              </div>
            )}
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              Account: {data.accountNumber}
            </div>
          </div>
        </div>
      );
    }
    return null;
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
          <div>No holdings data available</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Import positions data to see top holdings
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
            Top Holdings
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Largest positions by market value
          </p>
        </div>

        {/* Sort Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#666' }}>Sort by:</span>
          {[
            { key: 'marketValue', label: 'Value', icon: <TrendingUp size={12} /> },
            { key: 'percentage', label: '%', icon: <Star size={12} /> },
            { key: 'symbol', label: 'Symbol', icon: <ArrowUpDown size={12} /> }
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => handleSort(key as typeof activeSortBy)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 10px',
                fontSize: '11px',
                border: '1px solid #e0e0e0',
                borderRadius: '4px',
                backgroundColor: activeSortBy === key ? '#e3f2fd' : 'white',
                color: activeSortBy === key ? '#1976d2' : '#666',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeSortBy !== key) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSortBy !== key) {
                  e.currentTarget.style.backgroundColor = 'white';
                }
              }}
            >
              {icon}
              {label}
              {activeSortBy === key && (
                activeSortDirection === 'asc' ? '↑' : '↓'
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={processedData}
          layout="horizontal"
          margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            type="number"
            domain={[0, maxValue * 1.1]}
            tickFormatter={(value) => formatCurrency(value).replace('$', '$')}
            fontSize={12}
            stroke="#666"
          />
          <YAxis
            type="category"
            dataKey="displayName"
            width={75}
            fontSize={11}
            stroke="#666"
            tick={{ textAnchor: 'end' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="marketValue"
            radius={[0, 4, 4, 0]}
            onClick={handleBarClick}
            onMouseEnter={(_, index) => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            {processedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.barColor}
                stroke={hoveredBar === index ? '#333' : 'none'}
                strokeWidth={hoveredBar === index ? 2 : 0}
                style={{
                  cursor: 'pointer',
                  filter: hoveredBar === index ? 'brightness(1.1)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Holdings Table */}
      <div style={{
        marginTop: '16px',
        border: '1px solid #e0e0e0',
        borderRadius: '8px',
        overflow: 'hidden',
        backgroundColor: 'white'
      }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 1fr 100px 80px 80px',
          padding: '12px 16px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e0e0e0',
          fontSize: '12px',
          fontWeight: '600',
          color: '#666'
        }}>
          <div>#</div>
          <div>Symbol & Description</div>
          <div style={{ textAlign: 'right' }}>Value</div>
          <div style={{ textAlign: 'right' }}>%</div>
          <div style={{ textAlign: 'right' }}>Shares</div>
        </div>

        {/* Table Rows */}
        {processedData.map((holding, index) => (
          <div
            key={holding.symbol}
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 100px 80px 80px',
              padding: '12px 16px',
              borderBottom: index < processedData.length - 1 ? '1px solid #f0f0f0' : 'none',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: hoveredBar === index ? '#f8f9fa' : 'white',
              transition: 'background-color 0.2s ease'
            }}
            onClick={() => {
              if (onHoldingClick) {
                onHoldingClick(holding);
              } else {
                performGlobalSearch(holding.symbol, 'filter');
              }
            }}
            onMouseEnter={() => setHoveredBar(index)}
            onMouseLeave={() => setHoveredBar(null)}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#999'
            }}>
              {holding.rank}
            </div>
            <div>
              <div style={{ fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                {holding.symbol}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                {holding.shortDescription}
              </div>
            </div>
            <div style={{ textAlign: 'right', fontWeight: '600', color: '#333' }}>
              {formatCurrency(holding.marketValue)}
            </div>
            <div style={{ textAlign: 'right', color: '#666' }}>
              {formatPercentage(holding.percentage)}
            </div>
            <div style={{ textAlign: 'right', color: '#666' }}>
              {holding.shares.toLocaleString()}
            </div>
          </div>
        ))}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Total Value (Top {processedData.length})
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(processedData.reduce((sum, holding) => sum + holding.marketValue, 0))}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Portfolio Allocation
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {formatPercentage(processedData.reduce((sum, holding) => sum + holding.percentage, 0))}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Largest Position
            </div>
            <div style={{ fontWeight: 'bold', color: processedData[0]?.percentage > 20 ? '#FF9800' : '#4CAF50' }}>
              {processedData[0] ? formatPercentage(processedData[0].percentage) : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Concentration Risk
            </div>
            <div style={{
              fontWeight: 'bold',
              color: processedData.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0) > 60 ? '#F44336' : '#4CAF50'
            }}>
              {processedData.slice(0, 5).reduce((sum, h) => sum + h.percentage, 0) > 60 ? 'High' : 'Moderate'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TopHoldingsChart);