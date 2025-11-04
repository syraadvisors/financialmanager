import React, { useState, useEffect, useMemo } from 'react';
import { X, Home, Search, AlertCircle, CheckSquare, Square, DollarSign, Building2 } from 'lucide-react';
import { Household, HouseholdFormData, HouseholdStatus, BillingAggregationLevel } from '../types/Household';
import { Account } from '../types/Account';

interface HouseholdFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (household: HouseholdFormData) => void;
  household: Household | null;
  existingHouseholds: Household[]; // All households to check for account conflicts
  availableAccounts: Account[]; // Real accounts from database
}

const HouseholdFormModal: React.FC<HouseholdFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  household,
  existingHouseholds,
  availableAccounts
}) => {
  // Use real accounts passed as prop instead of mock data
  const mockAccounts: Account[] = availableAccounts || [
    {
      id: '1',
      firmId: 'mock-firm-id',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-12345',
      accountName: 'John Smith Individual',
      accountType: 'Individual' as any,
      accountStatus: 'Active' as any,
      clientId: '1',
      clientName: 'John Smith',
      householdId: 'HH-001',
      householdName: 'Smith Family',
      currentBalance: 1250000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '2',
      firmId: 'mock-firm-id',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-12346',
      accountName: 'John Smith IRA',
      accountType: 'IRA Traditional' as any,
      accountStatus: 'Active' as any,
      clientId: '1',
      clientName: 'John Smith',
      householdId: 'HH-001',
      householdName: 'Smith Family',
      currentBalance: 750000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '3',
      firmId: 'mock-firm-id',
      createdAt: new Date('2023-06-10'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-11111',
      accountName: 'Smith Family Trust',
      accountType: 'Trust' as any,
      accountStatus: 'Active' as any,
      clientId: '2',
      clientName: 'Smith Family Trust',
      householdId: 'HH-001',
      householdName: 'Smith Family',
      currentBalance: 5800000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '4',
      firmId: 'mock-firm-id',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-22222',
      accountName: 'Tech Startup LLC Operating',
      accountType: 'LLC' as any,
      accountStatus: 'Active' as any,
      clientId: '3',
      clientName: 'Tech Startup LLC',
      householdId: 'HH-002',
      householdName: 'Tech Startup LLC',
      currentBalance: 1200000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '5',
      firmId: 'mock-firm-id',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-22223',
      accountName: 'Tech Startup LLC Investment',
      accountType: 'Corporate' as any,
      accountStatus: 'Active' as any,
      clientId: '3',
      clientName: 'Tech Startup LLC',
      householdId: 'HH-002',
      householdName: 'Tech Startup LLC',
      currentBalance: 450000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '6',
      firmId: 'mock-firm-id',
      createdAt: new Date('2021-06-15'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-33333',
      accountName: 'Robert Johnson Individual',
      accountType: 'Individual' as any,
      accountStatus: 'Active' as any,
      clientId: '4',
      clientName: 'Robert Johnson',
      householdId: 'HH-003',
      householdName: 'Johnson Family',
      currentBalance: 2100000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '7',
      firmId: 'mock-firm-id',
      createdAt: new Date('2021-06-15'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-33334',
      accountName: 'Mary Johnson IRA',
      accountType: 'IRA Roth' as any,
      accountStatus: 'Active' as any,
      clientId: '5',
      clientName: 'Mary Johnson',
      householdId: 'HH-003',
      householdName: 'Johnson Family',
      currentBalance: 1400000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '8',
      firmId: 'mock-firm-id',
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-44444',
      accountName: 'Jane Doe Individual',
      accountType: 'Individual' as any,
      accountStatus: 'Active' as any,
      clientId: '7',
      clientName: 'Jane Doe',
      householdId: undefined,
      currentBalance: 890000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    },
    {
      id: '9',
      firmId: 'mock-firm-id',
      createdAt: new Date('2024-09-01'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-44445',
      accountName: 'Jane Doe Roth IRA',
      accountType: 'IRA Roth' as any,
      accountStatus: 'Active' as any,
      clientId: '7',
      clientName: 'Jane Doe',
      householdId: undefined,
      currentBalance: 325000,
      reconciliationStatus: 'Matched' as any,
      isExcludedFromBilling: false
    }
  ];

  // Mock clients for primary contact selection
  const mockClients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Smith Family Trust' },
    { id: '3', name: 'Tech Startup LLC' },
    { id: '4', name: 'Robert Johnson' },
    { id: '5', name: 'Mary Johnson' }
  ];

  // Mock relationships for selection
  // Filter out relationships that already have this household (unless we're editing and it's our relationship)
  const mockRelationships = [
    { id: 'REL-001', name: 'Johnson Extended Family', householdIds: ['HH-003'] },
    { id: 'REL-002', name: 'Smith Multi-Gen Trust', householdIds: [] }
  ];

  // Filter relationships - only show available ones
  const availableRelationships = useMemo(() => {
    return mockRelationships.filter(rel => {
      // If editing and this is the current relationship, include it
      if (household?.relationshipId === rel.id) {
        return true;
      }
      // Otherwise check if relationship has room (in future, you might limit number of households per relationship)
      // For now, just return all
      return true;
    });
  }, [household]);

  // Mock fee schedules
  const mockFeeSchedules = [
    { id: 'FS-001', name: 'Standard Tiered' },
    { id: 'FS-002', name: 'Premium Flat' },
    { id: 'FS-003', name: 'Corporate Standard' }
  ];

  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [formData, setFormData] = useState<HouseholdFormData>({
    householdName: '',
    householdStatus: HouseholdStatus.ACTIVE,
    memberAccountIds: [],
    billingAggregationLevel: BillingAggregationLevel.HOUSEHOLD,
    primaryClientId: undefined,
    relationshipId: undefined,
    feeScheduleId: undefined,
    customFeeAdjustment: undefined,
    notes: '',
    establishedDate: new Date()
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (household) {
      setFormData({
        id: household.id,
        householdName: household.householdName,
        householdStatus: household.householdStatus,
        memberAccountIds: household.memberAccountIds,
        billingAggregationLevel: household.billingAggregationLevel,
        primaryClientId: household.primaryClientId,
        relationshipId: household.relationshipId,
        feeScheduleId: household.feeScheduleId,
        customFeeAdjustment: household.customFeeAdjustment,
        notes: household.notes || '',
        establishedDate: household.establishedDate
      });
    } else {
      setFormData({
        householdName: '',
        householdStatus: HouseholdStatus.ACTIVE,
        memberAccountIds: [],
        billingAggregationLevel: BillingAggregationLevel.HOUSEHOLD,
        primaryClientId: undefined,
        relationshipId: undefined,
        feeScheduleId: undefined,
        customFeeAdjustment: undefined,
        notes: '',
        establishedDate: new Date()
      });
    }
    setErrors({});
    setAccountSearchTerm('');
  }, [household, isOpen]);

  const handleChange = (field: keyof HouseholdFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleAccountToggle = (accountId: string) => {
    const currentAccounts = [...formData.memberAccountIds];
    const index = currentAccounts.indexOf(accountId);

    if (index > -1) {
      currentAccounts.splice(index, 1);
    } else {
      currentAccounts.push(accountId);
    }

    handleChange('memberAccountIds', currentAccounts);
  };

  // Filter accounts to only show available ones (not in other households)
  // When editing, include accounts from the current household
  const filteredAvailableAccounts = useMemo(() => {
    return mockAccounts.filter(account => {
      // If editing this household, include its own accounts
      if (household && account.householdId === household.id) {
        return true;
      }
      // Otherwise, only include accounts without a household
      return !account.householdId;
    });
  }, [household, mockAccounts]);

  // Get unique clients from selected accounts
  const associatedClients = useMemo(() => {
    const selectedAccounts = filteredAvailableAccounts.filter(acc => formData.memberAccountIds.includes(acc.id));
    const clientIds = new Set(selectedAccounts.map(acc => acc.clientId).filter(Boolean));
    return mockClients.filter(client => clientIds.has(client.id));
  }, [formData.memberAccountIds, filteredAvailableAccounts, mockClients]);

  // Filter accounts based on search (only from available accounts)
  const filteredAccounts = useMemo(() => {
    let accounts = filteredAvailableAccounts;

    if (accountSearchTerm.trim()) {
      const searchLower = accountSearchTerm.toLowerCase();
      accounts = accounts.filter(account =>
        account.accountName.toLowerCase().includes(searchLower) ||
        account.accountNumber.toLowerCase().includes(searchLower) ||
        account.clientName?.toLowerCase().includes(searchLower)
      );
    }

    return accounts;
  }, [accountSearchTerm, filteredAvailableAccounts]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.householdName.trim()) {
      newErrors.householdName = 'Household name is required';
    }

    if (formData.memberAccountIds.length === 0) {
      newErrors.memberAccountIds = 'At least one account is required';
    }

    if (associatedClients.length > 0 && !formData.primaryClientId) {
      newErrors.primaryClientId = 'Primary contact must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      onSave(formData);
    }
  };

  const handleSelectAll = () => {
    const allAccountIds = filteredAccounts.map(acc => acc.id);
    handleChange('memberAccountIds', allAccountIds);
  };

  const handleDeselectAll = () => {
    handleChange('memberAccountIds', []);
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total AUM from selected accounts
  const totalAUM = useMemo(() => {
    return filteredAvailableAccounts
      .filter(acc => formData.memberAccountIds.includes(acc.id))
      .reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);
  }, [formData.memberAccountIds, filteredAvailableAccounts]);

  if (!isOpen) return null;

  return (
    <div style={{
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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        width: '800px',
        maxWidth: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Home size={20} color="#6f42c1" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {household ? 'Edit Household' : 'Add New Household'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            {/* Basic Information */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                Basic Information
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  Household Name *
                </label>
                <input
                  type="text"
                  value={formData.householdName}
                  onChange={(e) => handleChange('householdName', e.target.value)}
                  placeholder="e.g., Smith Family, Johnson Trust"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${errors.householdName ? '#f44336' : '#ddd'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.householdName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f44336', fontSize: '12px' }}>
                    <AlertCircle size={14} />
                    {errors.householdName}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Status
                  </label>
                  <select
                    value={formData.householdStatus}
                    onChange={(e) => handleChange('householdStatus', e.target.value as HouseholdStatus)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value={HouseholdStatus.ACTIVE}>Active</option>
                    <option value={HouseholdStatus.INACTIVE}>Inactive</option>
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Established Date
                  </label>
                  <input
                    type="date"
                    value={formData.establishedDate ? new Date(formData.establishedDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleChange('establishedDate', e.target.value ? new Date(e.target.value) : undefined)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Member Accounts */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  Household Accounts *
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #2196f3',
                      color: '#2196f3',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #999',
                      color: '#999',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
                Search and select accounts to include in this household. Only accounts not already in other households are shown.
              </p>

              {/* Availability Info */}
              {mockAccounts.length > filteredAvailableAccounts.length && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffb74d',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: '#e65100'
                }}>
                  <strong>Note:</strong> {mockAccounts.length - filteredAvailableAccounts.length} account{mockAccounts.length - filteredAvailableAccounts.length !== 1 ? 's are' : ' is'} already assigned to other households and cannot be selected.
                </div>
              )}

              {/* Search Bar */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }} />
                <input
                  type="text"
                  placeholder="Search by account name, number, or client..."
                  value={accountSearchTerm}
                  onChange={(e) => setAccountSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* Selected Count and Total */}
              {formData.memberAccountIds.length > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={16} color="#1565c0" />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1565c0' }}>
                      {formData.memberAccountIds.length} account{formData.memberAccountIds.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="#1565c0" />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1565c0' }}>
                      Total: {formatCurrency(totalAUM)}
                    </span>
                  </div>
                </div>
              )}

              {/* Account List */}
              <div style={{
                border: `1px solid ${errors.memberAccountIds ? '#f44336' : '#e0e0e0'}`,
                borderRadius: '6px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {filteredAccounts.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>No accounts found matching "{accountSearchTerm}"</p>
                  </div>
                ) : (
                  filteredAccounts.map(account => {
                    const isSelected = formData.memberAccountIds.includes(account.id);
                    return (
                      <label
                        key={account.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: isSelected ? '#f3e8ff' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected ? (
                            <CheckSquare size={20} color="#6f42c1" style={{ cursor: 'pointer' }} onClick={() => handleAccountToggle(account.id)} />
                          ) : (
                            <Square size={20} color="#999" style={{ cursor: 'pointer' }} onClick={() => handleAccountToggle(account.id)} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {account.accountName}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#666'
                            }}>
                              {account.accountType}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: '#666' }}>
                            <span>{account.accountNumber}</span>
                            <span>•</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Building2 size={12} />
                              {account.clientName}
                            </div>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {formatCurrency(account.currentBalance)}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>

              {errors.memberAccountIds && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', color: '#f44336', fontSize: '12px' }}>
                  <AlertCircle size={14} />
                  {errors.memberAccountIds}
                </div>
              )}
            </div>

            {/* Primary Contact */}
            {associatedClients.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  Primary Contact *
                </label>
                <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                  Clients associated with selected accounts: {associatedClients.map(c => c.name).join(', ')}
                </p>
                <select
                  value={formData.primaryClientId || ''}
                  onChange={(e) => handleChange('primaryClientId', e.target.value || undefined)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${errors.primaryClientId ? '#f44336' : '#ddd'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select primary contact...</option>
                  {associatedClients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
                {errors.primaryClientId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f44336', fontSize: '12px' }}>
                    <AlertCircle size={14} />
                    {errors.primaryClientId}
                  </div>
                )}
              </div>
            )}

            {/* Fee Configuration */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                Fee Configuration
              </h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: '#333'
                }}>
                  Billing Aggregation Level
                </label>
                <select
                  value={formData.billingAggregationLevel}
                  onChange={(e) => handleChange('billingAggregationLevel', e.target.value as BillingAggregationLevel)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  <option value={BillingAggregationLevel.ACCOUNT}>Account-Level (Bill each account separately)</option>
                  <option value={BillingAggregationLevel.HOUSEHOLD}>Household (Aggregate all household accounts)</option>
                  <option value={BillingAggregationLevel.RELATIONSHIP}>Relationship (Aggregate at relationship level)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Fee Schedule
                  </label>
                  <select
                    value={formData.feeScheduleId || ''}
                    onChange={(e) => handleChange('feeScheduleId', e.target.value || undefined)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Default (from client)</option>
                    {mockFeeSchedules.map(schedule => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                    color: '#333'
                  }}>
                    Fee Adjustment (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.customFeeAdjustment || ''}
                    onChange={(e) => handleChange('customFeeAdjustment', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="0.00"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Relationship Assignment */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#333'
              }}>
                Relationship (Optional)
              </label>
              <select
                value={formData.relationshipId || ''}
                onChange={(e) => handleChange('relationshipId', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">None</option>
                {availableRelationships.map(rel => (
                  <option key={rel.id} value={rel.id}>
                    {rel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#333'
              }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Additional notes about this household..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 24px',
                border: '1px solid #ddd',
                background: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                color: '#666'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#2196f3',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {household ? 'Save Changes' : 'Create Household'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HouseholdFormModal;
