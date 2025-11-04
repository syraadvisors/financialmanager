import React, { useState, useEffect } from 'react';
import { X, Users, Home, Building2, AlertCircle, Search, Link2, ExternalLink } from 'lucide-react';
import {
  Client,
  ClientFormData,
  TaxIdType,
  EntityType,
  ClientStatus,
  BillingFrequency,
  BillingMethod,
  PreferredContactMethod,
  RiskTolerance,
  Address
} from '../types/Client';
import { Account, AccountType } from '../types/Account';
import { accountsService } from '../services/api/accounts.service';
import { useAuth } from '../contexts/AuthContext';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: ClientFormData) => void;
  client?: Client | null;
}

const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  client
}) => {
  const { userProfile } = useAuth();
  const [formData, setFormData] = useState<ClientFormData>({
    fullLegalName: '',
    taxIdType: TaxIdType.SSN,
    taxIdNumber: '',
    entityType: EntityType.INDIVIDUAL,
    clientStatus: ClientStatus.ACTIVE,
    billingFrequency: BillingFrequency.QUARTERLY,
    billingMethod: BillingMethod.DEBIT_FROM_ACCOUNT,
    doNotContact: false,
    doNotEmail: false,
    doNotCall: false,
  });

  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'accounts'>('basic');
  const [unassignedAccounts, setUnassignedAccounts] = useState<Account[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<Account[]>([]);
  const [accountSearch, setAccountSearch] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData({
        id: client.id,
        fullLegalName: client.fullLegalName,
        taxIdType: client.taxIdType,
        taxIdNumber: client.taxIdNumber,
        dateOfBirth: client.dateOfBirth,
        entityType: client.entityType,
        primaryEmail: client.primaryEmail,
        secondaryEmail: client.secondaryEmail,
        mobilePhone: client.mobilePhone,
        homePhone: client.homePhone,
        officePhone: client.officePhone,
        mailingAddress: client.mailingAddress,
        physicalAddress: client.physicalAddress,
        defaultFeeScheduleId: client.defaultFeeScheduleId,
        billingFrequency: client.billingFrequency,
        billingMethod: client.billingMethod,
        feePaymentAccountId: client.feePaymentAccountId,
        customFeeAdjustment: client.customFeeAdjustment,
        feeScheduleOverride: client.feeScheduleOverride,
        primaryAdvisor: client.primaryAdvisor,
        clientStatus: client.clientStatus,
        relationshipManager: client.relationshipManager,
        serviceTeam: client.serviceTeam,
        clientSinceDate: client.clientSinceDate,
        lastReviewDate: client.lastReviewDate,
        nextReviewDate: client.nextReviewDate,
        notes: client.notes,
        riskTolerance: client.riskTolerance,
        investmentObjectives: client.investmentObjectives,
        reportingPreferences: client.reportingPreferences,
        specialInstructions: client.specialInstructions,
        preferredContactMethod: client.preferredContactMethod,
        doNotContact: client.doNotContact,
        doNotEmail: client.doNotEmail,
        doNotCall: client.doNotCall,
      });
    } else if (isOpen) {
      // Reset form for new client only when modal opens
      setFormData({
        fullLegalName: '',
        taxIdType: TaxIdType.SSN,
        taxIdNumber: '',
        entityType: EntityType.INDIVIDUAL,
        clientStatus: ClientStatus.ACTIVE,
        billingFrequency: BillingFrequency.QUARTERLY,
        billingMethod: BillingMethod.DEBIT_FROM_ACCOUNT,
        doNotContact: false,
        doNotEmail: false,
        doNotCall: false,
      });
      setActiveSection('basic');
    }
  }, [client, isOpen]);

  // Load accounts when modal opens or when switching to accounts tab
  useEffect(() => {
    const loadAccounts = async () => {
      if (!isOpen || !userProfile?.firmId || activeSection !== 'accounts') {
        return;
      }

      setLoadingAccounts(true);

      // Load unassigned accounts
      const unassignedResponse = await accountsService.getUnassigned(userProfile.firmId);
      if (unassignedResponse.data) {
        setUnassignedAccounts(unassignedResponse.data);
      }

      // Load linked accounts if editing existing client
      if (client?.id) {
        const linkedResponse = await accountsService.getByClientId(client.id);
        if (linkedResponse.data) {
          setLinkedAccounts(linkedResponse.data);
        }
      }

      setLoadingAccounts(false);
    };

    loadAccounts();
  }, [isOpen, activeSection, userProfile?.firmId, client?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleLinkAccount = async (accountId: string) => {
    if (!client?.id) {
      alert('Please save the client first before linking accounts.');
      return;
    }

    const account = unassignedAccounts.find(a => a.id === accountId);
    if (!account) return;

    // Check if it's a joint account and already has a client
    if (account.accountType === AccountType.JOINT && account.clientId) {
      // Joint accounts can have up to 2 clients
      // This is a simplified check - in production, you'd check a junction table
      alert('This joint account already has one client assigned. Joint accounts can only have up to 2 clients.');
      return;
    }

    // Check if non-joint accounts already have a client
    if (account.accountType !== AccountType.JOINT && account.clientId) {
      alert('This account is already assigned to another client.');
      return;
    }

    const response = await accountsService.linkToClient(accountId, client.id);
    if (response.error) {
      alert(`Error linking account: ${response.error}`);
    } else {
      // Refresh accounts list
      if (userProfile?.firmId) {
        const unassignedResponse = await accountsService.getUnassigned(userProfile.firmId);
        if (unassignedResponse.data) {
          setUnassignedAccounts(unassignedResponse.data);
        }
        const linkedResponse = await accountsService.getByClientId(client.id);
        if (linkedResponse.data) {
          setLinkedAccounts(linkedResponse.data);
        }
      }
    }
  };

  const handleUnlinkAccount = async (accountId: string) => {
    if (!client?.id) return;

    const response = await accountsService.unlinkFromClient(accountId);
    if (response.error) {
      alert(`Error unlinking account: ${response.error}`);
    } else {
      // Refresh accounts list
      if (userProfile?.firmId) {
        const unassignedResponse = await accountsService.getUnassigned(userProfile.firmId);
        if (unassignedResponse.data) {
          setUnassignedAccounts(unassignedResponse.data);
        }
        const linkedResponse = await accountsService.getByClientId(client.id);
        if (linkedResponse.data) {
          setLinkedAccounts(linkedResponse.data);
        }
      }
    }
  };

  const updateField = (field: keyof ClientFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateAddress = (type: 'mailingAddress' | 'physicalAddress', field: keyof Address, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
  };

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

  const sectionStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  };

  const renderBasicInfo = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
        Basic Information
      </h3>
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Full Legal Name *</label>
          <input
            type="text"
            value={formData.fullLegalName}
            onChange={(e) => updateField('fullLegalName', e.target.value)}
            style={inputStyle}
            required
          />
        </div>
        <div>
          <label style={labelStyle}>Entity Type *</label>
          <select
            value={formData.entityType}
            onChange={(e) => updateField('entityType', e.target.value as EntityType)}
            style={inputStyle}
            required
          >
            {Object.values(EntityType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tax ID Type</label>
          <select
            value={formData.taxIdType}
            onChange={(e) => updateField('taxIdType', e.target.value as TaxIdType)}
            style={inputStyle}
          >
            {Object.values(TaxIdType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tax ID Number</label>
          <input
            type="text"
            value={formData.taxIdNumber}
            onChange={(e) => updateField('taxIdNumber', e.target.value)}
            style={inputStyle}
            placeholder="***-**-****"
          />
        </div>
        <div>
          <label style={labelStyle}>Date of Birth</label>
          <input
            type="date"
            value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('dateOfBirth', e.target.value ? new Date(e.target.value) : undefined)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Client Status *</label>
          <select
            value={formData.clientStatus}
            onChange={(e) => updateField('clientStatus', e.target.value as ClientStatus)}
            style={inputStyle}
            required
          >
            {Object.values(ClientStatus).map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );

  const renderContactInfo = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
        Contact Information
      </h3>
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Primary Email</label>
          <input
            type="email"
            value={formData.primaryEmail || ''}
            onChange={(e) => updateField('primaryEmail', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Secondary Email</label>
          <input
            type="email"
            value={formData.secondaryEmail || ''}
            onChange={(e) => updateField('secondaryEmail', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Mobile Phone</label>
          <input
            type="tel"
            value={formData.mobilePhone || ''}
            onChange={(e) => updateField('mobilePhone', e.target.value)}
            style={inputStyle}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label style={labelStyle}>Home Phone</label>
          <input
            type="tel"
            value={formData.homePhone || ''}
            onChange={(e) => updateField('homePhone', e.target.value)}
            style={inputStyle}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label style={labelStyle}>Office Phone</label>
          <input
            type="tel"
            value={formData.officePhone || ''}
            onChange={(e) => updateField('officePhone', e.target.value)}
            style={inputStyle}
            placeholder="(555) 123-4567"
          />
        </div>
        <div>
          <label style={labelStyle}>Preferred Contact Method</label>
          <select
            value={formData.preferredContactMethod || ''}
            onChange={(e) => updateField('preferredContactMethod', e.target.value as PreferredContactMethod)}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {Object.values(PreferredContactMethod).map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
      </div>

      <h4 style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '20px', marginBottom: '12px', color: '#333' }}>
        Mailing Address
      </h4>
      <div style={sectionStyle}>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Street Address</label>
          <input
            type="text"
            value={formData.mailingAddress?.street1 || ''}
            onChange={(e) => updateAddress('mailingAddress', 'street1', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Street Address 2</label>
          <input
            type="text"
            value={formData.mailingAddress?.street2 || ''}
            onChange={(e) => updateAddress('mailingAddress', 'street2', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input
            type="text"
            value={formData.mailingAddress?.city || ''}
            onChange={(e) => updateAddress('mailingAddress', 'city', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>State</label>
          <input
            type="text"
            value={formData.mailingAddress?.state || ''}
            onChange={(e) => updateAddress('mailingAddress', 'state', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>ZIP Code</label>
          <input
            type="text"
            value={formData.mailingAddress?.zipCode || ''}
            onChange={(e) => updateAddress('mailingAddress', 'zipCode', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Country</label>
          <input
            type="text"
            value={formData.mailingAddress?.country || ''}
            onChange={(e) => updateAddress('mailingAddress', 'country', e.target.value)}
            style={inputStyle}
            placeholder="USA"
          />
        </div>
      </div>

      <div style={{ marginTop: '16px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={formData.doNotContact}
            onChange={(e) => updateField('doNotContact', e.target.checked)}
          />
          <span style={{ fontSize: '14px' }}>Do Not Contact</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
          <input
            type="checkbox"
            checked={formData.doNotEmail}
            onChange={(e) => updateField('doNotEmail', e.target.checked)}
          />
          <span style={{ fontSize: '14px' }}>Do Not Email</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginTop: '8px' }}>
          <input
            type="checkbox"
            checked={formData.doNotCall}
            onChange={(e) => updateField('doNotCall', e.target.checked)}
          />
          <span style={{ fontSize: '14px' }}>Do Not Call</span>
        </label>
      </div>
    </div>
  );

  const renderAccountsInfo = () => {
    // Filter unassigned accounts based on search
    const filteredUnassignedAccounts = unassignedAccounts.filter(account => {
      if (!accountSearch) return true;
      const searchLower = accountSearch.toLowerCase();
      return (
        account.accountNumber.toLowerCase().includes(searchLower) ||
        account.accountName.toLowerCase().includes(searchLower) ||
        account.accountType.toLowerCase().includes(searchLower)
      );
    });

    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          Account Assignment
        </h3>

        {!client?.id && (
          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            color: '#856404'
          }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />
            Please save the client first before linking accounts.
          </div>
        )}

        {/* Linked Accounts Section */}
        {client?.id && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px'
            }}>
              <Link2 size={18} color="#4caf50" />
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>
                Linked Accounts ({linkedAccounts.length})
              </h4>
            </div>

            {linkedAccounts.length > 0 ? (
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Account Number
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Account Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Type
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Balance
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedAccounts.map((account) => (
                      <tr key={account.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          {account.accountNumber}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          {account.accountName}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: account.accountType === AccountType.JOINT ? '#e3f2fd' : '#f5f5f5',
                            color: account.accountType === AccountType.JOINT ? '#1976d2' : '#666'
                          }}>
                            {account.accountType}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                          {account.currentBalance ? `$${account.currentBalance.toLocaleString()}` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleUnlinkAccount(account.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              border: '1px solid #f44336',
                              backgroundColor: 'white',
                              color: '#f44336',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Unlink
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '24px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#666'
              }}>
                <AlertCircle size={24} style={{ margin: '0 auto 8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>No accounts linked to this client</p>
              </div>
            )}
          </div>
        )}

        {/* Unassigned Accounts Section */}
        {client?.id && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ExternalLink size={18} color="#2196f3" />
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>
                  Available Accounts ({filteredUnassignedAccounts.length})
                </h4>
              </div>
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }}
                />
                <input
                  type="text"
                  placeholder="Search accounts..."
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  style={{
                    padding: '8px 8px 8px 32px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px',
                    width: '200px'
                  }}
                />
              </div>
            </div>

            {loadingAccounts ? (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666'
              }}>
                Loading accounts...
              </div>
            ) : filteredUnassignedAccounts.length > 0 ? (
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                overflow: 'hidden',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f5f5f5', zIndex: 1 }}>
                    <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Account Number
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Account Name
                      </th>
                      <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Type
                      </th>
                      <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Balance
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnassignedAccounts.map((account) => (
                      <tr key={account.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          {account.accountNumber}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          {account.accountName}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 'bold',
                            backgroundColor: account.accountType === AccountType.JOINT ? '#e3f2fd' : '#f5f5f5',
                            color: account.accountType === AccountType.JOINT ? '#1976d2' : '#666'
                          }}>
                            {account.accountType}
                            {account.accountType === AccountType.JOINT && account.clientId && ' (1/2)'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                          {account.currentBalance ? `$${account.currentBalance.toLocaleString()}` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleLinkAccount(account.id)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              border: 'none',
                              backgroundColor: '#4caf50',
                              color: 'white',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Link
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{
                padding: '40px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#666'
              }}>
                <AlertCircle size={32} style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>
                  {accountSearch ? 'No accounts match your search' : 'No unassigned accounts available'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
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
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        {/* Section Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e0e0e0',
          padding: '0 24px',
          gap: '8px'
        }}>
          {[
            { id: 'basic', label: 'Basic Info' },
            { id: 'contact', label: 'Contact' },
            { id: 'accounts', label: 'Accounts' }
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeSection === section.id ? 'bold' : 'normal',
                color: activeSection === section.id ? '#2196f3' : '#666',
                borderBottom: activeSection === section.id ? '2px solid #2196f3' : '2px solid transparent',
                transition: 'all 0.2s'
              }}
            >
              {section.label}
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
            {activeSection === 'basic' && renderBasicInfo()}
            {activeSection === 'contact' && renderContactInfo()}
            {activeSection === 'accounts' && renderAccountsInfo()}
          </div>

          {/* Footer */}
          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
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
                fontWeight: 'bold'
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
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientFormModal;
