import React from 'react';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

interface BillingPeriod {
  id: string;
  quarter: string;
  year: number;
  startDate: Date;
  endDate: Date;
  daysInPeriod: number;
  prorationFactor: number;
  status: 'completed' | 'current' | 'upcoming';
  totalBilled?: number;
  numberOfAccounts?: number;
}

const BillingPeriodsPage: React.FC = () => {
  // Generate billing periods
  const generateBillingPeriods = (): BillingPeriod[] => {
    const periods: BillingPeriod[] = [];
    const today = new Date('2024-10-05'); // Using the date from env

    // Helper to get quarter info
    const getQuarterInfo = (date: Date) => {
      const month = date.getMonth();
      const year = date.getFullYear();

      if (month >= 0 && month <= 2) return { quarter: 'Q1', startMonth: 0, year };
      if (month >= 3 && month <= 5) return { quarter: 'Q2', startMonth: 3, year };
      if (month >= 6 && month <= 8) return { quarter: 'Q3', startMonth: 6, year };
      return { quarter: 'Q4', startMonth: 9, year };
    };

    // Generate last 4 completed quarters
    const completedPeriods = [
      { quarter: 'Q3', year: 2024, totalBilled: 285000, numberOfAccounts: 7 },
      { quarter: 'Q2', year: 2024, totalBilled: 278000, numberOfAccounts: 7 },
      { quarter: 'Q1', year: 2024, totalBilled: 271000, numberOfAccounts: 6 },
      { quarter: 'Q4', year: 2023, totalBilled: 265000, numberOfAccounts: 6 }
    ];

    completedPeriods.forEach(period => {
      const startMonth = period.quarter === 'Q1' ? 0 : period.quarter === 'Q2' ? 3 : period.quarter === 'Q3' ? 6 : 9;
      const startDate = new Date(period.year, startMonth, 1);
      const endDate = new Date(period.year, startMonth + 3, 0);
      const daysInPeriod = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      periods.push({
        id: `${period.quarter}-${period.year}`,
        quarter: period.quarter,
        year: period.year,
        startDate,
        endDate,
        daysInPeriod,
        prorationFactor: daysInPeriod / 365,
        status: 'completed',
        totalBilled: period.totalBilled,
        numberOfAccounts: period.numberOfAccounts
      });
    });

    // Current period (Q4 2024)
    periods.push({
      id: 'Q4-2024',
      quarter: 'Q4',
      year: 2024,
      startDate: new Date(2024, 9, 1),
      endDate: new Date(2024, 11, 31),
      daysInPeriod: 92,
      prorationFactor: 92 / 365,
      status: 'current',
      totalBilled: 0,
      numberOfAccounts: 7
    });

    // Next period (Q1 2025)
    periods.push({
      id: 'Q1-2025',
      quarter: 'Q1',
      year: 2025,
      startDate: new Date(2025, 0, 1),
      endDate: new Date(2025, 2, 31),
      daysInPeriod: 90,
      prorationFactor: 90 / 365,
      status: 'upcoming',
      totalBilled: undefined,
      numberOfAccounts: 7
    });

    // Sort: upcoming first, then current, then completed (most recent to oldest)
    const upcoming = periods.filter(p => p.status === 'upcoming');
    const current = periods.filter(p => p.status === 'current');
    const completed = periods.filter(p => p.status === 'completed').reverse(); // Most recent first

    return [...upcoming, ...current, ...completed];
  };

  const billingPeriods = generateBillingPeriods();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusConfig = (status: BillingPeriod['status']) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle size={20} />,
          color: '#4caf50',
          bg: '#e8f5e9',
          label: 'Completed',
          border: '#a5d6a7'
        };
      case 'current':
        return {
          icon: <Clock size={20} />,
          color: '#2196f3',
          bg: '#e3f2fd',
          label: 'Current Period',
          border: '#90caf9'
        };
      case 'upcoming':
        return {
          icon: <AlertCircle size={20} />,
          color: '#ff9800',
          bg: '#fff3e0',
          label: 'Upcoming',
          border: '#ffb74d'
        };
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
          Billing Periods
        </h1>
        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
          View and manage quarterly billing periods
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e3f2fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} color="#2196f3" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Current Period</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Q4 2024</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Oct 1 - Dec 31, 2024 • 92 days
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fff3e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Calendar size={20} color="#ff9800" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Next Period</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>Q1 2025</div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Jan 1 - Mar 31, 2025 • 90 days
          </div>
        </div>

        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#e8f5e9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <TrendingUp size={20} color="#4caf50" />
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#666' }}>Last 4 Quarters</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>
                {formatCurrency(billingPeriods.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.totalBilled || 0), 0))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: '#666' }}>
            Total fees billed
          </div>
        </div>
      </div>

      {/* Billing Periods List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5'
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' }}>
            Recent and Upcoming Periods
          </h2>
        </div>

        <div style={{ padding: '16px' }}>
          {billingPeriods.map((period, index) => {
            const statusConfig = getStatusConfig(period.status);

            return (
              <div
                key={period.id}
                style={{
                  padding: '20px',
                  marginBottom: index < billingPeriods.length - 1 ? '12px' : 0,
                  border: `2px solid ${statusConfig.border}`,
                  borderRadius: '8px',
                  backgroundColor: statusConfig.bg,
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {/* Left side - Period info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${statusConfig.color}`
                      }}>
                        <div style={{ color: statusConfig.color }}>
                          {statusConfig.icon}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                          {period.quarter} {period.year}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          backgroundColor: 'white',
                          color: statusConfig.color,
                          border: `1px solid ${statusConfig.color}`
                        }}>
                          {statusConfig.label}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginTop: '16px'
                    }}>
                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Period Dates</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                          {formatDate(period.startDate)} - {formatDate(period.endDate)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Days in Period</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                          {period.daysInPeriod} days
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Proration Factor</div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                          {(period.prorationFactor * 100).toFixed(2)}% ({period.daysInPeriod}/365)
                        </div>
                      </div>

                      {period.status === 'completed' && (
                        <>
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Total Billed</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig.color }}>
                              {formatCurrency(period.totalBilled)}
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Accounts Billed</div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {period.numberOfAccounts} accounts
                            </div>
                          </div>
                        </>
                      )}

                      {period.status === 'current' && (
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Active Accounts</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {period.numberOfAccounts} accounts
                          </div>
                        </div>
                      )}

                      {period.status === 'upcoming' && (
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Expected Accounts</div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {period.numberOfAccounts} accounts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Period-specific messages */}
                {period.status === 'current' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #90caf9',
                    fontSize: '13px',
                    color: '#1565c0'
                  }}>
                    <strong>In Progress:</strong> This is the current billing period. Fees will be calculated and billed at the end of the quarter.
                  </div>
                )}

                {period.status === 'upcoming' && (
                  <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    backgroundColor: 'white',
                    borderRadius: '6px',
                    border: '1px solid #ffb74d',
                    fontSize: '13px',
                    color: '#e65100'
                  }}>
                    <strong>Upcoming:</strong> This period will begin on {formatDate(period.startDate)}. No billing actions are available yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Section */}
      <div style={{
        marginTop: '24px',
        padding: '20px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
          About Billing Periods
        </h3>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>
            Billing periods are organized into quarters (Q1-Q4) for standard quarterly billing cycles:
          </p>
          <ul style={{ marginLeft: '20px', marginBottom: '8px' }}>
            <li>Q1: January 1 - March 31 (90 days)</li>
            <li>Q2: April 1 - June 30 (91 days)</li>
            <li>Q3: July 1 - September 30 (92 days)</li>
            <li>Q4: October 1 - December 31 (92 days)</li>
          </ul>
          <p style={{ margin: 0 }}>
            The proration factor is used to calculate fees for partial periods based on the number of days in each quarter divided by 365.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPeriodsPage;
