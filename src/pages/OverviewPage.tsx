import React from 'react';
import { TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import ExportButton from '../components/ExportButton';

interface OverviewPageProps {
  onExportData?: (format: 'csv' | 'json' | 'excel') => void;
}

const OverviewPage: React.FC<OverviewPageProps> = ({ onExportData }) => {
  const { state } = useAppContext();
  const { balanceData, positionsData, lastImport } = state;

  // Calculate summary statistics
  const totalPortfolioValue = balanceData.reduce((sum, account) =>
    sum + (parseFloat(account.portfolioValue?.toString() || '0') || 0), 0
  );

  const totalCash = balanceData.reduce((sum, account) =>
    sum + (parseFloat(account.totalCash?.toString() || '0') || 0), 0
  );

  const totalPositionsValue = positionsData.reduce((sum, position) =>
    sum + (parseFloat(position.marketValue?.toString() || '0') || 0), 0
  );

  const uniqueAccounts = new Set([
    ...balanceData.map(b => b.accountNumber),
    ...positionsData.map(p => p.accountNumber)
  ]).size;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: string;
    subtitle?: string;
    trend?: { value: number; isPositive: boolean };
  }> = ({ title, value, icon, color, subtitle, trend }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #e0e0e0',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        backgroundColor: color,
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{
          backgroundColor: color + '20',
          borderRadius: '8px',
          padding: '8px',
          color: color,
        }}>
          {icon}
        </div>
        {trend && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: trend.isPositive ? '#4caf50' : '#f44336',
          }}>
            <TrendingUp size={12} style={{
              transform: trend.isPositive ? 'none' : 'scaleY(-1)'
            }} />
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div style={{
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#333',
        marginBottom: '4px',
        lineHeight: 1,
      }}>
        {value}
      </div>

      <div style={{
        fontSize: '14px',
        color: '#666',
        marginBottom: subtitle ? '8px' : 0,
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
  );

  const hasData = balanceData.length > 0 || positionsData.length > 0;

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#333',
            margin: '0 0 8px 0',
          }}>
            Portfolio Overview
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0,
          }}>
            {hasData
              ? `Last updated: ${lastImport.timestamp ? new Date(lastImport.timestamp).toLocaleString() : 'Never'}`
              : 'Import data to see your portfolio overview'
            }
          </p>
        </div>

        {hasData && (
          <div style={{
            display: 'flex',
            gap: '8px',
          }}>
            <ExportButton
              data={[...balanceData, ...positionsData]}
              dataType="mixed"
              title="Overview Data"
              variant="dropdown"
              size="medium"
            />
          </div>
        )}
      </div>

      {!hasData ? (
        // No Data State
        <div style={{
          textAlign: 'center',
          padding: '80px 20px',
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e0e0e0',
        }}>
          <AlertCircle size={48} style={{ color: '#999', marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '20px',
            color: '#333',
            marginBottom: '8px',
          }}>
            No Data Available
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#666',
            marginBottom: '24px',
            maxWidth: '400px',
            margin: '0 auto 24px',
          }}>
            Import your balance and positions data to see portfolio insights and analytics.
          </p>
        </div>
      ) : (
        <ErrorBoundary
          level="section"
          fallback={
            <DataProcessingErrorFallback
              title="Overview Display Error"
              message="Unable to calculate portfolio overview statistics."
            />
          }
        >
          {/* Statistics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            marginBottom: '32px',
          }}>
            <StatCard
              title="Total Portfolio Value"
              value={formatCurrency(totalPortfolioValue)}
              icon={<DollarSign size={24} />}
              color="#2196f3"
              subtitle={`From ${balanceData.length} accounts`}
            />

            <StatCard
              title="Total Cash"
              value={formatCurrency(totalCash)}
              icon={<TrendingUp size={24} />}
              color="#4caf50"
              subtitle={`${((totalCash / totalPortfolioValue) * 100).toFixed(1)}% of portfolio`}
            />

            <StatCard
              title="Positions Value"
              value={formatCurrency(totalPositionsValue)}
              icon={<TrendingUp size={24} />}
              color="#ff9800"
              subtitle={`${positionsData.length} positions`}
            />

            <StatCard
              title="Unique Accounts"
              value={uniqueAccounts}
              icon={<Users size={24} />}
              color="#9c27b0"
              subtitle={`Across both data sets`}
            />
          </div>

          {/* Data Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '24px',
          }}>
            {/* Balance Data Summary */}
            {balanceData.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e0e0e0',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <DollarSign size={20} style={{ color: '#2196f3' }} />
                  Balance Data Summary
                </h3>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: '#666' }}>Total Accounts:</span>
                  <strong>{balanceData.length}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: '#666' }}>Average Portfolio Value:</span>
                  <strong>{formatCurrency(totalPortfolioValue / balanceData.length)}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <span style={{ color: '#666' }}>Cash Percentage:</span>
                  <strong>{((totalCash / totalPortfolioValue) * 100).toFixed(1)}%</strong>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#666',
                }}>
                  Last import: {lastImport.timestamp
                    ? new Date(lastImport.timestamp).toLocaleString()
                    : 'Unknown'}
                </div>
              </div>
            )}

            {/* Positions Data Summary */}
            {positionsData.length > 0 && (
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                border: '1px solid #e0e0e0',
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: '#333',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <TrendingUp size={20} style={{ color: '#ff9800' }} />
                  Positions Data Summary
                </h3>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: '#666' }}>Total Positions:</span>
                  <strong>{positionsData.length}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '12px',
                }}>
                  <span style={{ color: '#666' }}>Unique Symbols:</span>
                  <strong>{new Set(positionsData.map(p => p.symbol)).size}</strong>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}>
                  <span style={{ color: '#666' }}>Average Position Value:</span>
                  <strong>{formatCurrency(totalPositionsValue / positionsData.length)}</strong>
                </div>

                <div style={{
                  padding: '12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#666',
                }}>
                  Security types: {new Set(positionsData.map(p => p.securityType)).size} different types
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
      )}
    </div>
  );
};

export default OverviewPage;