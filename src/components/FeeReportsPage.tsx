import React, { useState, useMemo } from 'react';
import { FileText, Download, Calendar, DollarSign, TrendingUp, Users, PieChart, FileDown, Receipt } from 'lucide-react';
import InvoiceGenerationModal from './InvoiceGenerationModal';
import { Invoice, InvoiceGenerationOptions, InvoiceStatus, InvoiceLineItem } from '../types/Invoice';
import { exportReportToPDF, generateInvoicePDF, exportBulkInvoicesPDF } from '../utils/pdfExport';

type ReportType = 'fee_summary' | 'client_fees' | 'fee_schedule_usage' | 'revenue_projection' | 'billing_period';
type DateRange = 'current_quarter' | 'last_quarter' | 'year_to_date' | 'last_year' | 'custom';

interface FeeReportData {
  totalRevenue: number;
  totalAccounts: number;
  averageFeeRate: number;
  totalAUM: number;
  quarterlyGrowth: number;
}

const FeeReportsPage: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('fee_summary');
  const [dateRange, setDateRange] = useState<DateRange>('current_quarter');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceMode, setInvoiceMode] = useState<'single' | 'bulk'>('bulk');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedClientName, setSelectedClientName] = useState<string | undefined>();

  // Mock data - would come from actual data in production
  const reportData: FeeReportData = {
    totalRevenue: 1234567.89,
    totalAccounts: 156,
    averageFeeRate: 0.0085,
    totalAUM: 145000000,
    quarterlyGrowth: 12.5,
  };

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

  const getDateRangeLabel = (): string => {
    const now = new Date();
    switch (dateRange) {
      case 'current_quarter':
        return `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`;
      case 'last_quarter':
        const lastQ = Math.floor(now.getMonth() / 3);
        return `Q${lastQ === 0 ? 4 : lastQ} ${lastQ === 0 ? now.getFullYear() - 1 : now.getFullYear()}`;
      case 'year_to_date':
        return `YTD ${now.getFullYear()}`;
      case 'last_year':
        return `${now.getFullYear() - 1}`;
      case 'custom':
        return customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : 'Custom Range';
      default:
        return '';
    }
  };

  const handleExportToCSV = () => {
    // Placeholder for CSV export
    const headers = ['Report Type', 'Date Range', 'Total Revenue', 'Total Accounts', 'Average Fee Rate', 'Total AUM'];
    const row = [
      selectedReport.replace('_', ' ').toUpperCase(),
      getDateRangeLabel(),
      reportData.totalRevenue,
      reportData.totalAccounts,
      reportData.averageFeeRate,
      reportData.totalAUM,
    ];

    const csvContent = [
      headers.join(','),
      row.join(','),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `fee_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportToPDF = () => {
    const reportHTML = `
      <h2>Summary Statistics</h2>
      <table>
        <tr>
          <td><strong>Total Revenue:</strong></td>
          <td class="text-right">${formatCurrency(reportData.totalRevenue)}</td>
        </tr>
        <tr>
          <td><strong>Total AUM:</strong></td>
          <td class="text-right">${formatCurrency(reportData.totalAUM)}</td>
        </tr>
        <tr>
          <td><strong>Average Fee Rate:</strong></td>
          <td class="text-right">${formatPercentage(reportData.averageFeeRate)}</td>
        </tr>
        <tr>
          <td><strong>Billing Accounts:</strong></td>
          <td class="text-right">${reportData.totalAccounts}</td>
        </tr>
      </table>

      <h2>Fee Breakdown by Category</h2>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th class="text-right">Accounts</th>
            <th class="text-right">AUM</th>
            <th class="text-right">Avg Rate</th>
            <th class="text-right">Revenue</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tiered Fee Schedules</td>
            <td class="text-right">89</td>
            <td class="text-right">${formatCurrency(98500000)}</td>
            <td class="text-right">${formatPercentage(0.0092)}</td>
            <td class="text-right">${formatCurrency(906800)}</td>
          </tr>
          <tr>
            <td>Flat Rate Schedules</td>
            <td class="text-right">42</td>
            <td class="text-right">${formatCurrency(35200000)}</td>
            <td class="text-right">${formatPercentage(0.0075)}</td>
            <td class="text-right">${formatCurrency(264000)}</td>
          </tr>
          <tr>
            <td>Flat Fee Schedules</td>
            <td class="text-right">18</td>
            <td class="text-right">${formatCurrency(8600000)}</td>
            <td class="text-right">${formatPercentage(0.0073)}</td>
            <td class="text-right">${formatCurrency(62800)}</td>
          </tr>
          <tr>
            <td>Direct Bill</td>
            <td class="text-right">7</td>
            <td class="text-right">${formatCurrency(2700000)}</td>
            <td class="text-right">${formatPercentage(0.0050)}</td>
            <td class="text-right">${formatCurrency(13500)}</td>
          </tr>
        </tbody>
      </table>
    `;

    const reportTitle = reportTypes.find(r => r.id === selectedReport)?.label || 'Fee Report';
    exportReportToPDF(reportTitle, reportHTML, getDateRangeLabel());
  };

  const handleGenerateInvoices = (mode: 'single' | 'bulk', clientId?: string, clientName?: string) => {
    setInvoiceMode(mode);
    setSelectedClientId(clientId);
    setSelectedClientName(clientName);
    setShowInvoiceModal(true);
  };

  const handleInvoiceGeneration = (options: InvoiceGenerationOptions) => {
    // Generate mock invoices
    const mockInvoices: Invoice[] = [];
    const clientCount = options.clientIds && options.clientIds.length > 0 ? options.clientIds.length : 5;

    for (let i = 0; i < clientCount; i++) {
      const lineItems: InvoiceLineItem[] = [
        {
          id: `line-${i}-1`,
          accountNumber: `ACC${1000 + i * 3}`,
          accountName: `Investment Account`,
          feeScheduleCode: '17',
          feeScheduleName: 'Fee 17',
          beginningBalance: 500000,
          endingBalance: 525000,
          averageBalance: 512500,
          feeRate: 0.01,
          calculatedFee: 1281.25,
          finalFee: 1281.25,
        },
        {
          id: `line-${i}-2`,
          accountNumber: `ACC${1001 + i * 3}`,
          accountName: `IRA Account`,
          feeScheduleCode: '14',
          feeScheduleName: 'Fee 14',
          beginningBalance: 250000,
          endingBalance: 260000,
          averageBalance: 255000,
          feeRate: 0.01,
          calculatedFee: 637.50,
          finalFee: 637.50,
        },
      ];

      const subtotal = lineItems.reduce((sum, item) => sum + item.finalFee, 0);

      mockInvoices.push({
        id: `inv-${Date.now()}-${i}`,
        invoiceNumber: `INV-2024-${(1000 + i).toString().padStart(4, '0')}`,
        invoiceDate: options.invoiceDate,
        dueDate: options.dueDate,
        status: InvoiceStatus.DRAFT,
        clientId: options.clientIds?.[i] || `client-${i}`,
        clientName: selectedClientName || `Client ${i + 1}`,
        billingPeriodId: options.billingPeriodId,
        billingPeriodName: 'Q4 2024',
        periodStartDate: new Date('2024-10-01'),
        periodEndDate: new Date('2024-12-31'),
        lineItems,
        subtotal,
        totalDue: subtotal,
        createdAt: new Date(),
        updatedAt: new Date(),
        companyName: options.companyInfo?.name,
        companyAddress: options.companyInfo?.address,
        companyPhone: options.companyInfo?.phone,
        companyEmail: options.companyInfo?.email,
        customMessage: options.customMessage,
      });
    }

    setShowInvoiceModal(false);

    // Export based on mode
    if (invoiceMode === 'bulk') {
      exportBulkInvoicesPDF(mockInvoices);
    } else {
      generateInvoicePDF(mockInvoices[0]);
    }

    alert(`Successfully generated ${mockInvoices.length} invoice(s)!`);
  };

  const reportTypes = [
    { id: 'fee_summary', label: 'Fee Summary', icon: DollarSign },
    { id: 'client_fees', label: 'Client Fee Breakdown', icon: Users },
    { id: 'fee_schedule_usage', label: 'Fee Schedule Usage', icon: PieChart },
    { id: 'revenue_projection', label: 'Revenue Projection', icon: TrendingUp },
    { id: 'billing_period', label: 'Billing Period Report', icon: Calendar },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>
          Fee Reports
        </h1>
        <p style={{ color: '#64748b' }}>
          Generate and analyze fee-related reports
        </p>
      </div>

      {/* Report Type Selector */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#1a202c' }}>
          Select Report Type
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '12px',
        }}>
          {reportTypes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedReport(id as ReportType)}
              style={{
                padding: '16px',
                backgroundColor: selectedReport === id ? '#eff6ff' : 'white',
                border: `2px solid ${selectedReport === id ? '#2196f3' : '#e2e8f0'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <Icon size={20} color={selectedReport === id ? '#2196f3' : '#64748b'} />
              <span style={{
                fontSize: '14px',
                fontWeight: '500',
                color: selectedReport === id ? '#1e40af' : '#475569',
              }}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Section */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px',
        marginBottom: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>
            Filters
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{
              fontSize: '14px',
              color: '#2196f3',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            {showFilters ? 'Hide' : 'Show'}
          </button>
        </div>

        {showFilters && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: dateRange === 'custom' ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '16px',
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#1a202c',
                marginBottom: '8px',
              }}>
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as DateRange)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="current_quarter">Current Quarter</option>
                <option value="last_quarter">Last Quarter</option>
                <option value="year_to_date">Year to Date</option>
                <option value="last_year">Last Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1a202c',
                    marginBottom: '8px',
                  }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#1a202c',
                    marginBottom: '8px',
                  }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportToCSV}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Download size={16} />
                Export CSV
              </button>
              <button
                onClick={handleExportToPDF}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <FileDown size={16} />
                Export PDF
              </button>
              <button
                onClick={() => handleGenerateInvoices('bulk')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Receipt size={16} />
                Generate Invoices
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            Total Revenue
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {formatCurrency(reportData.totalRevenue)}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            +{reportData.quarterlyGrowth}% from last period
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            Total AUM
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {formatCurrency(reportData.totalAUM)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Across {reportData.totalAccounts} accounts
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            Average Fee Rate
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {formatPercentage(reportData.averageFeeRate)}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Blended rate
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', fontWeight: '500' }}>
            Billing Accounts
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {reportData.totalAccounts}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Active accounts
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '24px',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
              {reportTypes.find(r => r.id === selectedReport)?.label}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              {getDateRangeLabel()}
            </p>
          </div>
          <FileText size={24} color="#64748b" />
        </div>

        {/* Report-specific content based on selectedReport */}
        {selectedReport === 'fee_summary' && (
          <div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Category
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Accounts
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    AUM
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Avg Rate
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { category: 'Tiered Fee Schedules', accounts: 89, aum: 98500000, rate: 0.0092, revenue: 906800 },
                  { category: 'Flat Rate Schedules', accounts: 42, aum: 35200000, rate: 0.0075, revenue: 264000 },
                  { category: 'Flat Fee Schedules', accounts: 18, aum: 8600000, rate: 0.0073, revenue: 62800 },
                  { category: 'Direct Bill', accounts: 7, aum: 2700000, rate: 0.0050, revenue: 13500 },
                ].map((row, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1a202c', fontWeight: '500' }}>
                      {row.category}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1a202c', textAlign: 'right' }}>
                      {row.accounts}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1a202c', textAlign: 'right' }}>
                      {formatCurrency(row.aum)}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#1a202c', textAlign: 'right' }}>
                      {formatPercentage(row.rate)}
                    </td>
                    <td style={{ padding: '16px 8px', fontSize: '14px', color: '#10b981', fontWeight: '600', textAlign: 'right' }}>
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedReport === 'client_fees' && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <FileText size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Client Fee Breakdown Report
            </p>
            <p style={{ fontSize: '14px' }}>
              This report will show detailed fee breakdowns for each client
            </p>
          </div>
        )}

        {selectedReport === 'fee_schedule_usage' && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <PieChart size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Fee Schedule Usage Report
            </p>
            <p style={{ fontSize: '14px' }}>
              This report will show how frequently each fee schedule is used
            </p>
          </div>
        )}

        {selectedReport === 'revenue_projection' && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <TrendingUp size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Revenue Projection Report
            </p>
            <p style={{ fontSize: '14px' }}>
              This report will project future revenue based on current AUM and fee schedules
            </p>
          </div>
        )}

        {selectedReport === 'billing_period' && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <Calendar size={48} color="#cbd5e1" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '16px', fontWeight: '500', marginBottom: '8px' }}>
              Billing Period Report
            </p>
            <p style={{ fontSize: '14px' }}>
              This report will show billing activity for the selected period
            </p>
          </div>
        )}
      </div>

      {/* Invoice Generation Modal */}
      <InvoiceGenerationModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onGenerate={handleInvoiceGeneration}
        mode={invoiceMode}
        selectedClientId={selectedClientId}
        selectedClientName={selectedClientName}
      />
    </div>
  );
};

export default FeeReportsPage;
