import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Edit,
  Trash2,
  Lock,
  Unlock,
  X,
  Save,
  AlertTriangle,
  Filter,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  billingPeriodsService,
  BillingPeriod,
  CreateBillingPeriodInput,
  UpdateBillingPeriodInput,
  PeriodType,
  PeriodFrequency,
  PeriodStatus,
} from '../services/api/billingPeriods.service';

const BillingPeriodsPage: React.FC = () => {
  const { user, userProfile } = useAuth();
  const [periods, setPeriods] = useState<BillingPeriod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<PeriodType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<PeriodStatus | 'all'>('all');

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<CreateBillingPeriodInput>>({
    periodType: 'standard',
    frequency: 'Quarterly',
    status: 'Draft',
  });

  // Load periods on mount
  useEffect(() => {
    loadPeriods();
  }, [user, userProfile]);

  const loadPeriods = async () => {
    if (!user || !userProfile?.firmId) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await billingPeriodsService.getAll(userProfile.firmId);

      if (result.error) {
        setError(result.error);
      } else {
        setPeriods(result.data || []);
      }
    } catch (err) {
      console.error('Error loading billing periods:', err);
      setError('Failed to load billing periods');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter periods
  const filteredPeriods = useMemo(() => {
    return periods.filter((period) => {
      if (filterType !== 'all' && period.periodType !== filterType) return false;
      if (filterStatus !== 'all' && period.status !== filterStatus) return false;
      return true;
    });
  }, [periods, filterType, filterStatus]);

  const handleCreate = async () => {
    if (!user || !userProfile?.firmId || !formData.periodName || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      const input: CreateBillingPeriodInput = {
        ...formData as CreateBillingPeriodInput,
        firmId: userProfile.firmId,
      };

      const result = await billingPeriodsService.create(input);

      if (result.error) {
        setError(result.error);
      } else {
        await loadPeriods();
        setIsCreating(false);
        setFormData({
          periodType: 'standard',
          frequency: 'Quarterly',
          status: 'Draft',
        });
        setError(null);
      }
    } catch (err) {
      console.error('Error creating billing period:', err);
      setError('Failed to create billing period');
    }
  };

  const handleUpdate = async (id: string, updates: UpdateBillingPeriodInput) => {
    try {
      const result = await billingPeriodsService.update(id, updates);

      if (result.error) {
        setError(result.error);
      } else {
        await loadPeriods();
        setEditingId(null);
        setError(null);
      }
    } catch (err) {
      console.error('Error updating billing period:', err);
      setError('Failed to update billing period');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this billing period?')) {
      return;
    }

    try {
      const result = await billingPeriodsService.delete(id);

      if (result.error) {
        setError(result.error);
      } else {
        await loadPeriods();
        setError(null);
      }
    } catch (err) {
      console.error('Error deleting billing period:', err);
      setError('Failed to delete billing period');
    }
  };

  const handleLockToggle = async (period: BillingPeriod) => {
    try {
      const result = period.isLocked
        ? await billingPeriodsService.unlock(period.id!)
        : await billingPeriodsService.lock(period.id!);

      if (result.error) {
        setError(result.error);
      } else {
        await loadPeriods();
        setError(null);
      }
    } catch (err) {
      console.error('Error toggling lock:', err);
      setError('Failed to toggle lock status');
    }
  };

  const handleGenerateStandardPeriods = async () => {
    if (!user || !userProfile?.firmId) return;

    const year = new Date().getFullYear();
    const frequency = window.prompt(
      'Enter frequency (Monthly, Quarterly, Semi-Annual, Annual):',
      'Quarterly'
    ) as PeriodFrequency;

    if (!frequency) return;

    try {
      const result = await billingPeriodsService.generateStandardPeriods(
        userProfile.firmId,
        year,
        frequency
      );

      if (result.error) {
        setError(result.error);
      } else {
        await loadPeriods();
        setError(null);
      }
    } catch (err) {
      console.error('Error generating periods:', err);
      setError('Failed to generate standard periods');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getStatusConfig = (status: PeriodStatus) => {
    switch (status) {
      case 'Closed':
        return {
          icon: <CheckCircle size={20} />,
          color: '#4caf50',
          bg: '#e8f5e9',
          label: 'Closed',
          border: '#a5d6a7',
        };
      case 'Active':
        return {
          icon: <Clock size={20} />,
          color: '#2196f3',
          bg: '#e3f2fd',
          label: 'Active',
          border: '#90caf9',
        };
      case 'Draft':
        return {
          icon: <Edit size={20} />,
          color: '#ff9800',
          bg: '#fff3e0',
          label: 'Draft',
          border: '#ffb74d',
        };
      case 'Cancelled':
        return {
          icon: <X size={20} />,
          color: '#f44336',
          bg: '#ffebee',
          label: 'Cancelled',
          border: '#ef9a9a',
        };
    }
  };

  const calculateDaysInPeriod = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <p>Loading billing periods...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '8px',
            }}
          >
            Billing Periods
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Manage standard (recurring) and custom (one-time) billing periods
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleGenerateStandardPeriods}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            <Calendar size={16} />
            Generate Standard Periods
          </button>
          <button
            onClick={() => setIsCreating(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            <Plus size={16} />
            Create Period
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#ffebee',
            border: '1px solid #ef9a9a',
            borderRadius: '6px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} color="#f44336" />
          <span style={{ color: '#c62828', fontSize: '14px' }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <X size={16} color="#c62828" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#666" />
          <label style={{ fontSize: '14px', color: '#666' }}>Type:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as PeriodType | 'all')}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="all">All</option>
            <option value="standard">Standard</option>
            <option value="custom">Custom</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as PeriodStatus | 'all')}
            style={{
              padding: '6px 12px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '14px',
            }}
          >
            <option value="all">All</option>
            <option value="Draft">Draft</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div
          style={{
            padding: '24px',
            backgroundColor: 'white',
            borderRadius: '8px',
            border: '2px solid #007bff',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>
            Create New Billing Period
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '16px',
            }}
          >
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Period Name *
              </label>
              <input
                type="text"
                value={formData.periodName || ''}
                onChange={(e) => setFormData({ ...formData, periodName: e.target.value })}
                placeholder="e.g., Q1 2025 or Special Mid-Year Period"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Period Type *
              </label>
              <select
                value={formData.periodType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    periodType: e.target.value as PeriodType,
                    frequency: e.target.value === 'standard' ? 'Quarterly' : undefined,
                  })
                }
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="standard">Standard (Recurring)</option>
                <option value="custom">Custom (One-Time)</option>
              </select>
            </div>
            {formData.periodType === 'standard' && (
              <div>
                <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value as PeriodFrequency })
                  }
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                  }}
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Semi-Annual">Semi-Annual</option>
                  <option value="Annual">Annual</option>
                </select>
              </div>
            )}
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PeriodStatus })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Billing Date
              </label>
              <input
                type="date"
                value={formData.billingDate || ''}
                onChange={(e) => setFormData({ ...formData, billingDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Due Date
              </label>
              <input
                type="date"
                value={formData.dueDate || ''}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '14px', color: '#666', display: 'block', marginBottom: '4px' }}>
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                setIsCreating(false);
                setFormData({ periodType: 'standard', frequency: 'Quarterly', status: 'Draft' });
              }}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f5f5f5',
                color: '#666',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
              }}
            >
              <Save size={16} />
              Create Period
            </button>
          </div>
        </div>
      )}

      {/* Periods List */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#f5f5f5',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#333' }}>
            Billing Periods ({filteredPeriods.length})
          </h2>
        </div>

        <div style={{ padding: '16px' }}>
          {filteredPeriods.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p style={{ fontSize: '16px', marginBottom: '8px' }}>No billing periods found</p>
              <p style={{ fontSize: '14px' }}>
                Create your first billing period or generate standard periods for the year.
              </p>
            </div>
          ) : (
            filteredPeriods.map((period, index) => {
              const statusConfig = getStatusConfig(period.status);
              const daysInPeriod = calculateDaysInPeriod(period.startDate, period.endDate);

              return (
                <div
                  key={period.id}
                  style={{
                    padding: '20px',
                    marginBottom: index < filteredPeriods.length - 1 ? '12px' : 0,
                    border: `2px solid ${statusConfig.border}`,
                    borderRadius: '8px',
                    backgroundColor: statusConfig.bg,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    {/* Left side - Period info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: `2px solid ${statusConfig.color}`,
                          }}
                        >
                          <div style={{ color: statusConfig.color }}>{statusConfig.icon}</div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
                              {period.periodName}
                            </div>
                            <div
                              style={{
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: 'bold',
                                backgroundColor: period.periodType === 'standard' ? '#e3f2fd' : '#fff3e0',
                                color: period.periodType === 'standard' ? '#1976d2' : '#f57c00',
                                border: `1px solid ${period.periodType === 'standard' ? '#90caf9' : '#ffb74d'}`,
                              }}
                            >
                              {period.periodType === 'standard' ? 'Standard' : 'Custom'}
                            </div>
                            {period.isLocked && (
                              <span title="Locked">
                                <Lock size={16} color="#f44336" />
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: 'inline-block',
                              padding: '3px 10px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 'bold',
                              backgroundColor: 'white',
                              color: statusConfig.color,
                              border: `1px solid ${statusConfig.color}`,
                            }}
                          >
                            {statusConfig.label}
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '16px',
                          marginTop: '16px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Period Number
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {period.periodNumber}
                          </div>
                        </div>

                        {period.periodType === 'standard' && period.frequency && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              Frequency
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {period.frequency}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Period Dates
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {formatDate(period.startDate)} - {formatDate(period.endDate)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                            Days in Period
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                            {daysInPeriod} days
                          </div>
                        </div>

                        {period.billingDate && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              Billing Date
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {formatDate(period.billingDate)}
                            </div>
                          </div>
                        )}

                        {period.dueDate && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              Due Date
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {formatDate(period.dueDate)}
                            </div>
                          </div>
                        )}

                        {period.accountsBilled !== undefined && period.accountsBilled > 0 && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              Accounts Billed
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                              {period.accountsBilled}
                            </div>
                          </div>
                        )}

                        {period.feesCalculated !== undefined && period.feesCalculated > 0 && (
                          <div>
                            <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                              Total Fees
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 'bold', color: statusConfig.color }}>
                              {formatCurrency(period.feesCalculated)}
                            </div>
                          </div>
                        )}
                      </div>

                      {period.description && (
                        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '6px', fontSize: '13px', color: '#666' }}>
                          {period.description}
                        </div>
                      )}
                    </div>

                    {/* Right side - Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleLockToggle(period)}
                        style={{
                          padding: '8px',
                          backgroundColor: 'white',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                        title={period.isLocked ? 'Unlock' : 'Lock'}
                      >
                        {period.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                      </button>
                      {!period.isLocked && (
                        <>
                          <button
                            onClick={() => handleDelete(period.id!)}
                            style={{
                              padding: '8px',
                              backgroundColor: 'white',
                              border: '1px solid #ddd',
                              borderRadius: '6px',
                              cursor: 'pointer',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={16} color="#f44336" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Info Section */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
        }}
      >
        <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '12px', color: '#333' }}>
          About Billing Periods
        </h3>
        <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.6' }}>
          <p style={{ marginBottom: '8px' }}>
            <strong>Standard (Recurring) Periods:</strong> Automatically generated based on a frequency
            (Monthly, Quarterly, Semi-Annual, or Annual). Use these for regular billing cycles.
          </p>
          <p style={{ marginBottom: '8px' }}>
            <strong>Custom (One-Time) Periods:</strong> Manually created for special billing needs, such as
            mid-quarter adjustments or prorated periods for new clients.
          </p>
          <p style={{ margin: 0 }}>
            <strong>Locked Periods:</strong> Cannot be modified or deleted. Lock a period after billing is
            complete to prevent accidental changes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BillingPeriodsPage;
