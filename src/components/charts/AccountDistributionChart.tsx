import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Building, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';
import { AccountDistribution, formatCurrency, formatPercentage } from '../../utils/portfolioAnalytics';
import { useSearchContext } from '../../contexts/SearchContext';

interface AccountDistributionChartProps {
  data: AccountDistribution[];
  height?: number;
  showDetails?: boolean;
  onAccountClick?: (account: AccountDistribution) => void;
  className?: string;
}

const AccountDistributionChart: React.FC<AccountDistributionChartProps> = ({
  data,
  height = 400,
  showDetails = true,
  onAccountClick,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<AccountDistribution | null>(null);
  const { performGlobalSearch } = useSearchContext();

  // Group accounts by type for the donut chart
  const groupedData = useMemo(() => {
    const groups = new Map<string, {
      accountType: string;
      totalValue: number;
      totalCash: number;
      totalInvested: number;
      accounts: AccountDistribution[];
      color: string;
    }>();

    data.forEach(account => {
      const key = account.accountType;
      if (groups.has(key)) {
        const group = groups.get(key)!;
        group.totalValue += account.value;
        group.totalCash += account.cashAmount;
        group.totalInvested += account.investedAmount;
        group.accounts.push(account);
      } else {
        groups.set(key, {
          accountType: account.accountType,
          totalValue: account.value,
          totalCash: account.cashAmount,
          totalInvested: account.investedAmount,
          accounts: [account],
          color: account.color
        });
      }
    });

    return Array.from(groups.values()).map(group => ({
      ...group,
      percentage: data.reduce((sum, acc) => sum + acc.value, 0) > 0
        ? (group.totalValue / data.reduce((sum, acc) => sum + acc.value, 0)) * 100
        : 0
    })).sort((a, b) => b.totalValue - a.totalValue);
  }, [data]);

  const totalValue = useMemo(() =>
    data.reduce((sum, account) => sum + account.value, 0),
    [data]
  );

  // Handle mouse events
  const handleMouseEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const handleMouseLeave = () => {
    setActiveIndex(null);
  };

  // Handle slice click
  const handleSliceClick = (item: any, index: number) => {
    setSelectedAccount(selectedAccount?.accountType === item.accountType ? null : item);

    if (onAccountClick) {
      onAccountClick(item);
    } else {
      // Default behavior: search for account type
      performGlobalSearch(item.accountType, 'filter');
    }
  };

  // Handle individual account click
  const handleAccountClick = (account: AccountDistribution) => {
    // Search for specific account
    performGlobalSearch(account.accountName, 'filter');
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
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
          minWidth: '200px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: data.color, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={16} />
            {data.accountType}
          </div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Total Value:</span>
              <strong>{formatCurrency(data.totalValue)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Percentage:</span>
              <strong>{formatPercentage(data.percentage)}</strong>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '8px', fontSize: '12px', color: '#666' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Cash:</span>
              <span>{formatCurrency(data.totalCash)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span>Invested:</span>
              <span>{formatCurrency(data.totalInvested)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Accounts:</span>
              <span>{data.accounts.length}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices < 5%

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
          <Building size={48} color="#ccc" style={{ marginBottom: '16px' }} />
          <div>No account data available</div>
          <div style={{ fontSize: '12px', marginTop: '4px' }}>
            Import account balance data to see distribution
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
            Account Distribution
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
            Portfolio breakdown by account type
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#666'
        }}>
          <TrendingUp size={14} />
          {data.length} accounts
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Donut Chart */}
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height={height}>
            <PieChart>
              <Pie
                data={groupedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={120}
                innerRadius={60}
                fill="#8884d8"
                dataKey="totalValue"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                onClick={handleSliceClick}
                animationBegin={0}
                animationDuration={800}
              >
                {groupedData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke={activeIndex === index ? '#333' : 'none'}
                    strokeWidth={activeIndex === index ? 3 : 0}
                    style={{
                      cursor: 'pointer',
                      filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Total */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '40%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {formatCurrency(totalValue)}
            </div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              Total Portfolio
            </div>
          </div>
        </div>

        {/* Account Details Panel */}
        {showDetails && (
          <div style={{ width: '300px', borderLeft: '1px solid #e0e0e0', paddingLeft: '24px' }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Account Details
            </h4>

            {/* Account Type Groups */}
            {groupedData.map((group, groupIndex) => (
              <div
                key={group.accountType}
                style={{
                  marginBottom: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: selectedAccount?.accountType === group.accountType ? '#f0f7ff' : 'white'
                }}
              >
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: selectedAccount?.accountType === group.accountType ? '#e3f2fd' : '#f8f9fa',
                    borderBottom: '1px solid #e0e0e0',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease'
                  }}
                  onClick={() => handleSliceClick(group, groupIndex)}
                  onMouseEnter={(e) => {
                    if (selectedAccount?.accountType !== group.accountType) {
                      e.currentTarget.style.backgroundColor = '#f0f0f0';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedAccount?.accountType !== group.accountType) {
                      e.currentTarget.style.backgroundColor = '#f8f9fa';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: group.color,
                          borderRadius: '2px'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                          {group.accountType}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {group.accounts.length} account{group.accounts.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: '600', fontSize: '14px', color: '#333' }}>
                        {formatCurrency(group.totalValue)}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {formatPercentage(group.percentage)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Individual Accounts */}
                {selectedAccount?.accountType === group.accountType && (
                  <div style={{ backgroundColor: 'white' }}>
                    {group.accounts.map((account, accountIndex) => (
                      <div
                        key={accountIndex}
                        style={{
                          padding: '12px 16px',
                          borderBottom: accountIndex < group.accounts.length - 1 ? '1px solid #f0f0f0' : 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s ease'
                        }}
                        onClick={() => handleAccountClick(account)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#f8f9fa';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '13px', fontWeight: '500', color: '#333', marginBottom: '4px' }}>
                              {account.accountName}
                            </div>
                            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#666' }}>
                              <span>Cash: {formatCurrency(account.cashAmount)}</span>
                              <span>Invested: {formatCurrency(account.investedAmount)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '13px', fontWeight: '600', color: '#333' }}>
                                {formatCurrency(account.value)}
                              </div>
                              <div style={{ fontSize: '11px', color: '#666' }}>
                                {formatPercentage(account.percentage)}
                              </div>
                            </div>
                            <ChevronRight size={14} color="#ccc" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '16px',
          fontSize: '14px'
        }}>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Total Cash
            </div>
            <div style={{ fontWeight: 'bold', color: '#4CAF50' }}>
              {formatCurrency(groupedData.reduce((sum, group) => sum + group.totalCash, 0))}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Total Invested
            </div>
            <div style={{ fontWeight: 'bold', color: '#2196F3' }}>
              {formatCurrency(groupedData.reduce((sum, group) => sum + group.totalInvested, 0))}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Account Types
            </div>
            <div style={{ fontWeight: 'bold', color: '#333' }}>
              {groupedData.length}
            </div>
          </div>
          <div>
            <div style={{ color: '#666', fontSize: '12px', marginBottom: '4px' }}>
              Cash Allocation
            </div>
            <div style={{ fontWeight: 'bold', color: totalValue > 0 ? '#FF9800' : '#333' }}>
              {totalValue > 0
                ? formatPercentage((groupedData.reduce((sum, group) => sum + group.totalCash, 0) / totalValue) * 100)
                : 'N/A'
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AccountDistributionChart);