import React, { useState } from 'react';
import { X, User, Mail, Phone, MapPin, DollarSign, Calendar, FileText, Building2 } from 'lucide-react';
import { Client } from '../types/Client';
import RelationshipHierarchy, { HierarchyNode } from './RelationshipHierarchy';
import RelationshipCard from './RelationshipCard';

interface ClientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: Client;
  onEdit?: (client: Client) => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  isOpen,
  onClose,
  client,
  onEdit,
}) => {
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

  // Mock hierarchy data - in real app, this would come from props or API
  const hierarchyData: HierarchyNode[] = [
    {
      id: 'rel-1',
      name: 'Smith Family Relationship',
      type: 'relationship',
      count: 12,
      aum: 15000000,
      status: 'Active',
    },
    {
      id: 'ma-1',
      name: 'Master Account 1001',
      type: 'master_account',
      count: 8,
      aum: 10000000,
      status: 'Active',
    },
    {
      id: 'hh-1',
      name: 'Smith Household',
      type: 'household',
      count: 5,
      aum: 7500000,
      status: 'Active',
    },
    {
      id: client.id,
      name: client.fullLegalName,
      type: 'client',
      count: client.numberOfAccounts,
      aum: client.totalAUM,
      status: client.clientStatus,
    },
  ];

  // Mock related accounts
  const relatedAccounts = [
    {
      id: 'acc-1',
      name: 'Individual Brokerage',
      type: 'account' as const,
      details: 'Account #1234',
      aum: 1500000,
      status: 'Active',
    },
    {
      id: 'acc-2',
      name: 'IRA Traditional',
      type: 'account' as const,
      details: 'Account #1235',
      aum: 750000,
      status: 'Active',
    },
    {
      id: 'acc-3',
      name: 'Joint Account',
      type: 'account' as const,
      details: 'Account #1236',
      aum: 250000,
      status: 'Active',
    },
  ];

  // Mock related households
  const relatedHouseholds = [
    {
      id: 'hh-1',
      name: 'Smith Household',
      type: 'household' as const,
      count: 5,
      aum: 7500000,
      status: 'Active',
    },
  ];

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
          maxWidth: '1000px',
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

        {/* Content */}
        <div style={{ padding: '24px' }}>
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

          {/* Related Entities */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <RelationshipCard
              title="Accounts"
              entities={relatedAccounts}
              onViewEntity={(id, type) => console.log('View account:', id)}
              maxDisplay={3}
            />

            <RelationshipCard
              title="Households"
              entities={relatedHouseholds}
              onViewEntity={(id, type) => console.log('View household:', id)}
              maxDisplay={3}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
