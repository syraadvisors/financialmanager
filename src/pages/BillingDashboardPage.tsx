import React, { useState } from 'react';
import {
  DollarSign,
  Users,
  TrendingUp,
  Calendar,
  FileText,
  Send,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Receipt,
  PieChart,
  BarChart3
} from 'lucide-react';
import { InvoiceGenerationOptions, Invoice, InvoiceStatus } from '../types/Invoice';
import InvoiceGenerationModal from '../components/InvoiceGenerationModal';
import { exportBulkInvoicesPDF } from '../utils/pdfExport';

interface BillingClient {
  id: string;
  name: string;
  totalAUM: number;
  numberOfAccounts: number;
  feeSchedule: string;
  calculatedFee: number;
  feeRate: number;
  status: 'calculated' | 'pending' | 'invoiced';
  lastInvoiceDate?: Date;
}

const BillingDashboardPage: React.FC = () => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q4 2024');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);

  // Mock data - would come from API in production
  const currentQuarter = {
    quarter: 'Q4 2024',
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31'),
    totalFees: 308100,
    totalClients: 156,
    calculatedClients: 148,
    pendingClients: 8,
    invoicedClients: 142,
    totalAUM: 145000000,
  };

  const mockClients: BillingClient[] = [
    {
      id: '1',
      name: 'John Smith',
      totalAUM: 2500000,
      numberOfAccounts: 3,
      feeSchedule: 'Fee 17',
      calculatedFee: 6562.50,
      feeRate: 0.0105,
      status: 'calculated',
      lastInvoiceDate: new Date('2024-09-30'),
    },
    {
      id: '2',
      name: 'Smith Family Trust',
      totalAUM: 5800000,
      numberOfAccounts: 5,
      feeSchedule: 'Fee 17',
      calculatedFee: 14550.00,
      feeRate: 0.0100,
      status: 'invoiced',
      lastInvoiceDate: new Date('2024-10-05'),
    },
    {
      id: '3',
      name: 'Tech Startup LLC',
      totalAUM: 1200000,
      numberOfAccounts: 2,
      feeSchedule: 'Fee 14',
      calculatedFee: 3000.00,
      feeRate: 0.0100,
      status: 'calculated',
      lastInvoiceDate: new Date('2024-09-30'),
    },
    {
      id: '4',
      name: 'Johnson Family',
      totalAUM: 3500000,
      numberOfAccounts: 4,
      feeSchedule: 'Fee 17',
      calculatedFee: 9187.50,
      feeRate: 0.0105,
      status: 'pending',
    },
    {
      id: '5',
      name: 'Williams Retirement',
      totalAUM: 850000,
      numberOfAccounts: 2,
      feeSchedule: 'Fee 17',
      calculatedFee: 2531.25,
      feeRate: 0.0119,
      status: 'calculated',
      lastInvoiceDate: new Date('2024-09-30'),
    },
  ];

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

  const getStatusBadge = (status: 'calculated' | 'pending' | 'invoiced') => {
    const config = {
      calculated: { bg: '#e8f5e9', color: '#2e7d32', icon: <CheckCircle size={14} />, label: 'Calculated' },
      pending: { bg: '#fff3e0', color: '#f57c00', icon: <Clock size={14} />, label: 'Pending' },
      invoiced: { bg: '#e3f2fd', color: '#1565c0', icon: <Receipt size={14} />, label: 'Invoiced' },
    };

    const style = config[status];

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color,
      }}>
        {style.icon}
        {style.label}
      </span>
    );
  };

  const handleGenerateInvoices = () => {
    setShowInvoiceModal(true);
  };

  const handleInvoiceGeneration = (options: InvoiceGenerationOptions) => {
    // Generate mock invoices
    const clientsToInvoice = selectedClients.length > 0
      ? mockClients.filter(c => selectedClients.includes(c.id))
      : mockClients.filter(c => c.status === 'calculated');

    const mockInvoices: Invoice[] = clientsToInvoice.map((client, i) => ({
      id: `inv-${Date.now()}-${i}`,
      invoiceNumber: `INV-2024-${(1000 + i).toString().padStart(4, '0')}`,
      invoiceDate: options.invoiceDate,
      dueDate: options.dueDate,
      status: InvoiceStatus.DRAFT,
      clientId: client.id,
      clientName: client.name,
      billingPeriodId: options.billingPeriodId,
      billingPeriodName: currentQuarter.quarter,
      periodStartDate: currentQuarter.startDate,
      periodEndDate: currentQuarter.endDate,
      lineItems: [],
      subtotal: client.calculatedFee,
      totalDue: client.calculatedFee,
      createdAt: new Date(),
      updatedAt: new Date(),
      companyName: options.companyInfo?.name,
      companyAddress: options.companyInfo?.address,
      companyPhone: options.companyInfo?.phone,
      companyEmail: options.companyInfo?.email,
      customMessage: options.customMessage,
    }));

    setShowInvoiceModal(false);
    exportBulkInvoicesPDF(mockInvoices);
    alert(`Successfully generated ${mockInvoices.length} invoice(s)!`);
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === mockClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(mockClients.map(c => c.id));
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>
          Billing Dashboard
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage quarterly fee calculations and invoice generation
        </p>
      </div>

      {/* Quarter Selector */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Calendar size={20} color="#2196f3" />
          <div>
            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '2px' }}>
              Billing Period
            </div>
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#1a202c',
                backgroundColor: 'white',
                cursor: 'pointer',
              }}
            >
              <option value="Q4 2024">Q4 2024 (Oct - Dec 2024)</option>
              <option value="Q3 2024">Q3 2024 (Jul - Sep 2024)</option>
              <option value="Q2 2024">Q2 2024 (Apr - Jun 2024)</option>
              <option value="Q1 2024">Q1 2024 (Jan - Mar 2024)</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGenerateInvoices}
            disabled={selectedClients.length === 0 && mockClients.filter(c => c.status === 'calculated').length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: selectedClients.length > 0 || mockClients.some(c => c.status === 'calculated') ? '#2196f3' : '#e5e7eb',
              color: selectedClients.length > 0 || mockClients.some(c => c.status === 'calculated') ? 'white' : '#9ca3af',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: selectedClients.length > 0 || mockClients.some(c => c.status === 'calculated') ? 'pointer' : 'not-allowed',
            }}
          >
            <Receipt size={16} />
            Generate Invoices
            {selectedClients.length > 0 && ` (${selectedClients.length})`}
          </button>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#10b981',
              border: '2px solid #10b981',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            <Send size={16} />
            Send Statements
          </button>
        </div>
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
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#dbeafe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <DollarSign size={20} color="#2196f3" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Total Fees
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {formatCurrency(currentQuarter.totalFees)}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            +8.5% from Q3 2024
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#dcfce7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <CheckCircle size={20} color='#10b981' />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Calculated
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {currentQuarter.calculatedClients}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            of {currentQuarter.totalClients} clients
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fed7aa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Clock size={20} color="#f59e0b" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Pending
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {currentQuarter.pendingClients}
          </div>
          <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px' }}>
            Need calculation
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#ddd6fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Receipt size={20} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Invoiced
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {currentQuarter.invoicedClients}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            Invoices sent
          </div>
        </div>

        <div style={{
          backgroundColor: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: '#fce7f3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <TrendingUp size={20} color="#ec4899" />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
              Total AUM
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1a202c' }}>
            {formatCurrency(currentQuarter.totalAUM)}
          </div>
          <div style={{ fontSize: '12px', color: '#10b981', marginTop: '4px' }}>
            +3.2% from Q3
          </div>
        </div>
      </div>

      {/* Client Fee Status Table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
              Client Fee Calculations
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b' }}>
              Fee calculation status for {currentQuarter.quarter}
            </p>
          </div>
          <button
            onClick={handleSelectAll}
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
            {selectedClients.length === mockClients.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedClients.length === mockClients.length}
                    onChange={handleSelectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Client
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Fee Schedule
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  AUM
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Accounts
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Effective Rate
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Calculated Fee
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {mockClients.map((client, index) => (
                <tr
                  key={client.id}
                  style={{
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: selectedClients.includes(client.id) ? '#f0f9ff' : 'white',
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={() => handleSelectClient(client.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#e3f2fd',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Users size={18} color="#2196f3" />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                          {client.name}
                        </div>
                        {client.lastInvoiceDate && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Last: {client.lastInvoiceDate.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      backgroundColor: '#f1f5f9',
                      borderRadius: '6px',
                      fontSize: '13px',
                      color: '#475569',
                      fontWeight: '500',
                    }}>
                      {client.feeSchedule}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                    {formatCurrency(client.totalAUM)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#64748b' }}>
                    {client.numberOfAccounts}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#64748b' }}>
                    {formatPercentage(client.feeRate)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                    {formatCurrency(client.calculatedFee)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {getStatusBadge(client.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Generation Modal */}
      <InvoiceGenerationModal
        isOpen={showInvoiceModal}
        onClose={() => setShowInvoiceModal(false)}
        onGenerate={handleInvoiceGeneration}
        mode="bulk"
      />
    </div>
  );
};

export default BillingDashboardPage;
