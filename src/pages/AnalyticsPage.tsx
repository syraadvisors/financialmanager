import React, { useMemo } from 'react';
import { BarChart3, PieChart, TrendingUp, TrendingDown, DollarSign, Users, Target, Activity } from 'lucide-react';
import { AppState } from '../types/NavigationTypes';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';

interface AnalyticsPageProps {
  appState: AppState;
}

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ appState }) => {
  const { balanceData, positionsData } = appState;

  // Calculate analytics
  const analytics = useMemo(() => {
    // Account Analytics
    const totalAccounts = new Set([
      ...balanceData.map(b => b.accountNumber),
      ...positionsData.map(p => p.accountNumber)
    ]).size;

    const totalPortfolioValue = balanceData.reduce((sum, account) =>
      sum + (parseFloat(account.portfolioValue?.toString() || '0') || 0), 0
    );

    const totalCash = balanceData.reduce((sum, account) =>
      sum + (parseFloat(account.totalCash?.toString() || '0') || 0), 0
    );

    const totalPositionsValue = positionsData.reduce((sum, position) =>
      sum + (parseFloat(position.marketValue?.toString() || '0') || 0), 0
    );

    // Top Accounts by Portfolio Value
    const topAccounts = [...balanceData]
      .sort((a, b) => (parseFloat(b.portfolioValue?.toString() || '0') || 0) - (parseFloat(a.portfolioValue?.toString() || '0') || 0))
      .slice(0, 10)
      .map(account => ({
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        value: parseFloat(account.portfolioValue?.toString() || '0') || 0,
        cash: parseFloat(account.totalCash?.toString() || '0') || 0,
      }));

    // Security Type Distribution
    const securityTypeDistribution = positionsData.reduce((acc, position) => {
      const type = position.securityType || 'Unknown';
      const value = parseFloat(position.marketValue?.toString() || '0') || 0;
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0 };
      }
      acc[type].count += 1;
      acc[type].value += value;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    // Top Holdings by Market Value
    const topHoldings = [...positionsData]
      .sort((a, b) => (parseFloat(b.marketValue?.toString() || '0') || 0) - (parseFloat(a.marketValue?.toString() || '0') || 0))
      .slice(0, 10)
      .map(position => ({
        symbol: position.symbol,
        description: position.securityDescription,
        type: position.securityType,
        value: parseFloat(position.marketValue?.toString() || '0') || 0,
        shares: parseFloat(position.numberOfShares?.toString() || '0') || 0,
        price: parseFloat(position.price?.toString() || '0') || 0,
      }));

    // Portfolio Allocation (Cash vs Investments)
    const cashPercentage = totalPortfolioValue > 0 ? (totalCash / totalPortfolioValue) * 100 : 0;
    const investmentPercentage = 100 - cashPercentage;

    // Account Size Distribution
    const accountSizeRanges = {
      'Under $100K': balanceData.filter(a => (parseFloat(a.portfolioValue?.toString() || '0') || 0) < 100000).length,
      '$100K - $500K': balanceData.filter(a => {
        const value = parseFloat(a.portfolioValue?.toString() || '0') || 0;
        return value >= 100000 && value < 500000;
      }).length,
      '$500K - $1M': balanceData.filter(a => {
        const value = parseFloat(a.portfolioValue?.toString() || '0') || 0;
        return value >= 500000 && value < 1000000;
      }).length,
      '$1M+': balanceData.filter(a => (parseFloat(a.portfolioValue?.toString() || '0') || 0) >= 1000000).length,
    };

    return {
      totalAccounts,
      totalPortfolioValue,
      totalCash,
      totalPositionsValue,
      topAccounts,
      securityTypeDistribution,
      topHoldings,
      cashPercentage,
      investmentPercentage,
      accountSizeRanges,
    };
  }, [balanceData, positionsData]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatPercent = (percent: number) => `${percent.toFixed(1)}%`;

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
  }> = ({ title, value, icon, color, subtitle }) => (
    <div style={{
      background: 'white',
      padding: '24px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '8px',
        backgroundColor: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '4px',
        }}>
          {value}
        </div>
        <div style={{
          fontSize: '14px',
          color: '#666',
          marginBottom: subtitle ? '4px' : 0,
        }}>
          {title}
        </div>
        {subtitle && (
          <div style={{
            fontSize: '12px',
            color: '#999',
          }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );

  const ProgressBar: React.FC<{ percentage: number; color: string; label: string; value: string }> = ({
    percentage, color, label, value
  }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
        fontSize: '14px',
      }}>
        <span style={{ color: '#333', fontWeight: '500' }}>{label}</span>
        <span style={{ color: '#666' }}>{value}</span>
      </div>
      <div style={{
        width: '100%',
        height: '8px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px',
        overflow: 'hidden',
      }}>
        <div
          style={{
            width: `${Math.min(percentage, 100)}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );

  const hasData = balanceData.length > 0 || positionsData.length > 0;

  if (!hasData) {
    return (
      <div style={{
        padding: '32px',
        backgroundColor: '#fafafa',
        minHeight: '100vh',
      }}>
        <div style={{
          textAlign: 'center',
          padding: '64px 32px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}>
          <BarChart3 size={64} style={{ color: '#ccc', marginBottom: '16px' }} />
          <h2 style={{ color: '#666', marginBottom: '8px' }}>No Data Available for Analytics</h2>
          <p style={{ color: '#999' }}>
            Import balance and positions data to view comprehensive portfolio analytics and insights.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 8px 0',
        }}>
          Portfolio Analytics
        </h1>
        <p style={{
          color: '#666',
          fontSize: '16px',
          margin: 0,
        }}>
          Comprehensive insights into your portfolio performance and composition
        </p>
      </div>

      {/* Key Metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
        marginBottom: '32px',
      }}>
        <StatCard
          title="Total Portfolio Value"
          value={formatCurrency(analytics.totalPortfolioValue)}
          icon={<DollarSign size={24} />}
          color="#2196f3"
        />
        <StatCard
          title="Total Cash"
          value={formatCurrency(analytics.totalCash)}
          icon={<TrendingUp size={24} />}
          color="#4caf50"
          subtitle={`${formatPercent(analytics.cashPercentage)} of portfolio`}
        />
        <StatCard
          title="Active Accounts"
          value={analytics.totalAccounts.toLocaleString()}
          icon={<Users size={24} />}
          color="#ff9800"
        />
        <StatCard
          title="Position Count"
          value={positionsData.length.toLocaleString()}
          icon={<Activity size={24} />}
          color="#9c27b0"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Portfolio Allocation */}
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <PieChart size={20} />
              Portfolio Allocation
            </h3>
            <ProgressBar
              percentage={analytics.investmentPercentage}
              color="#2196f3"
              label="Investments"
              value={`${formatPercent(analytics.investmentPercentage)} (${formatCurrency(analytics.totalPortfolioValue - analytics.totalCash)})`}
            />
            <ProgressBar
              percentage={analytics.cashPercentage}
              color="#4caf50"
              label="Cash"
              value={`${formatPercent(analytics.cashPercentage)} (${formatCurrency(analytics.totalCash)})`}
            />
          </div>
        </ErrorBoundary>

        {/* Account Size Distribution */}
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Target size={20} />
              Account Size Distribution
            </h3>
            {Object.entries(analytics.accountSizeRanges).map(([range, count], index) => {
              const percentage = analytics.totalAccounts > 0 ? (count / analytics.totalAccounts) * 100 : 0;
              const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0'];
              return (
                <ProgressBar
                  key={range}
                  percentage={percentage}
                  color={colors[index]}
                  label={range}
                  value={`${count} accounts (${formatPercent(percentage)})`}
                />
              );
            })}
          </div>
        </ErrorBoundary>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px',
        marginBottom: '32px',
      }}>
        {/* Top Accounts */}
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <TrendingUp size={20} />
              Top Accounts by Value
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {analytics.topAccounts.map((account, index) => (
                <div
                  key={account.accountNumber}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < analytics.topAccounts.length - 1 ? '1px solid #f0f0f0' : 'none',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      {account.accountNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {account.accountName}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                      {formatCurrency(account.value)}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Cash: {formatCurrency(account.cash)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ErrorBoundary>

        {/* Security Type Distribution */}
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <BarChart3 size={20} />
              Security Types
            </h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {Object.entries(analytics.securityTypeDistribution)
                .sort(([, a], [, b]) => (b as any).value - (a as any).value)
                .map(([type, data], index) => {
                  const typedData = data as { count: number; value: number };
                  const percentage = analytics.totalPositionsValue > 0 ? (typedData.value / analytics.totalPositionsValue) * 100 : 0;
                  const colors = ['#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#f44336', '#607d8b'];
                  return (
                    <div key={type} style={{ marginBottom: '16px' }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px',
                      }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#333' }}>
                          {type}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {typedData.count} positions
                        </span>
                      </div>
                      <ProgressBar
                        percentage={percentage}
                        color={colors[index % colors.length]}
                        label=""
                        value={`${formatCurrency(typedData.value)} (${formatPercent(percentage)})`}
                      />
                    </div>
                  );
                })}
            </div>
          </div>
        </ErrorBoundary>
      </div>

      {/* Top Holdings */}
      {analytics.topHoldings.length > 0 && (
        <ErrorBoundary fallback={<DataProcessingErrorFallback />}>
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 20px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <TrendingDown size={20} />
              Top Holdings by Market Value
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Symbol
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Type
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Shares
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Price
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                      Market Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topHoldings.map((holding, index) => (
                    <tr
                      key={`${holding.symbol}-${index}`}
                      style={{
                        borderBottom: '1px solid #f0f0f0',
                        backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                      }}
                    >
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#333' }}>
                        {holding.symbol}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666', maxWidth: '200px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {holding.description}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#666' }}>
                        {holding.type}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                        {holding.shares.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                        {formatCurrency(holding.price)}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: '#333', textAlign: 'right' }}>
                        {formatCurrency(holding.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default AnalyticsPage;