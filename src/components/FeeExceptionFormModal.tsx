import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2 } from 'lucide-react';
import {
  FeeException,
  FeeExceptionType,
  FeeExceptionStatus,
  FeeExceptionFormData,
} from '../types/FeeException';

interface FeeExceptionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeeExceptionFormData) => Promise<void>;
  exception?: FeeException | null;
  agreementNumber: string;
  // Available accounts from the parent billing fee agreement
  availableAccounts: Array<{
    id: string;
    accountNumber: string;
    accountName: string;
  }>;
}

const FeeExceptionFormModal: React.FC<FeeExceptionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  exception,
  agreementNumber,
  availableAccounts,
}) => {
  const [formData, setFormData] = useState<FeeExceptionFormData>({
    exceptionType: FeeExceptionType.MINIMUM_FEE,
    status: FeeExceptionStatus.ACTIVE,
    accountIds: [],
    effectiveDate: new Date(),
  });

  const [newTicker, setNewTicker] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data when exception changes
  useEffect(() => {
    if (exception) {
      setFormData({
        exceptionType: exception.exceptionType,
        status: exception.status,
        accountIds: exception.accountIds || [],
        minimumFeeAmount: exception.minimumFeeAmount,
        maximumFeeAmount: exception.maximumFeeAmount,
        debitAmount: exception.debitAmount,
        creditAmount: exception.creditAmount,
        premiumPercentage: exception.premiumPercentage,
        discountPercentage: exception.discountPercentage,
        excludedFundTickers: exception.excludedFundTickers,
        excludedDollarAmount: exception.excludedDollarAmount,
        effectiveDate: exception.effectiveDate,
        expirationDate: exception.expirationDate,
        description: exception.description,
        notes: exception.notes,
        internalNotes: exception.internalNotes,
      });
    } else {
      // Reset form for new exception
      setFormData({
        exceptionType: FeeExceptionType.MINIMUM_FEE,
        status: FeeExceptionStatus.ACTIVE,
        accountIds: [],
        effectiveDate: new Date(),
      });
    }
    setErrors({});
  }, [exception]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate based on exception type
    switch (formData.exceptionType) {
      case FeeExceptionType.MINIMUM_FEE:
        if (!formData.minimumFeeAmount || formData.minimumFeeAmount <= 0) {
          newErrors.minimumFeeAmount = 'Minimum fee amount is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.MAXIMUM_FEE:
        if (!formData.maximumFeeAmount || formData.maximumFeeAmount <= 0) {
          newErrors.maximumFeeAmount = 'Maximum fee amount is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.DEBIT_AMOUNT:
        if (!formData.debitAmount || formData.debitAmount <= 0) {
          newErrors.debitAmount = 'Debit amount is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.CREDIT_AMOUNT:
        if (!formData.creditAmount || formData.creditAmount <= 0) {
          newErrors.creditAmount = 'Credit amount is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.PREMIUM_PERCENTAGE:
        if (!formData.premiumPercentage || formData.premiumPercentage <= 0) {
          newErrors.premiumPercentage = 'Premium percentage is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.DISCOUNT_PERCENTAGE:
        if (!formData.discountPercentage || formData.discountPercentage <= 0) {
          newErrors.discountPercentage = 'Discount percentage is required and must be greater than 0';
        }
        break;
      case FeeExceptionType.FUND_EXCLUSION:
        if (!formData.excludedFundTickers || formData.excludedFundTickers.length === 0) {
          newErrors.excludedFundTickers = 'At least one ticker symbol is required';
        }
        break;
      case FeeExceptionType.DOLLAR_AMOUNT_EXCLUSION:
        if (!formData.excludedDollarAmount || formData.excludedDollarAmount <= 0) {
          newErrors.excludedDollarAmount = 'Excluded dollar amount is required and must be greater than 0';
        }
        break;
    }

    // Validate date range
    if (formData.expirationDate && formData.expirationDate < formData.effectiveDate) {
      newErrors.expirationDate = 'Expiration date must be after effective date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting fee exception:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAccountToggle = (accountId: string) => {
    setFormData(prev => ({
      ...prev,
      accountIds: prev.accountIds.includes(accountId)
        ? prev.accountIds.filter(id => id !== accountId)
        : [...prev.accountIds, accountId],
    }));
  };

  const handleSelectAllAccounts = () => {
    setFormData(prev => ({
      ...prev,
      accountIds: availableAccounts.map(acc => acc.id),
    }));
  };

  const handleDeselectAllAccounts = () => {
    setFormData(prev => ({
      ...prev,
      accountIds: [],
    }));
  };

  const handleAddTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !formData.excludedFundTickers?.includes(ticker)) {
      setFormData(prev => ({
        ...prev,
        excludedFundTickers: [...(prev.excludedFundTickers || []), ticker],
      }));
      setNewTicker('');
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    setFormData(prev => ({
      ...prev,
      excludedFundTickers: prev.excludedFundTickers?.filter(t => t !== ticker),
    }));
  };

  if (!isOpen) return null;

  const getFieldsForExceptionType = () => {
    switch (formData.exceptionType) {
      case FeeExceptionType.MINIMUM_FEE:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Minimum Fee Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.minimumFeeAmount || ''}
              onChange={(e) => setFormData({ ...formData, minimumFeeAmount: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.minimumFeeAmount ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.minimumFeeAmount && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.minimumFeeAmount}
              </p>
            )}
          </div>
        );

      case FeeExceptionType.MAXIMUM_FEE:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Maximum Fee Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.maximumFeeAmount || ''}
              onChange={(e) => setFormData({ ...formData, maximumFeeAmount: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.maximumFeeAmount ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.maximumFeeAmount && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.maximumFeeAmount}
              </p>
            )}
          </div>
        );

      case FeeExceptionType.DEBIT_AMOUNT:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Debit Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.debitAmount || ''}
              onChange={(e) => setFormData({ ...formData, debitAmount: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.debitAmount ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.debitAmount && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.debitAmount}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              This amount will be added to the calculated fee
            </p>
          </div>
        );

      case FeeExceptionType.CREDIT_AMOUNT:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Credit Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.creditAmount || ''}
              onChange={(e) => setFormData({ ...formData, creditAmount: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.creditAmount ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.creditAmount && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.creditAmount}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              This amount will be subtracted from the calculated fee
            </p>
          </div>
        );

      case FeeExceptionType.PREMIUM_PERCENTAGE:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Premium Percentage *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.premiumPercentage || ''}
              onChange={(e) => setFormData({ ...formData, premiumPercentage: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.premiumPercentage ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.premiumPercentage && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.premiumPercentage}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              e.g., 10 means +10% will be added to the calculated fee
            </p>
          </div>
        );

      case FeeExceptionType.DISCOUNT_PERCENTAGE:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Discount Percentage *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.discountPercentage || ''}
              onChange={(e) => setFormData({ ...formData, discountPercentage: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.discountPercentage ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.discountPercentage && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.discountPercentage}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              e.g., 15 means -15% will be subtracted from the calculated fee
            </p>
          </div>
        );

      case FeeExceptionType.FUND_EXCLUSION:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Excluded Fund Tickers *
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                type="text"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTicker();
                  }
                }}
                placeholder="Enter ticker symbol (e.g., VFIAX)"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              <button
                type="button"
                onClick={handleAddTicker}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
            {formData.excludedFundTickers && formData.excludedFundTickers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {formData.excludedFundTickers.map((ticker) => (
                  <div
                    key={ticker}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 8px',
                      backgroundColor: '#f3f4f6',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    <span>{ticker}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTicker(ticker)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: '0',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.excludedFundTickers && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.excludedFundTickers}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              Securities with these ticker symbols will be excluded from the billable value
            </p>
          </div>
        );

      case FeeExceptionType.DOLLAR_AMOUNT_EXCLUSION:
        return (
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
              Excluded Dollar Amount *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.excludedDollarAmount || ''}
              onChange={(e) => setFormData({ ...formData, excludedDollarAmount: parseFloat(e.target.value) })}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: errors.excludedDollarAmount ? '1px solid #ef4444' : '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {errors.excludedDollarAmount && (
              <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                {errors.excludedDollarAmount}
              </p>
            )}
            <p style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
              This dollar amount will be held out of the billable value
            </p>
          </div>
        );

      default:
        return null;
    }
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
          maxWidth: '700px',
          width: '100%',
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
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
              {exception ? 'Edit Fee Exception' : 'Add Fee Exception'}
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
              Agreement {agreementNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#9ca3af',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Exception Type */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Exception Type *
              </label>
              <select
                value={formData.exceptionType}
                onChange={(e) =>
                  setFormData({ ...formData, exceptionType: e.target.value as FeeExceptionType })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
              >
                {Object.values(FeeExceptionType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Type-specific fields */}
            {getFieldsForExceptionType()}

            {/* Status */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as FeeExceptionStatus })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                }}
              >
                {Object.values(FeeExceptionStatus).map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Account Selection */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Apply to Accounts
              </label>
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '8px' }}>
                Leave unselected to apply to all accounts in the agreement
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <button
                  type="button"
                  onClick={handleSelectAllAccounts}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllAccounts}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    backgroundColor: '#f3f4f6',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Deselect All
                </button>
              </div>
              <div
                style={{
                  maxHeight: '200px',
                  overflowY: 'auto',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  padding: '8px',
                }}
              >
                {availableAccounts.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '13px', padding: '8px' }}>
                    No accounts available
                  </p>
                ) : (
                  availableAccounts.map((account) => (
                    <label
                      key={account.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        fontSize: '13px',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.accountIds.includes(account.id)}
                        onChange={() => handleAccountToggle(account.id)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: '500' }}>{account.accountNumber}</span>
                      <span style={{ color: '#6b7280' }}>{account.accountName}</span>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Date fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                  Effective Date *
                </label>
                <input
                  type="date"
                  value={formData.effectiveDate.toISOString().split('T')[0]}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: new Date(e.target.value) })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                  Expiration Date
                </label>
                <input
                  type="date"
                  value={formData.expirationDate?.toISOString().split('T')[0] || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expirationDate: e.target.value ? new Date(e.target.value) : undefined,
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: errors.expirationDate ? '1px solid #ef4444' : '1px solid #d1d5db',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {errors.expirationDate && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
                    {errors.expirationDate}
                  </p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Brief description of this exception"
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Notes
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Additional notes for this exception"
              />
            </div>

            {/* Internal Notes */}
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '13px' }}>
                Internal Notes
              </label>
              <textarea
                value={formData.internalNotes || ''}
                onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
                placeholder="Internal notes (not visible to clients)"
              />
            </div>
          </div>

          {/* Form actions */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '10px 20px',
                backgroundColor: isSubmitting ? '#9ca3af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              {isSubmitting ? 'Saving...' : exception ? 'Save Changes' : 'Add Exception'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeeExceptionFormModal;
