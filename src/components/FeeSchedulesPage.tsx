import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Eye } from 'lucide-react';
import { FeeSchedule, FeeScheduleStatus, FeeScheduleTag } from '../types/FeeSchedule';
import FeeScheduleFormModal from './FeeScheduleFormModal';
import { allFeeSchedules } from '../data/feeSchedulesData';

const FeeSchedulesPage: React.FC = () => {
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>(allFeeSchedules);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<FeeScheduleStatus | 'all'>('all');
  const [selectedFeeSchedule, setSelectedFeeSchedule] = useState<FeeSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<FeeSchedule | null>(null);

  // Filter fee schedules
  const filteredSchedules = useMemo(() => {
    let schedules = feeSchedules;

    if (statusFilter !== 'all') {
      schedules = schedules.filter(s => s.status === statusFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      schedules = schedules.filter(s =>
        s.code.toLowerCase().includes(searchLower) ||
        s.name.toLowerCase().includes(searchLower) ||
        s.description.toLowerCase().includes(searchLower)
      );
    }

    return schedules;
  }, [feeSchedules, searchTerm, statusFilter]);

  // Group by status and sort alphabetically
  const groupedSchedules = useMemo(() => {
    const groups = {
      active: filteredSchedules
        .filter(s => s.status === 'active')
        .sort((a, b) => a.name.localeCompare(b.name)),
      inactive: filteredSchedules
        .filter(s => s.status === 'inactive')
        .sort((a, b) => a.name.localeCompare(b.name)),
    };
    return groups;
  }, [filteredSchedules]);

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return 'and up';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (rate: number): string => {
    return `${(rate * 100).toFixed(2)}%`;
  };

  const handleAddSchedule = () => {
    setEditingSchedule(null);
    setIsFormModalOpen(true);
  };

  const handleEditSchedule = (schedule: FeeSchedule) => {
    setEditingSchedule(schedule);
    setIsFormModalOpen(true);
  };

  const handleViewFeeSchedule = (schedule: FeeSchedule) => {
    setSelectedFeeSchedule(schedule);
    setIsViewModalOpen(true);
  };

  const handleSaveSchedule = (schedule: FeeSchedule) => {
    if (editingSchedule) {
      // Update existing
      setFeeSchedules(prev => prev.map(s => s.id === schedule.id ? schedule : s));
    } else {
      // Add new
      setFeeSchedules(prev => [...prev, schedule]);
    }
  };

  const getStatusColor = (status: FeeScheduleStatus): string => {
    switch (status) {
      case 'active':
        return '#2196f3'; // Blue
      case 'inactive':
        return '#f59e0b'; // Orange
      default:
        return '#6b7280';
    }
  };

  const getStatusLabel = (status: FeeScheduleStatus): string => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      default:
        return status;
    }
  };

  const getTagColor = (tag: FeeScheduleTag): string => {
    switch (tag) {
      case 'tiered':
        return '#3b82f6';
      case 'flat':
        return '#10b981';
      case 'custom':
        return '#8b5cf6';
      case 'direct_bill':
        return '#f59e0b';
      case 'minimum_fee':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>
          Fee Schedules
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage fee schedules and billing structures
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        gap: '16px',
      }}>
        {/* Search Input - Left Aligned */}
        <div style={{ width: '800px', position: 'relative' }}>
          <Search
            size={18}
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
            placeholder="Search by code, name, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Right Side - Status and Add Button */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeeScheduleStatus | 'all')}
            style={{
              padding: '10px 12px',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              cursor: 'pointer',
              width: '180px',
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Add Button */}
          <button
            onClick={handleAddSchedule}
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
              whiteSpace: 'nowrap',
            }}
          >
            <Plus size={18} />
            Add Fee Schedule
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          backgroundColor: '#eff6ff',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #bfdbfe',
        }}>
          <div style={{ fontSize: '12px', color: '#2563eb', marginBottom: '4px' }}>Active</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e40af' }}>
            {groupedSchedules.active.length}
          </div>
        </div>
        <div style={{
          backgroundColor: '#fff7ed',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #fed7aa',
        }}>
          <div style={{ fontSize: '12px', color: '#c2410c', marginBottom: '4px' }}>Inactive</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9a3412' }}>
            {groupedSchedules.inactive.length}
          </div>
        </div>
      </div>

      {/* Fee Schedules by Status */}
      {(['active', 'inactive'] as FeeScheduleStatus[]).map((status) => {
        const schedules = groupedSchedules[status];
        if (schedules.length === 0 && statusFilter === 'all') return null;

        return (
          <div key={status} style={{ marginBottom: '32px' }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#1a202c',
              textTransform: 'capitalize',
            }}>
              {getStatusLabel(status)} Fee Schedules ({schedules.length})
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '16px',
            }}>
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = getStatusColor(schedule.status);
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => handleViewFeeSchedule(schedule)}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px',
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1a202c' }}>
                          {schedule.name}
                        </h3>
                        {schedule.isDirectBill && (
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                          }}>
                            DIRECT BILL
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginTop: '2px' }}>
                        Code: {schedule.code}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '11px',
                      padding: '4px 8px',
                      backgroundColor: getStatusColor(schedule.status),
                      color: 'white',
                      borderRadius: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                    }}>
                      {getStatusLabel(schedule.status)}
                    </span>
                  </div>

                  {/* Tags */}
                  {schedule.tags && schedule.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      {schedule.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            fontSize: '10px',
                            padding: '3px 8px',
                            backgroundColor: getTagColor(tag),
                            color: 'white',
                            borderRadius: '4px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                          }}
                        >
                          {tag.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Description */}
                  <p style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '12px',
                    minHeight: '36px',
                  }}>
                    {schedule.description}
                  </p>

                  {/* Quick Info */}
                  <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                    {schedule.structureType === 'tiered' && schedule.tiers && (
                      <div>{schedule.tiers.length} tiers</div>
                    )}
                    {schedule.structureType === 'flat_rate' && schedule.flatRate !== undefined && (
                      <div>{formatPercentage(schedule.flatRate)} flat rate</div>
                    )}
                    {schedule.structureType === 'flat_fee' && schedule.flatFeePerQuarter && (
                      <div>{formatCurrency(schedule.flatFeePerQuarter)}/quarter</div>
                    )}
                    {schedule.hasMinimumFee && schedule.minimumFeePerYear && (
                      <div style={{ color: '#f59e0b', marginTop: '4px' }}>
                        ${schedule.minimumFeePerYear.toLocaleString()} min/year
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewFeeSchedule(schedule);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#475569',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f1f5f9';
                        e.currentTarget.style.borderColor = '#cbd5e1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSchedule(schedule);
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#1e40af',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                      }}
                    >
                      <Edit2 size={14} />
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Form Modal */}
      <FeeScheduleFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveSchedule}
        schedule={editingSchedule}
      />

      {/* View Modal */}
      {isViewModalOpen && selectedFeeSchedule && (
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
          onClick={() => setIsViewModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #e2e8f0',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a202c', flex: 1 }}>
                  {selectedFeeSchedule.name}
                </h2>
                <span style={{
                  fontSize: '12px',
                  padding: '4px 12px',
                  backgroundColor: getStatusColor(selectedFeeSchedule.status),
                  color: 'white',
                  borderRadius: '12px',
                  fontWeight: 'bold',
                }}>
                  {getStatusLabel(selectedFeeSchedule.status)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '14px', color: '#64748b', flexWrap: 'wrap', alignItems: 'center' }}>
                <span>Code: <strong>{selectedFeeSchedule.code}</strong></span>
                {selectedFeeSchedule.isDirectBill && (
                  <span style={{
                    padding: '2px 8px',
                    backgroundColor: '#fef3c7',
                    color: '#92400e',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}>
                    DIRECT BILL
                  </span>
                )}
              </div>
              {selectedFeeSchedule.tags && selectedFeeSchedule.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {selectedFeeSchedule.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        backgroundColor: getTagColor(tag),
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                      }}
                    >
                      {tag.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Content */}
            <div style={{ padding: '24px' }}>
              {/* Description */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
                  Description
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  {selectedFeeSchedule.description}
                </p>
              </div>

              {/* Structure Details */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#1a202c', marginBottom: '12px' }}>
                  Fee Structure
                </h3>

                {selectedFeeSchedule.structureType === 'tiered' && selectedFeeSchedule.tiers && (
                  <div style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #e2e8f0',
                  }}>
                    {selectedFeeSchedule.tiers.map((tier, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          marginBottom: index < selectedFeeSchedule.tiers!.length - 1 ? '8px' : '0',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ fontSize: '14px', color: '#475569' }}>
                          {formatCurrency(tier.minAmount)} - {tier.maxAmount ? formatCurrency(tier.maxAmount) : 'and up'}
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e40af' }}>
                          {formatPercentage(tier.rate)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedFeeSchedule.structureType === 'flat_rate' && selectedFeeSchedule.flatRate !== undefined && (
                  <div style={{
                    backgroundColor: '#eff6ff',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #bfdbfe',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1e40af' }}>
                      {formatPercentage(selectedFeeSchedule.flatRate)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      per year on end value
                    </div>
                  </div>
                )}

                {selectedFeeSchedule.structureType === 'flat_fee' && selectedFeeSchedule.flatFeePerQuarter && (
                  <div style={{
                    backgroundColor: '#f0fdf4',
                    borderRadius: '8px',
                    padding: '16px',
                    border: '1px solid #bbf7d0',
                    textAlign: 'center',
                  }}>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#15803d' }}>
                      {formatCurrency(selectedFeeSchedule.flatFeePerQuarter)}
                    </div>
                    <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                      per quarter
                    </div>
                  </div>
                )}
              </div>

              {/* Minimum Fee */}
              {selectedFeeSchedule.hasMinimumFee && selectedFeeSchedule.minimumFeePerYear && (
                <div style={{
                  backgroundColor: '#fffbeb',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #fde68a',
                  marginBottom: '24px',
                }}>
                  <div style={{ fontSize: '12px', color: '#92400e', marginBottom: '4px' }}>
                    Minimum Fee
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309' }}>
                    ${selectedFeeSchedule.minimumFeePerYear.toLocaleString()} per year
                  </div>
                </div>
              )}

              {!selectedFeeSchedule.hasMinimumFee && (
                <div style={{
                  backgroundColor: '#f0fdf4',
                  borderRadius: '8px',
                  padding: '12px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '24px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '14px', color: '#15803d', fontWeight: '500' }}>
                    No Minimum Fee
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                fontSize: '13px',
                color: '#64748b',
              }}>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>Created</div>
                  <div>{selectedFeeSchedule.createdDate}</div>
                </div>
                <div>
                  <div style={{ fontWeight: '500', marginBottom: '4px' }}>Last Modified</div>
                  <div>{selectedFeeSchedule.lastModifiedDate}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              position: 'sticky',
              bottom: 0,
              backgroundColor: 'white',
            }}>
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleEditSchedule(selectedFeeSchedule);
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'white',
                  color: '#2196f3',
                  border: '1px solid #2196f3',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Edit2 size={14} />
                Edit
              </button>
              <button
                onClick={() => setIsViewModalOpen(false)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeSchedulesPage;
