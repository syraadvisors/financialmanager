import React, { useState, useEffect } from 'react';
import { X, FileText, Users, Calendar, DollarSign, Send, CheckCircle } from 'lucide-react';
import { InvoiceGenerationOptions } from '../types/Invoice';

interface InvoiceGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: InvoiceGenerationOptions) => void;
  mode: 'single' | 'bulk';
  selectedClientId?: string;
  selectedClientName?: string;
}

const InvoiceGenerationModal: React.FC<InvoiceGenerationModalProps> = ({
  isOpen,
  onClose,
  onGenerate,
  mode,
  selectedClientId,
  selectedClientName,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<InvoiceGenerationOptions>>({
    billingPeriodId: 'q4-2024',
    clientIds: selectedClientId ? [selectedClientId] : [],
    invoiceDate: new Date(today),
    dueDate: new Date(thirtyDaysFromNow),
    includeZeroFees: false,
    groupByHousehold: true,
    customMessage: '',
    companyInfo: {
      name: 'Your Firm Name',
      address: '123 Main Street, Suite 100, City, ST 12345',
      phone: '(555) 123-4567',
      email: 'billing@yourfirm.com',
      logoUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        billingPeriodId: 'q4-2024',
        clientIds: selectedClientId ? [selectedClientId] : [],
        invoiceDate: new Date(today),
        dueDate: new Date(thirtyDaysFromNow),
        includeZeroFees: false,
        groupByHousehold: true,
        customMessage: '',
        companyInfo: {
          name: 'Your Firm Name',
          address: '123 Main Street, Suite 100, City, ST 12345',
          phone: '(555) 123-4567',
          email: 'billing@yourfirm.com',
          logoUrl: '',
        },
      });
    }
  }, [isOpen, selectedClientId, today, thirtyDaysFromNow]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    onGenerate(formData as InvoiceGenerationOptions);
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '14px',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1a202c',
    marginBottom: '8px',
  };

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
          maxWidth: '700px',
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
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            backgroundColor: 'white',
            zIndex: 1,
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', marginBottom: '4px' }}>
              {mode === 'bulk' ? 'Generate Bulk Invoices' : 'Generate Invoice'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {mode === 'bulk'
                ? 'Create invoices for multiple clients'
                : `Create invoice for ${selectedClientName || 'selected client'}`}
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
          {/* Billing Period */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>
              <Calendar size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Billing Period *
            </label>
            <select
              value={formData.billingPeriodId}
              onChange={(e) => setFormData({ ...formData, billingPeriodId: e.target.value })}
              style={inputStyle}
            >
              <option value="q4-2024">Q4 2024 (Oct 1 - Dec 31, 2024)</option>
              <option value="q3-2024">Q3 2024 (Jul 1 - Sep 30, 2024)</option>
              <option value="q2-2024">Q2 2024 (Apr 1 - Jun 30, 2024)</option>
              <option value="q1-2024">Q1 2024 (Jan 1 - Mar 31, 2024)</option>
            </select>
          </div>

          {/* Invoice Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={labelStyle}>Invoice Date *</label>
              <input
                type="date"
                value={formData.invoiceDate?.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, invoiceDate: new Date(e.target.value) })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Due Date *</label>
              <input
                type="date"
                value={formData.dueDate?.toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, dueDate: new Date(e.target.value) })}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Options */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>Options</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.includeZeroFees}
                  onChange={(e) => setFormData({ ...formData, includeZeroFees: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>
                  Include clients with zero fees
                </span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.groupByHousehold}
                  onChange={(e) => setFormData({ ...formData, groupByHousehold: e.target.checked })}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '14px', color: '#475569' }}>
                  Group accounts by household
                </span>
              </label>
            </div>
          </div>

          {/* Company Information */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ ...labelStyle, marginBottom: '12px' }}>
              <DollarSign size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Company Information
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                placeholder="Company Name"
                value={formData.companyInfo?.name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyInfo: { ...formData.companyInfo!, name: e.target.value },
                  })
                }
                style={inputStyle}
              />
              <input
                type="text"
                placeholder="Address"
                value={formData.companyInfo?.address}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    companyInfo: { ...formData.companyInfo!, address: e.target.value },
                  })
                }
                style={inputStyle}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input
                  type="text"
                  placeholder="Phone"
                  value={formData.companyInfo?.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo!, phone: e.target.value },
                    })
                  }
                  style={inputStyle}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={formData.companyInfo?.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      companyInfo: { ...formData.companyInfo!, email: e.target.value },
                    })
                  }
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Custom Message */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Custom Message (Optional)</label>
            <textarea
              value={formData.customMessage}
              onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
              placeholder="Add a custom message to appear on invoices..."
              rows={3}
              style={{
                ...inputStyle,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Summary */}
          {mode === 'bulk' && (
            <div
              style={{
                padding: '16px',
                backgroundColor: '#eff6ff',
                borderRadius: '8px',
                border: '1px solid #bfdbfe',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Users size={16} color="#1e40af" />
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
                  Bulk Generation Summary
                </span>
              </div>
              <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>
                Invoices will be generated for all clients with billing activity in the selected period.
                {formData.includeZeroFees
                  ? ' Zero-fee clients will be included.'
                  : ' Zero-fee clients will be excluded.'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            position: 'sticky',
            bottom: 0,
            backgroundColor: 'white',
          }}
        >
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
            onClick={handleGenerate}
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
            }}
          >
            <FileText size={16} />
            {mode === 'bulk' ? 'Generate Invoices' : 'Generate Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceGenerationModal;
