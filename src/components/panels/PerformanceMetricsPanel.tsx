import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Shield,
  Target,
  Activity,
  Calendar,
  Award,
  AlertCircle,
  Info
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { PerformanceMetrics, TimeSeriesPoint, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';

interface PerformanceMetricsPanelProps {
  performanceData: PerformanceMetrics;
  timeSeriesData: TimeSeriesPoint[];
  benchmarkData?: TimeSeriesPoint[];
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  isPercentage?: boolean;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
    period: string;
  };
  benchmark?: number;
  tooltip?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color,
  isPercentage = false,
  trend,
  benchmark,
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    return isPercentage ? formatPercentage(val) : val.toFixed(2);
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    switch (trend.direction) {
      case 'up': return <TrendingUp size={12} color="#4CAF50" />;
      case 'down': return <TrendingDown size={12} color="#F44336" />;
      default: return <Activity size={12} color="#666" />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return '#666';
    switch (trend.direction) {
      case 'up': return '#4CAF50';
      case 'down': return '#F44336';
      default: return '#666';
    }
  };

  return (
    <div style={{
      position: 'relative',
      padding: '20px',
      backgroundColor: 'white',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s ease'
    }}>
      {/* Tooltip */}
      {tooltip && (
        <button
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#999',
            padding: '4px'
          }}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <Info size={14} />
          {showTooltip && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: '0',
              marginTop: '8px',
              padding: '12px',
              backgroundColor: '#333',
              color: 'white',
              borderRadius: '8px',
              fontSize: '12px',
              width: '200px',
              textAlign: 'left',
              zIndex: 1000,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
              {tooltip}
            </div>
          )}
        </button>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <div style={{ color, opacity: 0.8 }}>
          {icon}
        </div>
        <h4 style={{
          margin: 0,
          fontSize: '13px',
          fontWeight: '500',
          color: '#666',
          letterSpacing: '0.5px'
        }}>
          {title.toUpperCase()}
        </h4>
      </div>

      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color,
        marginBottom: '8px',
        lineHeight: '1.2'
      }}>
        {formatValue(value)}
      </div>

      {subtitle && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '8px'
        }}>
          {subtitle}
        </div>
      )}

      {benchmark !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '12px'
        }}>
          <span style={{ color: '#666' }}>Benchmark:</span>
          <span style={{ fontWeight: '500', color: '#333' }}>
            {isPercentage ? formatPercentage(benchmark) : benchmark.toFixed(2)}
          </span>
        </div>
      )}

      {trend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12px',
          fontWeight: '500'
        }}>
          {getTrendIcon()}
          <span style={{ color: getTrendColor() }}>
            {isPercentage ? formatPercentage(Math.abs(trend.value)) : trend.value.toFixed(2)} {trend.period}
          </span>
        </div>
      )}
    </div>
  );
};

const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({
  performanceData,
  timeSeriesData,
  benchmarkData = [],
  className = ''
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('6M');
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    if (timeSeriesData.length < 2) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        bestDay: { date: '', return: 0 },
        worstDay: { date: '', return: 0 },
        consecutiveGains: 0,
        consecutiveLosses: 0,
        averageDailyReturn: 0
      };
    }

    const returns = timeSeriesData.slice(1).map((point, index) => {
      const previousValue = timeSeriesData[index].value;
      const dailyReturn = previousValue > 0 ? ((point.value - previousValue) / previousValue) * 100 : 0;
      return { date: point.date, return: dailyReturn };
    });

    const totalReturn = timeSeriesData.length > 1
      ? ((timeSeriesData[timeSeriesData.length - 1].value - timeSeriesData[0].value) / timeSeriesData[0].value) * 100
      : 0;

    const annualizedReturn = Math.pow(1 + (totalReturn / 100), 365 / Math.max(1, timeSeriesData.length - 1)) - 1;

    const bestDay = returns.reduce((best, current) => current.return > best.return ? current : best, returns[0] || { date: '', return: 0 });
    const worstDay = returns.reduce((worst, current) => current.return < worst.return ? current : worst, returns[0] || { date: '', return: 0 });

    // Calculate consecutive streaks
    let consecutiveGains = 0, consecutiveLosses = 0;
    let currentGainStreak = 0, currentLossStreak = 0;

    returns.forEach(({ return: ret }) => {
      if (ret > 0) {
        currentGainStreak++;
        currentLossStreak = 0;
        consecutiveGains = Math.max(consecutiveGains, currentGainStreak);
      } else if (ret < 0) {
        currentLossStreak++;
        currentGainStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      } else {
        currentGainStreak = 0;
        currentLossStreak = 0;
      }
    });

    const averageDailyReturn = returns.length > 0
      ? returns.reduce((sum, { return: ret }) => sum + ret, 0) / returns.length
      : 0;

    return {
      totalReturn,
      annualizedReturn: annualizedReturn * 100,
      bestDay,
      worstDay,
      consecutiveGains,
      consecutiveLosses,
      averageDailyReturn
    };
  }, [timeSeriesData]);

  // Risk-adjusted metrics
  const riskMetrics = useMemo(() => {
    const riskFreeRate = 2.0; // 2% risk-free rate assumption
    const excessReturn = performanceData.oneYearReturn - riskFreeRate;
    const informationRatio = performanceData.volatility > 0 ? excessReturn / performanceData.volatility : 0;

    // Calmar ratio (annual return / max drawdown)
    const calmarRatio = performanceData.maxDrawdown > 0
      ? performanceData.oneYearReturn / performanceData.maxDrawdown
      : 0;

    return {
      informationRatio,
      calmarRatio,
      riskFreeRate,
      excessReturn
    };
  }, [performanceData]);

  // Performance metrics configuration
  const metricsConfig: MetricCardProps[] = [
    {
      title: 'YTD Return',
      value: performanceData.ytdReturn,
      subtitle: 'Year to date performance',
      icon: <TrendingUp size={18} />,
      color: performanceData.ytdReturn >= 0 ? '#4CAF50' : '#F44336',
      isPercentage: true,
      benchmark: 8.5, // Mock S&P 500 YTD
      tooltip: 'Portfolio performance from January 1st to current date'
    },
    {
      title: '1-Year Return',
      value: performanceData.oneYearReturn,
      subtitle: 'Trailing 12 months',
      icon: <Calendar size={18} />,
      color: performanceData.oneYearReturn >= 0 ? '#4CAF50' : '#F44336',
      isPercentage: true,
      benchmark: 12.1, // Mock S&P 500 1-year
      tooltip: 'Total return over the past 12 months including dividends'
    },
    {
      title: 'Volatility',
      value: performanceData.volatility,
      subtitle: 'Annualized standard deviation',
      icon: <Activity size={18} />,
      color: performanceData.volatility > 20 ? '#F44336' : performanceData.volatility > 15 ? '#FF9800' : '#4CAF50',
      isPercentage: true,
      benchmark: 16.2, // Mock market volatility
      tooltip: 'Measure of price fluctuation - higher values indicate more risk'
    },
    {
      title: 'Sharpe Ratio',
      value: performanceData.sharpeRatio,
      subtitle: 'Risk-adjusted return',
      icon: <Target size={18} />,
      color: performanceData.sharpeRatio > 1 ? '#4CAF50' : performanceData.sharpeRatio > 0.5 ? '#FF9800' : '#F44336',
      benchmark: 0.75, // Mock market Sharpe
      tooltip: 'Return per unit of risk - higher is better (>1.0 is excellent)'
    },
    {
      title: 'Max Drawdown',
      value: performanceData.maxDrawdown,
      subtitle: 'Largest peak-to-trough loss',
      icon: <TrendingDown size={18} />,
      color: performanceData.maxDrawdown > 20 ? '#F44336' : performanceData.maxDrawdown > 10 ? '#FF9800' : '#4CAF50',
      isPercentage: true,
      benchmark: 15.3, // Mock market drawdown
      tooltip: 'Maximum observed loss from peak to trough - lower is better'
    },
    {
      title: 'Win Rate',
      value: performanceData.winRate,
      subtitle: 'Percentage of positive days',
      icon: <Award size={18} />,
      color: performanceData.winRate > 60 ? '#4CAF50' : performanceData.winRate > 50 ? '#FF9800' : '#F44336',
      isPercentage: true,
      benchmark: 54.2, // Mock market win rate
      tooltip: 'Percentage of trading days with positive returns'
    },
    {
      title: 'Information Ratio',
      value: riskMetrics.informationRatio,
      subtitle: 'Excess return per unit risk',
      icon: <BarChart3 size={18} />,
      color: riskMetrics.informationRatio > 0.5 ? '#4CAF50' : riskMetrics.informationRatio > 0 ? '#FF9800' : '#F44336',
      tooltip: 'Excess return over risk-free rate divided by volatility'
    },
    {
      title: 'Calmar Ratio',
      value: riskMetrics.calmarRatio,
      subtitle: 'Return / Max Drawdown',
      icon: <Shield size={18} />,
      color: riskMetrics.calmarRatio > 1 ? '#4CAF50' : riskMetrics.calmarRatio > 0.5 ? '#FF9800' : '#F44336',
      tooltip: 'Annual return divided by maximum drawdown - higher is better'
    }
  ];

  // Performance chart data (mock daily returns)
  const performanceChartData = useMemo(() => {
    return timeSeriesData.slice(Math.max(0, timeSeriesData.length - 90)).map((point, index, array) => {
      const previousValue = index > 0 ? array[index - 1].value : point.value;
      const dailyReturn = previousValue > 0 ? ((point.value - previousValue) / previousValue) * 100 : 0;

      return {
        date: point.date,
        dailyReturn,
        cumulativeReturn: array.slice(0, index + 1).reduce((cum, p, i) => {
          if (i === 0) return 0;
          const prevValue = array[i - 1].value;
          return cum + (prevValue > 0 ? ((p.value - prevValue) / prevValue) * 100 : 0);
        }, 0)
      };
    });
  }, [timeSeriesData]);

  return (
    <div className={className}>
      {/* Panel Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        padding: '0 8px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#333' }}>
            Performance Metrics
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Comprehensive analysis of portfolio risk and return characteristics
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
              backgroundColor: showBenchmark ? '#e3f2fd' : 'white',
              color: showBenchmark ? '#1976d2' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Show Benchmark
          </button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {metricsConfig.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Performance Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Daily Returns Chart */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
            Daily Returns (Last 90 Days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={performanceChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="date"
                fontSize={10}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                stroke="#666"
              />
              <YAxis
                fontSize={10}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
                stroke="#666"
              />
              <Tooltip
                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Daily Return']}
                labelFormatter={(date) => new Date(date).toLocaleDateString('en-US')}
              />
              <Area
                type="monotone"
                dataKey="dailyReturn"
                stroke="#2196F3"
                fill="#2196F3"
                fillOpacity={0.1}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Summary Stats */}
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
            Additional Metrics
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                BEST DAY
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#4CAF50'
              }}>
                {formatPercentage(additionalMetrics.bestDay.return)}
              </div>
              <div style={{ fontSize: '10px', color: '#999' }}>
                {new Date(additionalMetrics.bestDay.date).toLocaleDateString('en-US')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                WORST DAY
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#F44336'
              }}>
                {formatPercentage(additionalMetrics.worstDay.return)}
              </div>
              <div style={{ fontSize: '10px', color: '#999' }}>
                {new Date(additionalMetrics.worstDay.date).toLocaleDateString('en-US')}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                CONSECUTIVE GAINS
              </div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                {additionalMetrics.consecutiveGains} days
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                AVERAGE DAILY RETURN
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: additionalMetrics.averageDailyReturn >= 0 ? '#4CAF50' : '#F44336'
              }}>
                {formatPercentage(additionalMetrics.averageDailyReturn)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Analysis */}
      <div style={{
        padding: '20px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
      }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
          Risk Analysis
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <AlertCircle size={16} color="#FF9800" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Risk Level
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {performanceData.volatility > 20 ? 'High Risk' : performanceData.volatility > 15 ? 'Moderate Risk' : 'Low Risk'}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              Based on {performanceData.volatility.toFixed(1)}% volatility
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Shield size={16} color="#4CAF50" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Risk-Adjusted Performance
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {performanceData.sharpeRatio > 1 ? 'Excellent' : performanceData.sharpeRatio > 0.5 ? 'Good' : 'Poor'}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              Sharpe Ratio: {performanceData.sharpeRatio.toFixed(2)}
            </div>
          </div>

          <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Target size={16} color="#2196F3" />
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
                Consistency
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {performanceData.winRate > 60 ? 'Very Consistent' : performanceData.winRate > 50 ? 'Consistent' : 'Volatile'}
            </div>
            <div style={{ fontSize: '10px', color: '#999', marginTop: '4px' }}>
              Win Rate: {performanceData.winRate.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PerformanceMetricsPanel);