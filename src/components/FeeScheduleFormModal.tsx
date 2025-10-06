import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign } from 'lucide-react';
import { FeeSchedule, FeeTier, FeeScheduleStatus, FeeStructureType, FeeScheduleTag } from '../types/FeeSchedule';

interface FeeScheduleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (schedule: FeeSchedule) => void;
  schedule?: FeeSchedule | null;
}

const FeeScheduleFormModal: React.FC<FeeScheduleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  schedule,
}) => {
  const [formData, setFormData] = useState<Partial<FeeSchedule>>({
    code: '',
    name: '',
    status: 'active',
    structureType: 'flat_rate',
    tags: [],
    description: '',
    hasMinimumFee: false,
    isDirectBill: false,
  });

  const [tiers, setTiers] = useState<FeeTier[]>([
    { minAmount: 0, maxAmount: 499999.99, rate: 0.01 },
  ]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (schedule) {
      setFormData({
        code: schedule.code,
        name: schedule.name,
        status: schedule.status,
        structureType: schedule.structureType,
        tags: schedule.tags || [],
        description: schedule.description,
        hasMinimumFee: schedule.hasMinimumFee,
        minimumFeePerYear: schedule.minimumFeePerYear,
        flatRate: schedule.flatRate,
        flatFeePerQuarter: schedule.flatFeePerQuarter,
        isDirectBill: schedule.isDirectBill,
      });
      if (schedule.tiers) {
        setTiers(schedule.tiers);
      }
    } else {
      // Reset form for new schedule
      setFormData({
        code: '',
        name: '',
        status: 'active',
        structureType: 'flat_rate',
        tags: [],
        description: '',
        hasMinimumFee: false,
        isDirectBill: false,
      });
      setTiers([{ minAmount: 0, maxAmount: 499999.99, rate: 0.01 }]);
    }
    setErrors({});
  }, [schedule, isOpen]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.code?.trim()) {
      newErrors.code = 'Code is required';
    }
    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.structureType === 'flat_rate' && (formData.flatRate === undefined || formData.flatRate < 0)) {
      newErrors.flatRate = 'Valid flat rate is required';
    }

    if (formData.structureType === 'flat_fee' && (formData.flatFeePerQuarter === undefined || formData.flatFeePerQuarter < 0)) {
      newErrors.flatFeePerQuarter = 'Valid flat fee is required';
    }

    if (formData.structureType === 'tiered' && tiers.length === 0) {
      newErrors.tiers = 'At least one tier is required';
    }

    if (formData.hasMinimumFee && (formData.minimumFeePerYear === undefined || formData.minimumFeePerYear < 0)) {
      newErrors.minimumFeePerYear = 'Valid minimum fee is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    const now = new Date().toISOString().split('T')[0];
    const savedSchedule: FeeSchedule = {
      id: schedule?.id || `fee-${Date.now()}`,
      code: formData.code!,
      name: formData.name!,
      status: formData.status!,
      structureType: formData.structureType!,
      tags: formData.tags || [],
      description: formData.description!,
      hasMinimumFee: formData.hasMinimumFee!,
      minimumFeePerYear: formData.minimumFeePerYear,
      createdDate: schedule?.createdDate || now,
      lastModifiedDate: now,
      isDirectBill: formData.isDirectBill,
      ...(formData.structureType === 'tiered' && { tiers }),
      ...(formData.structureType === 'flat_rate' && { flatRate: formData.flatRate }),
      ...(formData.structureType === 'flat_fee' && { flatFeePerQuarter: formData.flatFeePerQuarter }),
    };

    onSave(savedSchedule);
    onClose();
  };

  const addTier = () => {
    const lastTier = tiers[tiers.length - 1];
    const newMinAmount = lastTier.maxAmount ? lastTier.maxAmount + 0.01 : 0;
    setTiers([...tiers, { minAmount: newMinAmount, maxAmount: null, rate: 0.01 }]);
  };

  const updateTier = (index: number, field: keyof FeeTier, value: number | null) => {
    const updatedTiers = [...tiers];
    updatedTiers[index] = { ...updatedTiers[index], [field]: value };
    setTiers(updatedTiers);
  };

  const removeTier = (index: number) => {
    if (tiers.length > 1) {
      setTiers(tiers.filter((_, i) => i !== index));
    }
  };

  const toggleTag = (tag: FeeScheduleTag) => {
    const currentTags = formData.tags || [];
    if (currentTags.includes(tag)) {
      setFormData({ ...formData, tags: currentTags.filter(t => t !== tag) });
    } else {
      setFormData({ ...formData, tags: [...currentTags, tag] });
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
              {schedule ? 'Edit Fee Schedule' : 'New Fee Schedule'}
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>
              {schedule ? 'Update fee schedule details' : 'Create a new fee schedule'}
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
                Code *
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g., 34, D8, F1"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.code ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.code && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.code}</span>}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Fee 34"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.name ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.name && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.name}</span>}
            </div>
          </div>

          {/* Status and Structure Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as FeeScheduleStatus })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Structure Type
              </label>
              <select
                value={formData.structureType}
                onChange={(e) => setFormData({ ...formData, structureType: e.target.value as FeeStructureType })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                }}
              >
                <option value="flat_rate">Flat Rate (%)</option>
                <option value="tiered">Tiered</option>
                <option value="flat_fee">Flat Fee ($)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe this fee schedule..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.description ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            {errors.description && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.description}</span>}
          </div>

          {/* Tags */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
              Tags
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(['tiered', 'flat', 'custom', 'direct_bill', 'minimum_fee'] as FeeScheduleTag[]).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '13px',
                    border: `1px solid ${(formData.tags || []).includes(tag) ? '#2196f3' : '#e2e8f0'}`,
                    backgroundColor: (formData.tags || []).includes(tag) ? '#eff6ff' : 'white',
                    color: (formData.tags || []).includes(tag) ? '#1e40af' : '#64748b',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {tag.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Structure-Specific Fields */}
          {formData.structureType === 'flat_rate' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Flat Rate (%) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.flatRate !== undefined ? formData.flatRate * 100 : ''}
                onChange={(e) => setFormData({ ...formData, flatRate: parseFloat(e.target.value) / 100 })}
                placeholder="e.g., 0.25"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.flatRate ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.flatRate && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.flatRate}</span>}
            </div>
          )}

          {formData.structureType === 'flat_fee' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                Flat Fee Per Quarter ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.flatFeePerQuarter || ''}
                onChange={(e) => setFormData({ ...formData, flatFeePerQuarter: parseFloat(e.target.value) })}
                placeholder="e.g., 395"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: `1px solid ${errors.flatFeePerQuarter ? '#ef4444' : '#e2e8f0'}`,
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
              {errors.flatFeePerQuarter && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.flatFeePerQuarter}</span>}
            </div>
          )}

          {formData.structureType === 'tiered' && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                  Tiers *
                </label>
                <button
                  type="button"
                  onClick={addTier}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  Add Tier
                </button>
              </div>
              {errors.tiers && <span style={{ fontSize: '12px', color: '#ef4444', marginBottom: '8px', display: 'block' }}>{errors.tiers}</span>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tiers.map((tier, index) => (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr auto',
                    gap: '8px',
                    alignItems: 'end',
                    padding: '12px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        Min Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.minAmount}
                        onChange={(e) => updateTier(index, 'minAmount', parseFloat(e.target.value))}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        Max Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.maxAmount ?? ''}
                        onChange={(e) => updateTier(index, 'maxAmount', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="Leave empty for 'and up'"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                        Rate (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={tier.rate * 100}
                        onChange={(e) => updateTier(index, 'rate', parseFloat(e.target.value) / 100)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '4px',
                          fontSize: '13px',
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeTier(index)}
                      disabled={tiers.length === 1}
                      style={{
                        padding: '8px',
                        backgroundColor: tiers.length === 1 ? '#f1f5f9' : '#fee',
                        color: tiers.length === 1 ? '#94a3b8' : '#ef4444',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: tiers.length === 1 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Minimum Fee */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.hasMinimumFee}
                onChange={(e) => setFormData({ ...formData, hasMinimumFee: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                Has Minimum Fee
              </span>
            </label>

            {formData.hasMinimumFee && (
              <div style={{ marginTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#1a202c', marginBottom: '8px' }}>
                  Minimum Fee Per Year ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minimumFeePerYear || ''}
                  onChange={(e) => setFormData({ ...formData, minimumFeePerYear: parseFloat(e.target.value) })}
                  placeholder="e.g., 1000"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: `1px solid ${errors.minimumFeePerYear ? '#ef4444' : '#e2e8f0'}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
                {errors.minimumFeePerYear && <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>{errors.minimumFeePerYear}</span>}
              </div>
            )}
          </div>

          {/* Direct Bill */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isDirectBill}
                onChange={(e) => setFormData({ ...formData, isDirectBill: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                Direct Bill
              </span>
            </label>
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
            {schedule ? 'Save Changes' : 'Create Fee Schedule'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeeScheduleFormModal;
