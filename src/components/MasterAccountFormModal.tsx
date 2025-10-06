import React, { useState, useEffect, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { MasterAccount } from '../types/MasterAccount';

interface Account {
  id: string;
  accountNumber: string;
  accountName: string;
  clientName?: string;
  masterAccountId?: string;
  balance?: number;
}

interface MasterAccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (masterAccount: MasterAccount) => void;
  masterAccount?: MasterAccount | null;
  allAccounts: Account[];
}

const MasterAccountFormModal: React.FC<MasterAccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  masterAccount,
  allAccounts,
}) => {
  const [formData, setFormData] = useState({
    masterAccountNumber: '',
    masterAccountName: '',
    office: '',
    description: '',
    isActive: true,
  });

  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [accountSearchTerm, setAccountSearchTerm] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Filter available accounts (only unassigned or already assigned to this master account)
  const availableAccounts = useMemo(() => {
    return allAccounts.filter(account => {
      if (masterAccount && account.masterAccountId === masterAccount.id) {
        return true; // Include accounts already in this master account
      }
      return !account.masterAccountId; // Only unassigned accounts
    });
  }, [allAccounts, masterAccount]);

  // Filter accounts based on search
  const filteredAccounts = useMemo(() => {
    let accounts = availableAccounts;
    if (accountSearchTerm.trim()) {
      const searchLower = accountSearchTerm.toLowerCase();
      accounts = accounts.filter(account =>
        account.accountName.toLowerCase().includes(searchLower) ||
        account.accountNumber.toLowerCase().includes(searchLower) ||
        account.clientName?.toLowerCase().includes(searchLower)
      );
    }
    return accounts;
  }, [accountSearchTerm, availableAccounts]);

  useEffect(() => {
    if (masterAccount) {
      setFormData({
        masterAccountNumber: masterAccount.masterAccountNumber,
        masterAccountName: masterAccount.masterAccountName,
        office: masterAccount.office || '',
        description: masterAccount.description || '',
        isActive: masterAccount.isActive,
      });
      setSelectedAccountIds(masterAccount.assignedAccountIds || []);
    } else {
      setFormData({
        masterAccountNumber: '',
        masterAccountName: '',
        office: '',
        description: '',
        isActive: true,
      });
      setSelectedAccountIds([]);
    }
    setErrors({});
    setAccountSearchTerm('');
  }, [masterAccount, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.masterAccountNumber.trim()) {
      newErrors.masterAccountNumber = 'Master account number is required';
    }
    if (!formData.masterAccountName.trim()) {
      newErrors.masterAccountName = 'Master account name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const selectedAccounts = allAccounts.filter(a => selectedAccountIds.includes(a.id));
    const totalAUM = selectedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    const savedMasterAccount: MasterAccount = {
      id: masterAccount?.id || `master-${Date.now()}`,
      masterAccountNumber: formData.masterAccountNumber,
      masterAccountName: formData.masterAccountName,
      office: formData.office,
      description: formData.description,
      assignedAccountIds: selectedAccountIds,
      totalAUM,
      numberOfAccounts: selectedAccountIds.length,
      isActive: formData.isActive,
      createdDate: masterAccount?.createdDate || new Date().toISOString().split('T')[0],
      lastModifiedDate: new Date().toISOString().split('T')[0],
    };

    onSave(savedMasterAccount);
    onClose();
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccountIds(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const selectedAccounts = allAccounts.filter(a => selectedAccountIds.includes(a.id));
  const totalAUM = selectedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

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
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          backgroundColor: 'white',
          zIndex: 1,
        }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
              {masterAccount ? 'Edit Master Account' : 'New Master Account'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {masterAccount ? 'Update master account details' : 'Create a new master account'}
            </p>
          </div>
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

        {/* Form Content */}
        <div style={{ padding: '24px' }}>
          {/* Basic Information */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Master Account Number *
              </label>
              <input
                type="text"
                value={formData.masterAccountNumber}
                onChange={(e) => setFormData({ ...formData, masterAccountNumber: e.target.value })}
                placeholder="e.g., MA-001"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.masterAccountNumber ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.masterAccountNumber && (
                <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.masterAccountNumber}
                </span>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Master Account Name *
              </label>
              <input
                type="text"
                value={formData.masterAccountName}
                onChange={(e) => setFormData({ ...formData, masterAccountName: e.target.value })}
                placeholder="e.g., Primary Trading Account"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.masterAccountName ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.masterAccountName && (
                <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>
                  {errors.masterAccountName}
                </span>
              )}
            </div>
          </div>

          {/* Office */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
              Office
            </label>
            <input
              type="text"
              value={formData.office}
              onChange={(e) => setFormData({ ...formData, office: e.target.value })}
              placeholder="e.g., New York, Chicago, San Francisco"
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Active Status */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                Active
              </span>
            </label>
          </div>

          {/* Assign Accounts */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                Assigned Accounts
              </label>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                {selectedAccountIds.length} selected • ${totalAUM.toLocaleString()} total AUM
              </div>
            </div>

            {/* Account Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                }}
              />
              <input
                type="text"
                placeholder="Search accounts..."
                value={accountSearchTerm}
                onChange={(e) => setAccountSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 36px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Account List */}
            <div style={{
              maxHeight: '300px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '8px',
            }}>
              {filteredAccounts.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                  {accountSearchTerm ? 'No accounts found' : 'No available accounts'}
                </div>
              ) : (
                filteredAccounts.map(account => (
                  <label
                    key={account.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      cursor: 'pointer',
                      borderRadius: '6px',
                      marginBottom: '4px',
                      backgroundColor: selectedAccountIds.includes(account.id) ? '#eff6ff' : 'transparent',
                      border: `1px solid ${selectedAccountIds.includes(account.id) ? '#bfdbfe' : 'transparent'}`,
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedAccountIds.includes(account.id)) {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedAccountIds.includes(account.id)) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedAccountIds.includes(account.id)}
                      onChange={() => toggleAccount(account.id)}
                      style={{ marginRight: '12px', cursor: 'pointer' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                        {account.accountName}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        {account.accountNumber} • {account.clientName || 'No client'} • ${(account.balance || 0).toLocaleString()}
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#64748b',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
            }}
          >
            {masterAccount ? 'Save Changes' : 'Create Master Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MasterAccountFormModal;
