import React, { useState, useEffect } from 'react';
import { X, Users, Home, Building2, DollarSign, AlertCircle } from 'lucide-react';
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

  const [activeSection, setActiveSection] = useState<'basic' | 'contact' | 'billing' | 'relationship' | 'additional' | 'accounts'>('basic');

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
    } else {
      // Reset form for new client
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
  }, [client]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
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
          <label style={labelStyle}>Tax ID Type *</label>
          <select
            value={formData.taxIdType}
            onChange={(e) => updateField('taxIdType', e.target.value as TaxIdType)}
            style={inputStyle}
            required
          >
            {Object.values(TaxIdType).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tax ID Number *</label>
          <input
            type="text"
            value={formData.taxIdNumber}
            onChange={(e) => updateField('taxIdNumber', e.target.value)}
            style={inputStyle}
            placeholder="***-**-****"
            required
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

  const renderBillingInfo = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
        Billing & Fee Information
      </h3>
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Billing Frequency *</label>
          <select
            value={formData.billingFrequency}
            onChange={(e) => updateField('billingFrequency', e.target.value as BillingFrequency)}
            style={inputStyle}
            required
          >
            {Object.values(BillingFrequency).map(freq => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Billing Method *</label>
          <select
            value={formData.billingMethod}
            onChange={(e) => updateField('billingMethod', e.target.value as BillingMethod)}
            style={inputStyle}
            required
          >
            {Object.values(BillingMethod).map(method => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Default Fee Schedule ID</label>
          <input
            type="text"
            value={formData.defaultFeeScheduleId || ''}
            onChange={(e) => updateField('defaultFeeScheduleId', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Fee Payment Account ID</label>
          <input
            type="text"
            value={formData.feePaymentAccountId || ''}
            onChange={(e) => updateField('feePaymentAccountId', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Custom Fee Adjustment (%)</label>
          <input
            type="number"
            value={formData.customFeeAdjustment || ''}
            onChange={(e) => updateField('customFeeAdjustment', e.target.value ? parseFloat(e.target.value) : undefined)}
            style={inputStyle}
            placeholder="e.g., -10 for 10% discount"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );

  const renderRelationshipInfo = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
        Relationship Information
      </h3>
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Primary Advisor</label>
          <input
            type="text"
            value={formData.primaryAdvisor || ''}
            onChange={(e) => updateField('primaryAdvisor', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Relationship Manager</label>
          <input
            type="text"
            value={formData.relationshipManager || ''}
            onChange={(e) => updateField('relationshipManager', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Service Team</label>
          <input
            type="text"
            value={formData.serviceTeam || ''}
            onChange={(e) => updateField('serviceTeam', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Client Since Date</label>
          <input
            type="date"
            value={formData.clientSinceDate ? new Date(formData.clientSinceDate).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('clientSinceDate', e.target.value ? new Date(e.target.value) : undefined)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Last Review Date</label>
          <input
            type="date"
            value={formData.lastReviewDate ? new Date(formData.lastReviewDate).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('lastReviewDate', e.target.value ? new Date(e.target.value) : undefined)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Next Review Date</label>
          <input
            type="date"
            value={formData.nextReviewDate ? new Date(formData.nextReviewDate).toISOString().split('T')[0] : ''}
            onChange={(e) => updateField('nextReviewDate', e.target.value ? new Date(e.target.value) : undefined)}
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  );

  const renderAdditionalInfo = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
        Additional Details
      </h3>
      <div style={sectionStyle}>
        <div>
          <label style={labelStyle}>Risk Tolerance</label>
          <select
            value={formData.riskTolerance || ''}
            onChange={(e) => updateField('riskTolerance', e.target.value as RiskTolerance)}
            style={inputStyle}
          >
            <option value="">Select...</option>
            {Object.values(RiskTolerance).map(risk => (
              <option key={risk} value={risk}>{risk}</option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Investment Objectives</label>
          <input
            type="text"
            value={formData.investmentObjectives || ''}
            onChange={(e) => updateField('investmentObjectives', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Reporting Preferences</label>
          <textarea
            value={formData.reportingPreferences || ''}
            onChange={(e) => updateField('reportingPreferences', e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Special Instructions</label>
          <textarea
            value={formData.specialInstructions || ''}
            onChange={(e) => updateField('specialInstructions', e.target.value)}
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={labelStyle}>Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
            placeholder="Internal notes about the client..."
          />
        </div>
      </div>
    </div>
  );

  const renderAccountsInfo = () => {
    // Mock data for demonstration - In production, this would fetch actual linked data
    const linkedAccounts = [
      { accountNumber: 'ACC-12345', accountName: 'Individual Brokerage', balance: 1250000, status: 'Active' },
      { accountNumber: 'ACC-12346', accountName: 'IRA Account', balance: 780000, status: 'Active' },
      { accountNumber: 'ACC-12347', accountName: 'Trust Account', balance: 2100000, status: 'Active' }
    ];

    const linkedHouseholds = [
      { householdId: 'HH-001', householdName: 'Smith Family Household', totalAUM: 4130000 }
    ];

    const linkedRelationships = [
      { relationshipId: 'REL-001', relationshipName: 'Smith Trust Relationship', totalAUM: 4130000, accounts: 3 }
    ];

    return (
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          Related Accounts, Households & Relationships
        </h3>

        {/* Linked Accounts Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Users size={18} color="#2196f3" />
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
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Balance
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedAccounts.map((account, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < linkedAccounts.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {account.accountNumber}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {account.accountName}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                        ${account.balance.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          backgroundColor: '#e8f5e9',
                          color: '#2e7d32'
                        }}>
                          {account.status}
                        </span>
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

        {/* Linked Households Section */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Home size={18} color="#2196f3" />
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              Linked Households ({linkedHouseholds.length})
            </h4>
          </div>

          {linkedHouseholds.length > 0 ? (
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Household ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Household Name
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Total AUM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedHouseholds.map((household, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < linkedHouseholds.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {household.householdId}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {household.householdName}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                        ${household.totalAUM.toLocaleString()}
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
              <p style={{ margin: 0, fontSize: '14px' }}>No households linked to this client</p>
            </div>
          )}
        </div>

        {/* Linked Relationships Section */}
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px'
          }}>
            <Building2 size={18} color="#2196f3" />
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#333' }}>
              Linked Relationships ({linkedRelationships.length})
            </h4>
          </div>

          {linkedRelationships.length > 0 ? (
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Relationship ID
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Relationship Name
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Accounts
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>
                      Total AUM
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linkedRelationships.map((relationship, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < linkedRelationships.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {relationship.relationshipId}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {relationship.relationshipName}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'center' }}>
                        {relationship.accounts}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333', textAlign: 'right' }}>
                        ${relationship.totalAUM.toLocaleString()}
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
              <p style={{ margin: 0, fontSize: '14px' }}>No relationships linked to this client</p>
            </div>
          )}
        </div>
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
            { id: 'accounts', label: 'Accounts' },
            { id: 'billing', label: 'Billing' },
            { id: 'relationship', label: 'Relationship' },
            { id: 'additional', label: 'Additional' }
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
            {activeSection === 'billing' && renderBillingInfo()}
            {activeSection === 'relationship' && renderRelationshipInfo()}
            {activeSection === 'additional' && renderAdditionalInfo()}
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
