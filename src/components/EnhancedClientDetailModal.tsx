import React, { useState, useEffect, useMemo } from 'react';
import { X, User, Mail, Phone, MapPin, DollarSign, Calendar, FileText, Building2, TrendingUp, History } from 'lucide-react';
import { Client } from '../types/Client';
import RelationshipHierarchy from './RelationshipHierarchy';
import RelationshipCard from './RelationshipCard';
import FeeHistoryTable from './FeeHistoryTable';
import { buildClientHierarchy } from '../utils/hierarchyHelpers';
import { HouseholdStatus } from '../types/Household';
import { feeCalculationsService } from '../services/api/feeCalculations.service';
import { useAccountsByClient } from '../hooks/useAccounts';
import { useHouseholds } from '../hooks/useHouseholds';
import { billingPeriodsService } from '../services/api/billingPeriods.service';
import { useFirm } from '../contexts/FirmContext';
import LoadingSkeleton from './LoadingSkeleton';

interface EnhancedClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onEdit?: (client: Client) => void;
}

type TabType = 'overview' | 'accounts' | 'fee-history' | 'documents';

const EnhancedClientDetailModal: React.FC<EnhancedClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [feeHistory, setFeeHistory] = useState<any[]>([]);
  const [loadingFeeHistory, setLoadingFeeHistory] = useState(false);
  const { firmId } = useFirm();

  // Fetch real data
  const { data: accounts = [], isLoading: loadingAccounts } = useAccountsByClient(client.id);
  const { data: allHouseholds = [], isLoading: loadingHouseholds } = useHouseholds();

  // Filter households that include this client
  const relatedHouseholds = useMemo(() => {
    return allHouseholds
      .filter((h) => h.associatedClientIds?.includes(client.id) || h.primaryClientId === client.id)
      .map((h) => ({
        id: h.id,
        name: h.householdName,
        type: 'household' as const,
        count: h.numberOfAccounts || 0,
        aum: h.totalAUM || 0,
        status: h.householdStatus === HouseholdStatus.ACTIVE ? 'Active' : 'Inactive',
      }));
  }, [allHouseholds, client.id]);

  // Transform accounts to the format expected by RelationshipCard
  const relatedAccounts = useMemo(() => {
    return accounts.map((acc) => ({
      id: acc.id,
      name: acc.accountName || acc.accountNumber,
      type: 'account' as const,
      details: `Account #${acc.accountNumber}`,
      aum: acc.currentBalance || 0,
      status: acc.accountStatus === 'Active' ? 'Active' : (acc.accountStatus || 'Active'),
    }));
  }, [accounts]);

  // Fetch fee history
  useEffect(() => {
    if (!isOpen || !client.id) return;

    const loadFeeHistory = async () => {
      setLoadingFeeHistory(true);
      try {
        const response = await feeCalculationsService.getHistory(client.id);
        if (response.data) {
          // Get billing periods to map period names
          const periodsResponse = await billingPeriodsService.getAll(firmId || '');
          const periods = periodsResponse.data || [];
          const periodMap = new Map(periods.map((p) => [p.id, p]));

          // Transform fee calculations to fee history format
          const transformedHistory = response.data.map((calc: any) => {
            // Handle both camelCase (from service) and snake_case (from raw DB) formats
            const billingPeriodId = calc.billingPeriodId || calc.billing_period_id;
            const period = periodMap.get(billingPeriodId);
            return {
              period: period?.periodName || 'Unknown',
              periodStart: period?.startDate ? new Date(period.startDate) : new Date(),
              periodEnd: period?.endDate ? new Date(period.endDate) : new Date(),
              aum: calc.averageAum || calc.average_aum || 0,
              feeSchedule: calc.feeScheduleId || calc.fee_schedule_id || 'N/A',
              feeRate: calc.feeRate || calc.fee_rate || 0,
              calculatedFee: calc.calculatedFee || calc.calculated_fee || 0,
              adjustments: calc.adjustments || 0,
              finalFee: calc.finalFee || calc.final_fee || 0,
              status: (calc.status || 'calculated') as 'paid' | 'pending' | 'invoiced' | 'calculated',
              invoiceNumber: calc.invoiceNumber || calc.invoice_number,
              paidDate: calc.paymentDate ? new Date(calc.paymentDate) : (calc.payment_date ? new Date(calc.payment_date) : undefined),
            };
          });
          setFeeHistory(transformedHistory);
        } else {
          setFeeHistory([]);
        }
      } catch (error) {
        console.error('Error loading fee history:', error);
        setFeeHistory([]);
      } finally {
        setLoadingFeeHistory(false);
      }
    };

    loadFeeHistory();
  }, [isOpen, client.id, firmId]);

  // Build hierarchy from real data (simplified - would need relationships service)
  const hierarchyData = useMemo(() => {
    const household = allHouseholds.find((h) => h.associatedClientIds?.includes(client.id) || h.primaryClientId === client.id);
    return buildClientHierarchy(client, household || undefined, undefined, undefined);
  }, [client, allHouseholds]);

  if (!isOpen) return null;

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date?: Date): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };


  const tabs = [
    { id: 'overview', label: 'Overview', icon: <User size={16} /> },
    { id: 'accounts', label: 'Accounts', icon: <Building2 size={16} /> },
    { id: 'fee-history', label: 'Fee History', icon: <History size={16} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={16} /> },
  ];

  const renderOverview = () => (
    <div>
      {/* Hierarchy */}
      <div style={{ marginBottom: '24px' }}>
        <RelationshipHierarchy
          hierarchy={hierarchyData}
          onNavigate={(id, type) => console.log('Navigate to:', id, type)}
          showLinks={true}
        />
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div style={{ backgroundColor: '#f0f9ff', padding: '16px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: '12px', color: '#0369a1', marginBottom: '4px', fontWeight: '500' }}>
            Total AUM
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c4a6e' }}>
            {formatCurrency(client.totalAUM)}
          </div>
        </div>

        <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: '12px', color: '#15803d', marginBottom: '4px', fontWeight: '500' }}>
            Annual Fees
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#166534' }}>
            {formatCurrency(client.totalAnnualFees)}
          </div>
        </div>

        <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '8px', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px', fontWeight: '500' }}>
            Accounts
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#78350f' }}>
            {client.numberOfAccounts || 0}
          </div>
        </div>

        <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
          <div style={{ fontSize: '12px', color: '#7e22ce', marginBottom: '4px', fontWeight: '500' }}>
            Client Since
          </div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#6b21a8' }}>
            {client.clientSinceDate ? new Date(client.clientSinceDate).getFullYear() : 'N/A'}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', marginBottom: '12px' }}>
          Contact Information
        </h3>
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
          }}
        >
          {client.primaryEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Mail size={18} color="#64748b" />
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Email</div>
                <div style={{ fontSize: '14px', color: '#1a202c', fontWeight: '500' }}>
                  {client.primaryEmail}
                </div>
              </div>
            </div>
          )}

          {client.mobilePhone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Phone size={18} color="#64748b" />
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Mobile</div>
                <div style={{ fontSize: '14px', color: '#1a202c', fontWeight: '500' }}>
                  {client.mobilePhone}
                </div>
              </div>
            </div>
          )}

          {client.primaryAdvisor && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={18} color="#64748b" />
              <div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Primary Advisor</div>
                <div style={{ fontSize: '14px', color: '#1a202c', fontWeight: '500' }}>
                  {client.primaryAdvisor}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fee Schedule Information */}
      {client.defaultFeeScheduleId && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c', marginBottom: '12px' }}>
            Fee Schedule
          </h3>
          <div
            style={{
              backgroundColor: '#f0f9ff',
              border: '1px solid #bae6fd',
              borderRadius: '8px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <DollarSign size={24} color="#2196f3" />
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#0c4a6e' }}>
                Fee Schedule: {client.defaultFeeScheduleId}
              </div>
              <div style={{ fontSize: '13px', color: '#0369a1', marginTop: '4px' }}>
                Billing: {client.billingFrequency} via {client.billingMethod}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Related Entities */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {loadingAccounts ? (
          <LoadingSkeleton type="card" />
        ) : (
          <RelationshipCard
            title="Accounts"
            entities={relatedAccounts}
            onViewEntity={(id, type) => console.log('View account:', id)}
            maxDisplay={3}
          />
        )}

        {loadingHouseholds ? (
          <LoadingSkeleton type="card" />
        ) : (
          <RelationshipCard
            title="Households"
            entities={relatedHouseholds}
            onViewEntity={(id, type) => console.log('View household:', id)}
            maxDisplay={3}
          />
        )}
      </div>
    </div>
  );

  const renderAccounts = () => {
    if (loadingAccounts) {
      return <LoadingSkeleton type="table" />;
    }

    if (relatedAccounts.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No accounts found</p>
          <p style={{ fontSize: '14px' }}>This client has no associated accounts</p>
        </div>
      );
    }

    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1a202c', marginBottom: '16px' }}>
          Account Details
        </h3>
        <RelationshipCard
          title="All Accounts"
          entities={relatedAccounts}
          onViewEntity={(id, type) => console.log('View account:', id)}
          maxDisplay={10}
        />
      </div>
    );
  };

  const renderFeeHistory = () => {
    if (loadingFeeHistory) {
      return <LoadingSkeleton type="table" />;
    }

    if (feeHistory.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <History size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <p style={{ fontSize: '16px', marginBottom: '8px' }}>No fee history available</p>
          <p style={{ fontSize: '14px' }}>Fee calculations will appear here once billing periods are processed</p>
        </div>
      );
    }

    return (
      <div>
        <FeeHistoryTable
          clientId={client.id}
          clientName={client.fullLegalName}
          feeHistory={feeHistory}
        />
      </div>
    );
  };

  const renderDocuments = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
      <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
      <p style={{ fontSize: '16px', marginBottom: '8px' }}>No documents available</p>
      <p style={{ fontSize: '14px' }}>Client documents will appear here</p>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '1200px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '8px',
                  backgroundColor: '#eff6ff',
                  color: '#2196f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
                  {client.fullLegalName}
                </h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      backgroundColor: client.clientStatus === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: client.clientStatus === 'Active' ? '#166534' : '#991b1b',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}
                  >
                    {client.clientStatus}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {client.entityType}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {onEdit && (
              <button
                onClick={() => onEdit(client)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2196f3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={20} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          padding: '0 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          gap: '8px',
          backgroundColor: 'white',
          position: 'sticky',
          top: '96px',
          zIndex: 1,
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? '600' : '400',
                color: activeTab === tab.id ? '#2196f3' : '#64748b',
                borderBottom: activeTab === tab.id ? '2px solid #2196f3' : '2px solid transparent',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'accounts' && renderAccounts()}
          {activeTab === 'fee-history' && renderFeeHistory()}
          {activeTab === 'documents' && renderDocuments()}
        </div>
      </div>
    </div>
  );
};

export default EnhancedClientDetailModal;

