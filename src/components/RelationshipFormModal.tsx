import React, { useState, useEffect, useMemo } from 'react';
import { X, Building2, Search, AlertCircle, CheckSquare, Square, DollarSign, Home } from 'lucide-react';
import { Relationship, RelationshipFormData, RelationshipStatus } from '../types/Relationship';
import { Household } from '../types/Household';

interface RelationshipFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (relationship: RelationshipFormData) => void;
  relationship: Relationship | null;
  existingRelationships: Relationship[]; // All relationships to check for household conflicts
}

const RelationshipFormModal: React.FC<RelationshipFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  relationship,
  existingRelationships
}) => {
  // Mock households for selection - in production, this would come from API/state
  const mockHouseholds: Household[] = [
    {
      id: 'HH-001',
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2024-10-04'),
      householdName: 'Smith Family',
      householdStatus: 'Active' as any,
      memberAccountIds: ['1', '2', '3'],
      billingAggregationLevel: 'Household' as any,
      relationshipId: undefined,
      numberOfAccounts: 3,
      totalAUM: 7800000
    },
    {
      id: 'HH-002',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-10-04'),
      householdName: 'Tech Startup LLC',
      householdStatus: 'Active' as any,
      memberAccountIds: ['4', '5'],
      billingAggregationLevel: 'Account' as any,
      relationshipId: undefined,
      numberOfAccounts: 2,
      totalAUM: 1650000
    },
    {
      id: 'HH-003',
      createdAt: new Date('2021-06-15'),
      updatedAt: new Date('2024-09-20'),
      householdName: 'Johnson Family',
      householdStatus: 'Active' as any,
      memberAccountIds: ['6', '7'],
      billingAggregationLevel: 'Household' as any,
      relationshipId: 'REL-001',
      relationshipName: 'Johnson Extended Family',
      numberOfAccounts: 2,
      totalAUM: 3500000
    },
    {
      id: 'HH-004',
      createdAt: new Date('2019-11-20'),
      updatedAt: new Date('2024-05-15'),
      householdName: 'Williams Retirement',
      householdStatus: 'Inactive' as any,
      memberAccountIds: [],
      billingAggregationLevel: 'Account' as any,
      relationshipId: undefined,
      numberOfAccounts: 0,
      totalAUM: 0
    }
  ];

  // Mock clients for primary contact selection
  const mockClients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Smith Family Trust' },
    { id: '3', name: 'Tech Startup LLC' },
    { id: '4', name: 'Robert Johnson' },
    { id: '5', name: 'Mary Johnson' },
    { id: '6', name: 'David Williams' }
  ];

  // Mock fee schedules
  const mockFeeSchedules = [
    { id: 'FS-001', name: 'Standard Tiered' },
    { id: 'FS-002', name: 'Premium Flat' },
    { id: 'FS-003', name: 'Corporate Standard' }
  ];

  const [householdSearchTerm, setHouseholdSearchTerm] = useState('');
  const [formData, setFormData] = useState<RelationshipFormData>({
    relationshipName: '',
    relationshipStatus: RelationshipStatus.ACTIVE,
    memberHouseholdIds: [],
    primaryContactClientId: undefined,
    feeScheduleId: undefined,
    customFeeAdjustment: undefined,
    notes: '',
    establishedDate: new Date()
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (relationship) {
      setFormData({
        id: relationship.id,
        relationshipName: relationship.relationshipName,
        relationshipStatus: relationship.relationshipStatus,
        memberHouseholdIds: relationship.memberHouseholdIds,
        primaryContactClientId: relationship.primaryContactClientId,
        feeScheduleId: relationship.feeScheduleId,
        customFeeAdjustment: relationship.customFeeAdjustment,
        notes: relationship.notes || '',
        establishedDate: relationship.establishedDate
      });
    } else {
      setFormData({
        relationshipName: '',
        relationshipStatus: RelationshipStatus.ACTIVE,
        memberHouseholdIds: [],
        primaryContactClientId: undefined,
        feeScheduleId: undefined,
        customFeeAdjustment: undefined,
        notes: '',
        establishedDate: new Date()
      });
    }
    setErrors({});
    setHouseholdSearchTerm('');
  }, [relationship, isOpen]);

  const handleChange = (field: keyof RelationshipFormData, value: any) => {
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

  const handleHouseholdToggle = (householdId: string) => {
    const currentHouseholds = [...formData.memberHouseholdIds];
    const index = currentHouseholds.indexOf(householdId);

    if (index > -1) {
      currentHouseholds.splice(index, 1);
    } else {
      currentHouseholds.push(householdId);
    }

    handleChange('memberHouseholdIds', currentHouseholds);
  };

  // Filter households to only show available ones (not in other relationships)
  // When editing, include households from the current relationship
  const availableHouseholds = useMemo(() => {
    return mockHouseholds.filter(household => {
      // If editing this relationship, include its own households
      if (relationship && household.relationshipId === relationship.id) {
        return true;
      }
      // Otherwise, only include households without a relationship
      return !household.relationshipId;
    });
  }, [relationship]);

  // Filter households based on search
  const filteredHouseholds = useMemo(() => {
    let households = availableHouseholds;

    if (householdSearchTerm.trim()) {
      const searchLower = householdSearchTerm.toLowerCase();
      households = households.filter(household =>
        household.householdName.toLowerCase().includes(searchLower)
      );
    }

    return households;
  }, [householdSearchTerm, availableHouseholds]);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.relationshipName.trim()) {
      newErrors.relationshipName = 'Relationship name is required';
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
    const allHouseholdIds = filteredHouseholds.map(h => h.id);
    handleChange('memberHouseholdIds', allHouseholdIds);
  };

  const handleDeselectAll = () => {
    handleChange('memberHouseholdIds', []);
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

  // Calculate total AUM from selected households
  const totalAUM = useMemo(() => {
    return availableHouseholds
      .filter(h => formData.memberHouseholdIds.includes(h.id))
      .reduce((sum, h) => sum + (h.totalAUM || 0), 0);
  }, [formData.memberHouseholdIds, availableHouseholds]);

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
              backgroundColor: '#fff5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={20} color="#dc3545" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
              {relationship ? 'Edit Relationship' : 'Add New Relationship'}
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
                  Relationship Name *
                </label>
                <input
                  type="text"
                  value={formData.relationshipName}
                  onChange={(e) => handleChange('relationshipName', e.target.value)}
                  placeholder="e.g., Johnson Extended Family, Smith Multi-Gen Trust"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: `1px solid ${errors.relationshipName ? '#f44336' : '#ddd'}`,
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {errors.relationshipName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', color: '#f44336', fontSize: '12px' }}>
                    <AlertCircle size={14} />
                    {errors.relationshipName}
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
                    value={formData.relationshipStatus}
                    onChange={(e) => handleChange('relationshipStatus', e.target.value as RelationshipStatus)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    <option value={RelationshipStatus.ACTIVE}>Active</option>
                    <option value={RelationshipStatus.INACTIVE}>Inactive</option>
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

            {/* Member Households */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                  Member Households
                </h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      padding: '4px 12px',
                      fontSize: '12px',
                      backgroundColor: 'transparent',
                      border: '1px solid #dc3545',
                      color: '#dc3545',
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
                Select households to include in this relationship. Only households not already in other relationships are shown.
              </p>

              {/* Availability Info */}
              {mockHouseholds.length > availableHouseholds.length && (
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffb74d',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  fontSize: '13px',
                  color: '#e65100'
                }}>
                  <strong>Note:</strong> {mockHouseholds.length - availableHouseholds.length} household{mockHouseholds.length - availableHouseholds.length !== 1 ? 's are' : ' is'} already assigned to other relationships and cannot be selected.
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
                  placeholder="Search by household name..."
                  value={householdSearchTerm}
                  onChange={(e) => setHouseholdSearchTerm(e.target.value)}
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
              {formData.memberHouseholdIds.length > 0 && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#ffebee',
                  borderRadius: '6px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckSquare size={16} color="#d32f2f" />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d32f2f' }}>
                      {formData.memberHouseholdIds.length} household{formData.memberHouseholdIds.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} color="#d32f2f" />
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#d32f2f' }}>
                      Total: {formatCurrency(totalAUM)}
                    </span>
                  </div>
                </div>
              )}

              {/* Household List */}
              <div style={{
                border: '1px solid #e0e0e0',
                borderRadius: '6px',
                maxHeight: '300px',
                overflowY: 'auto'
              }}>
                {filteredHouseholds.length === 0 ? (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#999' }}>
                    <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <p style={{ fontSize: '14px', margin: 0 }}>
                      {householdSearchTerm ? `No households found matching "${householdSearchTerm}"` : 'No available households'}
                    </p>
                  </div>
                ) : (
                  filteredHouseholds.map(household => {
                    const isSelected = formData.memberHouseholdIds.includes(household.id);
                    return (
                      <label
                        key={household.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          backgroundColor: isSelected ? '#fff5f5' : 'transparent',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isSelected ? (
                            <CheckSquare size={20} color="#dc3545" style={{ cursor: 'pointer' }} onClick={() => handleHouseholdToggle(household.id)} />
                          ) : (
                            <Square size={20} color="#999" style={{ cursor: 'pointer' }} onClick={() => handleHouseholdToggle(household.id)} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {household.householdName}
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              backgroundColor: '#f5f5f5',
                              borderRadius: '8px',
                              fontSize: '11px',
                              color: '#666'
                            }}>
                              {household.numberOfAccounts || 0} accounts
                            </span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {formatCurrency(household.totalAUM)}
                          </div>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Primary Contact */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 'bold',
                marginBottom: '8px',
                color: '#333'
              }}>
                Primary Contact (Optional)
              </label>
              <select
                value={formData.primaryContactClientId || ''}
                onChange={(e) => handleChange('primaryContactClientId', e.target.value || undefined)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select primary contact...</option>
                {mockClients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Fee Configuration */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
                Fee Configuration
              </h3>

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
                    <option value="">Default (from household)</option>
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
                placeholder="Additional notes about this relationship..."
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
                background: '#dc3545',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {relationship ? 'Save Changes' : 'Create Relationship'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RelationshipFormModal;
