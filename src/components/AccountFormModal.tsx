import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, AlertCircle, CheckCircle, DollarSign, Calendar, Users, Home } from 'lucide-react';
import {
  Account,
  AccountFormData,
  AccountType,
  AccountStatus,
  ReconciliationStatus
} from '../types/Account';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: AccountFormData) => void;
  account?: Account | null;
  availableClients?: { id: string; name: string }[];
  availableHouseholds?: { id: string; name: string }[];
  availableFeeSchedules?: { id: string; name: string }[];
  availableMasterAccounts?: { id: string; masterAccountNumber: string; masterAccountName: string }[];
}

const AccountFormModal: React.FC<AccountFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  account,
  availableClients = [],
  availableHouseholds = [],
  availableFeeSchedules = [],
  availableMasterAccounts = []
}) => {
  const [formData, setFormData] = useState<AccountFormData>({
    accountNumber: '',
    accountName: '',
    accountType: AccountType.INDIVIDUAL,
    accountStatus: AccountStatus.ACTIVE,
    reconciliationStatus: ReconciliationStatus.MATCHED,
    isExcludedFromBilling: false,
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'relationships' | 'billing' | 'notes'>('basic');
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [householdSearchTerm, setHouseholdSearchTerm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      setFormData({
        id: account.id,
        accountNumber: account.accountNumber,
        accountName: account.accountName,
        accountType: account.accountType,
        accountStatus: account.accountStatus,
        clientId: account.clientId,
        clientName: account.clientName,
        householdId: account.householdId,
        householdName: account.householdName,
        masterAccountId: account.masterAccountId,
        custodianAccountId: account.custodianAccountId,
        registrationName: account.registrationName,
        taxId: account.taxId,
        openDate: account.openDate,
        closeDate: account.closeDate,
        feeScheduleId: account.feeScheduleId,
        feeScheduleName: account.feeScheduleName,
        customFeeRate: account.customFeeRate,
        feeExclusions: account.feeExclusions,
        minimumFee: account.minimumFee,
        currentBalance: account.currentBalance,
        lastImportDate: account.lastImportDate,
        lastStatementDate: account.lastStatementDate,
        reconciliationStatus: account.reconciliationStatus,
        lastReconciledDate: account.lastReconciledDate,
        reconciliationNotes: account.reconciliationNotes,
        notes: account.notes,
        isExcludedFromBilling: account.isExcludedFromBilling,
        billingOverride: account.billingOverride,
      });
    } else {
      // Reset form for new account
      setFormData({
        accountNumber: '',
        accountName: '',
        accountType: AccountType.INDIVIDUAL,
        accountStatus: AccountStatus.ACTIVE,
        reconciliationStatus: ReconciliationStatus.MATCHED,
        isExcludedFromBilling: false,
      });
      setActiveTab('basic');
    }
    setErrors({});
    setClientSearchTerm('');
    setHouseholdSearchTerm('');
  }, [account, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }
    if (!formData.accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    }
    if (!formData.registrationName?.trim()) {
      newErrors.registrationName = 'Registration name is required';
    }
    if (formData.taxId && !/^\d{2}-\d{7}$/.test(formData.taxId) && !/^\d{3}-\d{2}-\d{4}$/.test(formData.taxId)) {
      newErrors.taxId = 'Tax ID must be in format XX-XXXXXXX (EIN) or XXX-XX-XXXX (SSN)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const updateField = (field: keyof AccountFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = availableClients.find(c => c.id === clientId);
    updateField('clientId', clientId);
    updateField('clientName', selectedClient?.name);
    setClientSearchTerm('');
  };

  const handleHouseholdSelect = (householdId: string) => {
    const selectedHousehold = availableHouseholds.find(h => h.id === householdId);
    updateField('householdId', householdId);
    updateField('householdName', selectedHousehold?.name);
    setHouseholdSearchTerm('');
  };

  const handleFeeScheduleSelect = (feeScheduleId: string) => {
    const selectedSchedule = availableFeeSchedules.find(fs => fs.id === feeScheduleId);
    updateField('feeScheduleId', feeScheduleId);
    updateField('feeScheduleName', selectedSchedule?.name);
  };

  const handleMasterAccountSelect = (masterAccountId: string) => {
    const selectedMasterAccount = availableMasterAccounts.find(ma => ma.id === masterAccountId);
    updateField('masterAccountId', masterAccountId);
  };

  const filteredClients = useMemo(() => {
    if (!clientSearchTerm) return availableClients.slice(0, 10);
    return availableClients.filter(c =>
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [availableClients, clientSearchTerm]);

  const filteredHouseholds = useMemo(() => {
    if (!householdSearchTerm) return availableHouseholds.slice(0, 10);
    return availableHouseholds.filter(h =>
      h.name.toLowerCase().includes(householdSearchTerm.toLowerCase())
    ).slice(0, 10);
  }, [availableHouseholds, householdSearchTerm]);

  if (!isOpen) return null;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px'
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '6px'
  };

  const errorStyle: React.CSSProperties = {
    color: '#f44336',
    fontSize: '12px',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const renderBasicInfo = () => (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign size={18} />
        Basic Account Information
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>
            Account Number <span style={{ color: '#f44336' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => updateField('accountNumber', e.target.value)}
            placeholder="e.g., ACC-12345"
            style={{
              ...inputStyle,
              borderColor: errors.accountNumber ? '#f44336' : '#ddd'
            }}
          />
          {errors.accountNumber && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              {errors.accountNumber}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Account Name <span style={{ color: '#f44336' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.accountName}
            onChange={(e) => updateField('accountName', e.target.value)}
            placeholder="e.g., John Smith IRA"
            style={{
              ...inputStyle,
              borderColor: errors.accountName ? '#f44336' : '#ddd'
            }}
          />
          {errors.accountName && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              {errors.accountName}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Account Type <span style={{ color: '#f44336' }}>*</span>
          </label>
          <select
            value={formData.accountType}
            onChange={(e) => updateField('accountType', e.target.value as AccountType)}
            style={inputStyle}
          >
            {Object.values(AccountType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Account Status <span style={{ color: '#f44336' }}>*</span>
          </label>
          <select
            value={formData.accountStatus}
            onChange={(e) => updateField('accountStatus', e.target.value as AccountStatus)}
            style={inputStyle}
          >
            {Object.values(AccountStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Registration Name <span style={{ color: '#f44336' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.registrationName || ''}
            onChange={(e) => updateField('registrationName', e.target.value)}
            placeholder="Legal registration name"
            style={{
              ...inputStyle,
              borderColor: errors.registrationName ? '#f44336' : '#ddd'
            }}
          />
          {errors.registrationName && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              {errors.registrationName}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Tax ID
          </label>
          <input
            type="text"
            value={formData.taxId || ''}
            onChange={(e) => updateField('taxId', e.target.value)}
            placeholder="XX-XXXXXXX or XXX-XX-XXXX"
            style={{
              ...inputStyle,
              borderColor: errors.taxId ? '#f44336' : '#ddd'
            }}
          />
          {errors.taxId && (
            <div style={errorStyle}>
              <AlertCircle size={14} />
              {errors.taxId}
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>
            Custodian Account ID
          </label>
          <input
            type="text"
            value={formData.custodianAccountId || ''}
            onChange={(e) => updateField('custodianAccountId', e.target.value)}
            placeholder="Custodian's account number"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            Open Date
          </label>
          <input
            type="date"
            value={formData.openDate ? new Date(formData.openDate).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('openDate', e.target.value ? new Date(e.target.value) : undefined)}
            style={inputStyle}
          />
        </div>

        {formData.accountStatus === AccountStatus.CLOSED && (
          <div>
            <label style={labelStyle}>
              Close Date
            </label>
            <input
              type="date"
              value={formData.closeDate ? new Date(formData.closeDate).toISOString().split('T')[0] : ''}
              onChange={(e) => updateField('closeDate', e.target.value ? new Date(e.target.value) : undefined)}
              style={inputStyle}
            />
          </div>
        )}

        <div>
          <label style={labelStyle}>
            Current Balance
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.currentBalance || ''}
            onChange={(e) => updateField('currentBalance', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="0.00"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  const renderRelationships = () => (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={18} />
        Client & Household Relationships
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
        {/* Client Assignment */}
        <div>
          <label style={labelStyle}>
            Assigned Client
          </label>
          {formData.clientId ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#e8f5e9',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="#2e7d32" />
                <span style={{ fontWeight: 'bold', color: '#2e7d32' }}>{formData.clientName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateField('clientId', undefined);
                  updateField('clientName', undefined);
                }}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #2e7d32',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#2e7d32',
                  fontWeight: 'bold'
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }} />
                <input
                  type="text"
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  placeholder="Search clients..."
                  style={{
                    ...inputStyle,
                    paddingLeft: '40px'
                  }}
                />
              </div>
              {(clientSearchTerm || filteredClients.length > 0) && (
                <div style={{
                  marginTop: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: 'white'
                }}>
                  {filteredClients.length > 0 ? (
                    filteredClients.map(client => (
                      <div
                        key={client.id}
                        onClick={() => handleClientSelect(client.id)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <Users size={14} color="#666" />
                        <span style={{ fontSize: '14px' }}>{client.name}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
                      No clients found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Household Assignment */}
        <div>
          <label style={labelStyle}>
            Assigned Household
          </label>
          {formData.householdId ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#e3f2fd',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Home size={16} color="#1976d2" />
                <span style={{ fontWeight: 'bold', color: '#1976d2' }}>{formData.householdName}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  updateField('householdId', undefined);
                  updateField('householdName', undefined);
                }}
                style={{
                  padding: '4px 12px',
                  backgroundColor: 'white',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  color: '#1976d2',
                  fontWeight: 'bold'
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#999'
                }} />
                <input
                  type="text"
                  value={householdSearchTerm}
                  onChange={(e) => setHouseholdSearchTerm(e.target.value)}
                  placeholder="Search households..."
                  style={{
                    ...inputStyle,
                    paddingLeft: '40px'
                  }}
                />
              </div>
              {(householdSearchTerm || filteredHouseholds.length > 0) && (
                <div style={{
                  marginTop: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  backgroundColor: 'white'
                }}>
                  {filteredHouseholds.length > 0 ? (
                    filteredHouseholds.map(household => (
                      <div
                        key={household.id}
                        onClick={() => handleHouseholdSelect(household.id)}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        <Home size={14} color="#666" />
                        <span style={{ fontSize: '14px' }}>{household.name}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
                      No households found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Master Account Assignment */}
        <div>
          <label style={labelStyle}>
            Master Account (Optional)
          </label>
          <select
            value={formData.masterAccountId || ''}
            onChange={(e) => handleMasterAccountSelect(e.target.value)}
            style={inputStyle}
          >
            <option value="">No master account</option>
            {availableMasterAccounts.map(ma => (
              <option key={ma.id} value={ma.id}>
                {ma.masterAccountNumber} - {ma.masterAccountName}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderBilling = () => (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <DollarSign size={18} />
        Billing & Fee Configuration
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label style={labelStyle}>
            Fee Schedule
          </label>
          <select
            value={formData.feeScheduleId || ''}
            onChange={(e) => handleFeeScheduleSelect(e.target.value)}
            style={inputStyle}
          >
            <option value="">Use client default</option>
            {availableFeeSchedules.map(fs => (
              <option key={fs.id} value={fs.id}>{fs.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>
            Custom Fee Rate (%)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.customFeeRate || ''}
            onChange={(e) => updateField('customFeeRate', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Override fee rate"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>
            Minimum Fee ($)
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.minimumFee || ''}
            onChange={(e) => updateField('minimumFee', e.target.value ? parseFloat(e.target.value) : undefined)}
            placeholder="Minimum quarterly fee"
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '28px' }}>
          <input
            type="checkbox"
            id="excludeFromBilling"
            checked={formData.isExcludedFromBilling}
            onChange={(e) => updateField('isExcludedFromBilling', e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <label htmlFor="excludeFromBilling" style={{ fontSize: '14px', cursor: 'pointer', fontWeight: 'bold' }}>
            Exclude from Billing
          </label>
        </div>
      </div>

      {formData.isExcludedFromBilling && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e65100', fontSize: '14px' }}>
            <AlertCircle size={16} />
            <span style={{ fontWeight: 'bold' }}>This account will not be included in fee calculations.</span>
          </div>
        </div>
      )}

      <div>
        <label style={labelStyle}>
          Billing Override Notes
        </label>
        <textarea
          value={formData.billingOverride || ''}
          onChange={(e) => updateField('billingOverride', e.target.value)}
          placeholder="Special billing instructions or overrides..."
          rows={3}
          style={{
            ...inputStyle,
            resize: 'vertical'
          }}
        />
      </div>
    </div>
  );

  const renderNotes = () => (
    <div>
      <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Calendar size={18} />
        Notes & Reconciliation
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          Reconciliation Status
        </label>
        <select
          value={formData.reconciliationStatus}
          onChange={(e) => updateField('reconciliationStatus', e.target.value as ReconciliationStatus)}
          style={inputStyle}
        >
          {Object.values(ReconciliationStatus).map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={labelStyle}>
          Reconciliation Notes
        </label>
        <textarea
          value={formData.reconciliationNotes || ''}
          onChange={(e) => updateField('reconciliationNotes', e.target.value)}
          placeholder="Notes about account reconciliation..."
          rows={3}
          style={{
            ...inputStyle,
            resize: 'vertical'
          }}
        />
      </div>

      <div>
        <label style={labelStyle}>
          General Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder="Additional notes about this account..."
          rows={4}
          style={{
            ...inputStyle,
            resize: 'vertical'
          }}
        />
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#666'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {formData.lastImportDate && (
            <div>
              <strong>Last Import:</strong> {new Date(formData.lastImportDate).toLocaleDateString()}
            </div>
          )}
          {formData.lastReconciledDate && (
            <div>
              <strong>Last Reconciled:</strong> {new Date(formData.lastReconciledDate).toLocaleDateString()}
            </div>
          )}
          {formData.lastStatementDate && (
            <div>
              <strong>Last Statement:</strong> {new Date(formData.lastStatementDate).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

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
        width: '900px',
        maxWidth: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {account ? 'Edit Account' : 'Add New Account'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          borderBottom: '2px solid #f0f0f0',
          backgroundColor: '#fafafa',
          padding: '0 24px'
        }}>
          {[
            { id: 'basic' as const, label: 'Basic Info', icon: <DollarSign size={16} /> },
            { id: 'relationships' as const, label: 'Relationships', icon: <Users size={16} /> },
            { id: 'billing' as const, label: 'Billing', icon: <DollarSign size={16} /> },
            { id: 'notes' as const, label: 'Notes', icon: <Calendar size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '14px 20px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                color: activeTab === tab.id ? '#2196f3' : '#666',
                borderBottom: activeTab === tab.id ? '3px solid #2196f3' : '3px solid transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1
          }}>
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'relationships' && renderRelationships()}
            {activeTab === 'billing' && renderBilling()}
            {activeTab === 'notes' && renderNotes()}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#fafafa'
          }}>
            <div style={{ fontSize: '12px', color: '#666' }}>
              <span style={{ color: '#f44336' }}>*</span> Required fields
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #ddd',
                  backgroundColor: 'white',
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
                  backgroundColor: '#2196f3',
                  color: 'white',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <CheckCircle size={16} />
                {account ? 'Save Changes' : 'Create Account'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountFormModal;
