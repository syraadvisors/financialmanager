import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign, FileText } from 'lucide-react';

interface FeeHistoryRecord {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  aum: number;
  feeSchedule: string;
  feeRate: number;
  calculatedFee: number;
  adjustments?: number;
  finalFee: number;
  status: 'paid' | 'pending' | 'invoiced' | 'calculated';
  invoiceNumber?: string;
  paidDate?: Date;
}

interface FeeHistoryTableProps {
  clientId: string;
  clientName: string;
  feeHistory: FeeHistoryRecord[];
}

const FeeHistoryTable: React.FC<FeeHistoryTableProps> = ({
  clientId,
  clientName,
  feeHistory,
}) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const getTrendIcon = (current: number, previous?: number) => {
    if (!previous) return <Minus size={14} color="#94a3b8" />;

    if (current > previous) {
      return <TrendingUp size={14} color="#10b981" />;
    } else if (current < previous) {
      return <TrendingDown size={14} color="#ef4444" />;
    }
    return <Minus size={14} color="#94a3b8" />;
  };

  const getTrendPercentage = (current: number, previous?: number): string => {
    if (!previous || previous === 0) return 'N/A';

    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
  };

  const getTrendColor = (current: number, previous?: number): string => {
    if (!previous) return '#94a3b8';
    if (current > previous) return '#10b981';
    if (current < previous) return '#ef4444';
    return '#94a3b8';
  };

  const getStatusBadge = (status: 'paid' | 'pending' | 'invoiced' | 'calculated') => {
    const config = {
      paid: { bg: '#dcfce7', color: '#166534', label: 'Paid' },
      invoiced: { bg: '#dbeafe', color: '#1e40af', label: 'Invoiced' },
      pending: { bg: '#fed7aa', color: '#c2410c', label: 'Pending' },
      calculated: { bg: '#f3e8ff', color: '#7e22ce', label: 'Calculated' },
    };

    const style = config[status];

    return (
      <span style={{
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: style.bg,
        color: style.color,
      }}>
        {style.label}
      </span>
    );
  };

  const sortedHistory = [...feeHistory].sort((a, b) => {
    const dateA = a.periodStart.getTime();
    const dateB = b.periodStart.getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  const totalFees = feeHistory.reduce((sum, record) => sum + record.finalFee, 0);
  const avgFee = totalFees / feeHistory.length;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '12px',
        }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
              Fee History
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {clientName} - Historical fee records
            </p>
          </div>
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}
          </button>
        </div>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginTop: '16px',
        }}>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
              Total Fees Paid
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c' }}>
              {formatCurrency(totalFees)}
            </div>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
              Average Per Period
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c' }}>
              {formatCurrency(avgFee)}
            </div>
          </div>
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '6px',
          }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
              Billing Periods
            </div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c' }}>
              {feeHistory.length}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Period
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                AUM
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Fee Schedule
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Rate
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Calculated
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Adjustments
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Final Fee
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Trend
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '11px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHistory.map((record, index) => {
              const previousRecord = sortedHistory[index + 1];
              const trendPercent = getTrendPercentage(record.finalFee, previousRecord?.finalFee);
              const trendColor = getTrendColor(record.finalFee, previousRecord?.finalFee);

              return (
                <tr
                  key={record.period}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="#64748b" />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>
                          {record.period}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {record.periodStart.toLocaleDateString()} - {record.periodEnd.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a202c' }}>
                      {formatCurrency(record.aum)}
                    </div>
                    {previousRecord && (
                      <div style={{ fontSize: '11px', color: getTrendColor(record.aum, previousRecord.aum) }}>
                        {getTrendPercentage(record.aum, previousRecord.aum)}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#475569',
                      fontWeight: '500',
                    }}>
                      {record.feeSchedule}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: '#64748b' }}>
                    {formatPercentage(record.feeRate)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '500', color: '#1a202c' }}>
                    {formatCurrency(record.calculatedFee)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', color: record.adjustments && record.adjustments !== 0 ? '#f59e0b' : '#64748b' }}>
                    {record.adjustments ? formatCurrency(record.adjustments) : '—'}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '13px', fontWeight: '700', color: '#10b981' }}>
                    {formatCurrency(record.finalFee)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      {getTrendIcon(record.finalFee, previousRecord?.finalFee)}
                      <span style={{ fontSize: '11px', color: trendColor, fontWeight: '600' }}>
                        {trendPercent}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      {getStatusBadge(record.status)}
                      {record.invoiceNumber && (
                        <div style={{
                          fontSize: '10px',
                          color: '#94a3b8',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}>
                          <FileText size={10} />
                          {record.invoiceNumber}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {feeHistory.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#94a3b8',
        }}>
          <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No fee history available</p>
          <p style={{ fontSize: '14px' }}>Fee records will appear here once billing begins</p>
        </div>
      )}
    </div>
  );
};

export default FeeHistoryTable;
