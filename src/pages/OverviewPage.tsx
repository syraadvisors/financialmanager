import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, AlertCircle } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { DataProcessingErrorFallback } from '../components/ErrorFallbacks';
import ExportButton from '../components/ExportButton';
import { accountsService } from '../services/api/accounts.service';
import { importedBalanceDataService } from '../services/api/importedBalanceData.service';

interface OverviewPageProps {
  onExportData?: (format: 'csv' | 'json' | 'excel') => void;
}

const OverviewPage: React.FC<OverviewPageProps> = ({ onExportData }) => {
  const { state } = useAppContext();
  const { userProfile } = useAuth();
  const { positionsData, lastImport } = state;
  const [accountCount, setAccountCount] = useState<number>(0);
  const [loadingAccountCount, setLoadingAccountCount] = useState(true);
  const [balanceData, setBalanceData] = useState<any[]>([]);
  const [loadingBalanceData, setLoadingBalanceData] = useState(true);

  // Fetch actual balance data from database
  useEffect(() => {
    const fetchBalanceData = async () => {
      if (!userProfile?.firmId) {
        setLoadingBalanceData(false);
        return;
      }

      setLoadingBalanceData(true);
      const response = await importedBalanceDataService.getAll(userProfile.firmId);

      if (response.data) {
        // Get unique accounts (deduplicate by account number, keeping most recent)
        const accountMap = new Map();
        response.data.forEach(record => {
          const existing = accountMap.get(record.accountNumber);
          if (!existing || new Date(record.importTimestamp || 0) > new Date(existing.importTimestamp || 0)) {
            accountMap.set(record.accountNumber, record);
          }
        });
        setBalanceData(Array.from(accountMap.values()));
      } else {
        console.error('[OverviewPage] Failed to fetch balance data:', response.error);
        setBalanceData([]);
      }

      setLoadingBalanceData(false);
    };

    fetchBalanceData();
  }, [userProfile?.firmId]);

  // Fetch actual account count from database
  useEffect(() => {
    const fetchAccountCount = async () => {
      if (!userProfile?.firmId) {
        setLoadingAccountCount(false);
        return;
      }

      setLoadingAccountCount(true);
      const response = await accountsService.getCount(userProfile.firmId);

      if (response.data !== undefined) {
        setAccountCount(response.data);
      } else {
        console.error('[OverviewPage] Failed to fetch account count:', response.error);
        // Fallback to calculating from imported data if API fails
        setAccountCount(balanceData.length);
      }

      setLoadingAccountCount(false);
    };

    fetchAccountCount();
  }, [userProfile?.firmId, balanceData.length]);

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
            Overview
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0,
          }}>
            {hasData
              ? `Last Import Date/Time: ${lastImport.timestamp ? new Date(lastImport.timestamp).toLocaleString() : 'Never'}`
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
              title="Total AUM"
              value={loadingBalanceData ? 'Loading...' : formatCurrency(totalPortfolioValue)}
              icon={<DollarSign size={24} />}
              color="#2196f3"
              subtitle={`Assets under management`}
            />

            <StatCard
              title="Active Accounts"
              value={loadingAccountCount ? 'Loading...' : accountCount}
              icon={<Users size={24} />}
              color="#9c27b0"
              subtitle={`Unique client accounts`}
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
                  <span style={{ color: '#666' }}>Total Portfolio Value:</span>
                  <strong>{formatCurrency(totalPortfolioValue)}</strong>
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
                }}>
                  <span style={{ color: '#666' }}>Cash Percentage:</span>
                  <strong>{((totalCash / totalPortfolioValue) * 100).toFixed(1)}%</strong>
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
                }}>
                  <span style={{ color: '#666' }}>Average Position Value:</span>
                  <strong>{formatCurrency(totalPositionsValue / positionsData.length)}</strong>
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