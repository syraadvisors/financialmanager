import React from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  Shield,
  Target,
  AlertTriangle,
  Star,
  Activity,
  Wallet
} from 'lucide-react';
import { PortfolioMetrics, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';

interface PortfolioSummaryCardsProps {
  metrics: PortfolioMetrics;
  className?: string;
}

interface CardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    label: string;
  };
  color?: string;
  backgroundColor?: string;
  onClick?: () => void;
}

const SummaryCard: React.FC<CardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = '#333',
  backgroundColor = 'white',
  onClick
}) => {
  return (
    <div
      style={{
        padding: '24px',
        backgroundColor,
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
        }
      }}
    >
      {/* Background Decoration */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '120px',
        height: '120px',
        background: `linear-gradient(135deg, ${color}20, ${color}05)`,
        borderRadius: '50%',
        opacity: 0.3
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <div style={{ color, opacity: 0.8 }}>
              {icon}
            </div>
            <h3 style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              color: '#666',
              letterSpacing: '0.5px'
            }}>
              {title.toUpperCase()}
            </h3>
          </div>

          <div style={{
            fontSize: '28px',
            fontWeight: '700',
            color,
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>

          {subtitle && (
            <div style={{
              fontSize: '13px',
              color: '#666',
              marginBottom: '8px'
            }}>
              {subtitle}
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
              {trend.value >= 0 ? (
                <TrendingUp size={14} color="#4CAF50" />
              ) : (
                <TrendingDown size={14} color="#F44336" />
              )}
              <span style={{
                color: trend.value >= 0 ? '#4CAF50' : '#F44336'
              }}>
                {trend.value >= 0 ? '+' : ''}{formatPercentage(Math.abs(trend.value))} {trend.label}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PortfolioSummaryCards: React.FC<PortfolioSummaryCardsProps> = ({
  metrics,
  className = ''
}) => {
  // Calculate derived metrics
  const cashPercentage = metrics.totalValue > 0 ? (metrics.totalCash / metrics.totalValue) * 100 : 0;
  const investedPercentage = metrics.totalValue > 0 ? (metrics.totalInvested / metrics.totalValue) * 100 : 0;

  // Top holding concentration
  const topHoldingPercentage = metrics.topHoldings[0]?.percentage || 0;
  const top5Percentage = metrics.topHoldings.slice(0, 5).reduce((sum, holding) => sum + holding.percentage, 0);

  // Diversification score
  const diversificationScore = Math.max(0, 100 - topHoldingPercentage * 2);
  const getDiversificationLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: '#4CAF50' };
    if (score >= 60) return { level: 'Good', color: '#8BC34A' };
    if (score >= 40) return { level: 'Fair', color: '#FF9800' };
    return { level: 'Poor', color: '#F44336' };
  };

  const diversification = getDiversificationLevel(diversificationScore);

  // Risk level based on concentration
  const getRiskLevel = () => {
    if (topHoldingPercentage > 25) return { level: 'High', color: '#F44336' };
    if (topHoldingPercentage > 15) return { level: 'Medium', color: '#FF9800' };
    return { level: 'Low', color: '#4CAF50' };
  };

  const riskLevel = getRiskLevel();

  const cards: CardProps[] = [
    {
      title: 'Portfolio Value',
      value: metrics.totalValue,
      subtitle: `${metrics.accountCount} accounts`,
      icon: <DollarSign size={20} />,
      color: '#2196F3',
      trend: {
        value: 8.5, // Mock data - would come from historical analysis
        label: 'this month'
      }
    },
    {
      title: 'Total Cash',
      value: metrics.totalCash,
      subtitle: `${formatPercentage(cashPercentage)} of portfolio`,
      icon: <Wallet size={20} />,
      color: '#4CAF50'
    },
    {
      title: 'Total Invested',
      value: metrics.totalInvested,
      subtitle: `${metrics.positionCount} positions`,
      icon: <TrendingUp size={20} />,
      color: '#9C27B0',
      trend: {
        value: 12.3, // Mock data
        label: 'YTD'
      }
    },
    {
      title: 'Top Holding',
      value: metrics.topHoldings[0]?.symbol || 'N/A',
      subtitle: metrics.topHoldings[0] ? `${formatPercentage(topHoldingPercentage)} of portfolio` : 'No positions',
      icon: <Star size={20} />,
      color: '#FF9800'
    },
    {
      title: 'Asset Classes',
      value: metrics.assetAllocation.length.toString(),
      subtitle: `${metrics.assetAllocation.slice(0, 3).map(asset => asset.name).join(', ')}`,
      icon: <PieChart size={20} />,
      color: '#00BCD4'
    },
    {
      title: 'Concentration Risk',
      value: riskLevel.level,
      subtitle: `Top position: ${formatPercentage(topHoldingPercentage)}`,
      icon: <Shield size={20} />,
      color: riskLevel.color
    },
    {
      title: 'Diversification',
      value: diversification.level,
      subtitle: `Score: ${diversificationScore.toFixed(0)}/100`,
      icon: <Target size={20} />,
      color: diversification.color
    },
    {
      title: 'Top 5 Holdings',
      value: formatPercentage(top5Percentage),
      subtitle: 'Portfolio concentration',
      icon: <Activity size={20} />,
      color: top5Percentage > 60 ? '#F44336' : '#4CAF50'
    }
  ];

  // Risk alerts
  const riskAlerts = [];
  if (topHoldingPercentage > 20) {
    riskAlerts.push(`Single position concentration: ${formatPercentage(topHoldingPercentage)}`);
  }
  if (top5Percentage > 60) {
    riskAlerts.push(`Top 5 positions concentration: ${formatPercentage(top5Percentage)}`);
  }
  if (metrics.assetAllocation.length < 3) {
    riskAlerts.push('Limited asset class diversification');
  }
  if (cashPercentage > 15) {
    riskAlerts.push(`High cash allocation: ${formatPercentage(cashPercentage)}`);
  }

  return (
    <div className={className}>
      {/* Main Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '24px'
      }}>
        {cards.map((card, index) => (
          <SummaryCard key={index} {...card} />
        ))}
      </div>

      {/* Risk Alerts Panel */}
      {riskAlerts.length > 0 && (
        <div style={{
          padding: '20px',
          backgroundColor: '#fff3e0',
          borderRadius: '12px',
          border: '1px solid #ffcc02',
          marginBottom: '24px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <AlertTriangle size={20} color="#ff8f00" />
            <h3 style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: '600',
              color: '#ef6c00'
            }}>
              Risk Alerts
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {riskAlerts.map((alert, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: 'rgba(255, 143, 0, 0.1)',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#ef6c00'
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  backgroundColor: '#ff8f00',
                  borderRadius: '50%',
                  flexShrink: 0
                }} />
                {alert}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
            AVERAGE POSITION SIZE
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>
            {formatCurrency(metrics.positionCount > 0 ? metrics.totalInvested / metrics.positionCount : 0)}
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
            LARGEST POSITION
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>
            {formatCurrency(metrics.topHoldings[0]?.marketValue || 0)}
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
            CASH RATIO
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: '700',
            color: cashPercentage > 10 ? '#FF9800' : '#4CAF50'
          }}>
            {formatPercentage(cashPercentage)}
          </div>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center'
        }}>
          <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
            POSITIONS COUNT
          </div>
          <div style={{ fontSize: '20px', fontWeight: '700', color: '#333' }}>
            {metrics.positionCount}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PortfolioSummaryCards);