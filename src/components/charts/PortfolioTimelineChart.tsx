import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Eye, EyeOff } from 'lucide-react';
import { TimeSeriesPoint, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';

interface PortfolioTimelineChartProps {
  data: TimeSeriesPoint[];
  benchmarkData?: TimeSeriesPoint[];
  height?: number;
  showBenchmark?: boolean;
  showArea?: boolean;
  onTimeRangeChange?: (range: string) => void;
  className?: string;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'All';

const PortfolioTimelineChart: React.FC<PortfolioTimelineChartProps> = ({
  data,
  benchmarkData = [],
  height = 400,
  showBenchmark = true,
  showArea = false,
  onTimeRangeChange,
  className = ''
}) => {
  const [activeTimeRange, setActiveTimeRange] = useState<TimeRange>('6M');
  const [showPortfolio, setShowPortfolio] = useState(true);
  const [showBenchmarkLine, setShowBenchmarkLine] = useState(showBenchmark);
  const [hoveredPoint, setHoveredPoint] = useState<any>(null);
  const [showAreaChart, setShowArea] = useState(showArea);

  // Time range options
  const timeRanges: { key: TimeRange; label: string; days: number }[] = [
    { key: '1M', label: '1 Month', days: 30 },
    { key: '3M', label: '3 Months', days: 90 },
    { key: '6M', label: '6 Months', days: 180 },
    { key: '1Y', label: '1 Year', days: 365 },
    { key: 'YTD', label: 'Year to Date', days: 0 },
    { key: 'All', label: 'All Time', days: -1 }
  ];

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let startDate: Date;

    switch (activeTimeRange) {
      case '1M':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3M':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6M':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1Y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'All':
      default:
        return data;
    }

    return data.filter(point => new Date(point.date) >= startDate);
  }, [data, activeTimeRange]);

  // Combine portfolio and benchmark data
  const combinedData = useMemo(() => {
    const dataMap = new Map<string, any>();

    filteredData.forEach(point => {
      dataMap.set(point.date, {
        date: point.date,
        portfolioValue: point.value,
        portfolioDailyChange: point.dailyChange,
        portfolioDailyChangePercent: point.dailyChangePercent
      });
    });

    if (showBenchmarkLine && benchmarkData.length > 0) {
      benchmarkData
        .filter(point => filteredData.some(p => p.date === point.date))
        .forEach(point => {
          const existing = dataMap.get(point.date);
          if (existing) {
            existing.benchmarkValue = point.value;
            existing.benchmarkDailyChange = point.dailyChange;
            existing.benchmarkDailyChangePercent = point.dailyChangePercent;
          }
        });
    }

    return Array.from(dataMap.values()).sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [filteredData, benchmarkData, showBenchmarkLine]);

  // Calculate performance metrics for the selected period
  const performanceMetrics = useMemo(() => {
    if (combinedData.length < 2) return null;

    const startValue = combinedData[0].portfolioValue;
    const endValue = combinedData[combinedData.length - 1].portfolioValue;
    const totalReturn = ((endValue - startValue) / startValue) * 100;

    const benchmarkStartValue = combinedData[0].benchmarkValue;
    const benchmarkEndValue = combinedData[combinedData.length - 1].benchmarkValue;
    const benchmarkReturn = benchmarkStartValue && benchmarkEndValue
      ? ((benchmarkEndValue - benchmarkStartValue) / benchmarkStartValue) * 100
      : null;

    const highestValue = Math.max(...combinedData.map(d => d.portfolioValue));
    const lowestValue = Math.min(...combinedData.map(d => d.portfolioValue));
    const volatility = combinedData.slice(1).map(d => d.portfolioDailyChangePercent || 0)
      .reduce((acc, change, i, arr) => {
        const mean = arr.reduce((sum, val) => sum + val, 0) / arr.length;
        return acc + Math.pow(change - mean, 2);
      }, 0) / (combinedData.length - 2);

    return {
      totalReturn,
      benchmarkReturn,
      highestValue,
      lowestValue,
      volatility: Math.sqrt(volatility) * Math.sqrt(252), // Annualized
      outperformance: benchmarkReturn ? totalReturn - benchmarkReturn : null
    };
  }, [combinedData]);

  // Handle time range selection
  const handleTimeRangeChange = (range: TimeRange) => {
    setActiveTimeRange(range);
    onTimeRangeChange?.(range);
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length > 0) {
      const data = payload[0].payload;
      const portfolioData = payload.find((p: any) => p.dataKey === 'portfolioValue');
      const benchmarkData = payload.find((p: any) => p.dataKey === 'benchmarkValue');

      return (
        <div style={{
          backgroundColor: 'white',
          padding: '16px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          fontSize: '14px',
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
            {new Date(label).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </div>

          {portfolioData && showPortfolio && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '3px', backgroundColor: '#2196F3' }}></div>
                <span style={{ fontWeight: '600' }}>Portfolio</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Value:</span>
                <strong>{formatCurrency(portfolioData.value)}</strong>
              </div>
              {data.portfolioDailyChange !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Daily Change:</span>
                  <span style={{
                    color: (data.portfolioDailyChange || 0) >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}>
                    {(data.portfolioDailyChange || 0) >= 0 ? '+' : ''}{formatCurrency(data.portfolioDailyChange || 0)}
                    {data.portfolioDailyChangePercent !== undefined && (
                      <span style={{ marginLeft: '4px' }}>
                        ({(data.portfolioDailyChangePercent || 0) >= 0 ? '+' : ''}{formatPercentage(data.portfolioDailyChangePercent || 0)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {benchmarkData && showBenchmarkLine && (
            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '12px', height: '3px', backgroundColor: '#FF9800' }}></div>
                <span style={{ fontWeight: '600' }}>Benchmark</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Value:</span>
                <strong>{formatCurrency(benchmarkData.value)}</strong>
              </div>
              {data.benchmarkDailyChange !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span>Daily Change:</span>
                  <span style={{
                    color: (data.benchmarkDailyChange || 0) >= 0 ? '#4CAF50' : '#F44336',
                    fontWeight: 'bold'
                  }}>
                    {(data.benchmarkDailyChange || 0) >= 0 ? '+' : ''}{formatCurrency(data.benchmarkDailyChange || 0)}
                    {data.benchmarkDailyChangePercent !== undefined && (
                      <span style={{ marginLeft: '4px' }}>
                        ({(data.benchmarkDailyChangePercent || 0) >= 0 ? '+' : ''}{formatPercentage(data.benchmarkDailyChangePercent || 0)})
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format date for X-axis
  const formatXAxisDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (activeTimeRange === '1M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (activeTimeRange === '3M' || activeTimeRange === '6M') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else {
      return date.toLocaleDateString('en-US', { year: '2-digit', month: 'short' });
    }
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
          <div>No timeline data available</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Import historical data to see portfolio performance
          </div>
        </div>
      </div>
    );
  }

  const ChartComponent = showAreaChart ? AreaChart : LineChart;

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
            Portfolio Timeline
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Performance over time with benchmark comparison
          </p>
        </div>

        {/* View Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Chart Type Toggle */}
          <button
            onClick={() => setShowArea(!showAreaChart)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: showAreaChart ? '#e3f2fd' : 'white',
              color: showAreaChart ? '#1976d2' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <BarChart3 size={14} />
            {showAreaChart ? 'Area' : 'Line'}
          </button>

          {/* Series Toggle */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowPortfolio(!showPortfolio)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 10px',
                fontSize: '11px',
                border: '1px solid #2196F3',
                borderRadius: '4px',
                backgroundColor: showPortfolio ? '#2196F3' : 'white',
                color: showPortfolio ? 'white' : '#2196F3',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {showPortfolio ? <Eye size={12} /> : <EyeOff size={12} />}
              Portfolio
            </button>

            {benchmarkData.length > 0 && (
              <button
                onClick={() => setShowBenchmarkLine(!showBenchmarkLine)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  border: '1px solid #FF9800',
                  borderRadius: '4px',
                  backgroundColor: showBenchmarkLine ? '#FF9800' : 'white',
                  color: showBenchmarkLine ? 'white' : '#FF9800',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {showBenchmarkLine ? <Eye size={12} /> : <EyeOff size={12} />}
                Benchmark
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        marginBottom: '16px',
        padding: '0 8px'
      }}>
        {timeRanges.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleTimeRangeChange(key)}
            style={{
              padding: '8px 16px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #e0e0e0',
              borderRadius: '20px',
              backgroundColor: activeTimeRange === key ? '#2196F3' : 'white',
              color: activeTimeRange === key ? 'white' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '70px'
            }}
            onMouseEnter={(e) => {
              if (activeTimeRange !== key) {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTimeRange !== key) {
                e.currentTarget.style.backgroundColor = 'white';
              }
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* Performance Summary */}
      {performanceMetrics && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '24px',
          marginBottom: '16px',
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          fontSize: '14px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Portfolio Return
            </div>
            <div style={{
              fontWeight: 'bold',
              color: performanceMetrics.totalReturn >= 0 ? '#4CAF50' : '#F44336'
            }}>
              {performanceMetrics.totalReturn >= 0 ? '+' : ''}{formatPercentage(performanceMetrics.totalReturn)}
            </div>
          </div>

          {performanceMetrics.benchmarkReturn !== null && (
            <>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                  Benchmark Return
                </div>
                <div style={{
                  fontWeight: 'bold',
                  color: performanceMetrics.benchmarkReturn >= 0 ? '#4CAF50' : '#F44336'
                }}>
                  {performanceMetrics.benchmarkReturn >= 0 ? '+' : ''}{formatPercentage(performanceMetrics.benchmarkReturn)}
                </div>
              </div>

              {performanceMetrics.outperformance !== null && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
                    Alpha
                  </div>
                  <div style={{
                    fontWeight: 'bold',
                    color: performanceMetrics.outperformance >= 0 ? '#4CAF50' : '#F44336'
                  }}>
                    {performanceMetrics.outperformance >= 0 ? '+' : ''}{formatPercentage(performanceMetrics.outperformance)}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Volatility
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {formatPercentage(performanceMetrics.volatility)}
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent
          data={combinedData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onMouseMove={(e: any) => setHoveredPoint(e?.activePayload?.[0]?.payload)}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisDate}
            fontSize={12}
            stroke="#666"
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(value) => formatCurrency(value).replace('$', '$')}
            fontSize={12}
            stroke="#666"
            domain={['dataMin * 0.95', 'dataMax * 1.05']}
          />
          <Tooltip content={<CustomTooltip />} />

          {showAreaChart ? (
            <>
              {showPortfolio && (
                <Area
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#2196F3"
                  fill="#2196F3"
                  fillOpacity={0.1}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#2196F3' }}
                />
              )}
              {showBenchmarkLine && benchmarkData.length > 0 && (
                <Area
                  type="monotone"
                  dataKey="benchmarkValue"
                  stroke="#FF9800"
                  fill="#FF9800"
                  fillOpacity={0.05}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FF9800' }}
                />
              )}
            </>
          ) : (
            <>
              {showPortfolio && (
                <Line
                  type="monotone"
                  dataKey="portfolioValue"
                  stroke="#2196F3"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#2196F3' }}
                />
              )}
              {showBenchmarkLine && benchmarkData.length > 0 && (
                <Line
                  type="monotone"
                  dataKey="benchmarkValue"
                  stroke="#FF9800"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FF9800' }}
                />
              )}
            </>
          )}
        </ChartComponent>
      </ResponsiveContainer>

      {/* Chart Statistics */}
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
              Period High
            </div>
            <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
              {performanceMetrics ? formatCurrency(performanceMetrics.highestValue) : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Period Low
            </div>
            <div style={{ fontWeight: 'bold', color: '#F44336' }}>
              {performanceMetrics ? formatCurrency(performanceMetrics.lowestValue) : 'N/A'}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Data Points
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {combinedData.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Time Range
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {timeRanges.find(r => r.key === activeTimeRange)?.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PortfolioTimelineChart);