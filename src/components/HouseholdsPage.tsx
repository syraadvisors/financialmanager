import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  Home,
  DollarSign,
  UserCheck,
  TrendingUp
} from 'lucide-react';
import { Household, HouseholdStatus, BillingAggregationLevel, HouseholdFormData } from '../types/Household';
import HouseholdFormModal from './HouseholdFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useFirm } from '../contexts/FirmContext';
import { householdsService } from '../services/api/households.service';

const HouseholdsPage: React.FC = () => {
  const { firmId } = useFirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<HouseholdStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHousehold, setEditingHousehold] = useState<Household | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingHousehold, setDeletingHousehold] = useState<Household | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch households from Supabase
  useEffect(() => {
    const fetchHouseholds = async () => {
      if (!firmId) return;

      setLoading(true);
      const response = await householdsService.getAll(firmId);

      if (response.data) {
        setHouseholds(response.data);
      } else if (response.error) {
        console.error('Failed to fetch households:', response.error);
      }

      setLoading(false);
    };

    fetchHouseholds();
  }, [firmId]);

  const handleAddHousehold = () => {
    setEditingHousehold(null);
    setIsModalOpen(true);
  };

  const handleEditHousehold = (household: Household) => {
    setEditingHousehold(household);
    setIsModalOpen(true);
  };

  const handleDeleteHousehold = (householdId: string) => {
    const household = households.find(h => h.id === householdId);
    if (!household) return;

    setDeletingHousehold(household);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteHousehold = async () => {
    if (!deletingHousehold) return;

    const response = await householdsService.delete(deletingHousehold.id);

    if (response.error) {
      console.error('Failed to delete household:', response.error);
      alert('Failed to delete household');
      return;
    }

    setHouseholds(prev => prev.filter(h => h.id !== deletingHousehold.id));
    setIsDeleteModalOpen(false);
    setDeletingHousehold(null);
  };

  const handleSaveHousehold = async (householdData: HouseholdFormData) => {
    if (!firmId) return;

    if (householdData.id) {
      // Update existing household
      const response = await householdsService.update(householdData.id, householdData);
      if (response.data) {
        setHouseholds(prev => prev.map(h =>
          h.id === householdData.id ? response.data! : h
        ));
      } else if (response.error) {
        console.error('Failed to update household:', response.error);
        alert('Failed to update household');
        return;
      }
    } else {
      // Create new household
      const response = await householdsService.create({
        ...householdData,
        firmId,
      });
      if (response.data) {
        setHouseholds(prev => [...prev, response.data!]);
      } else if (response.error) {
        console.error('Failed to create household:', response.error);
        alert('Failed to create household');
        return;
      }
    }
    setIsModalOpen(false);
    setEditingHousehold(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingHousehold(null);
  };

  const filteredHouseholds = useMemo(() => {
    return households.filter(household => {
      const matchesSearch = household.householdName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           household.primaryClientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           household.relationshipName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || household.householdStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [households, searchTerm, statusFilter]);

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getBillingAggregationBadge = (level: BillingAggregationLevel) => {
    const config = {
      [BillingAggregationLevel.ACCOUNT]: { bg: '#e3f2fd', color: '#1565c0', label: 'Account-Level' },
      [BillingAggregationLevel.HOUSEHOLD]: { bg: '#f3e8ff', color: '#6f42c1', label: 'Household' },
      [BillingAggregationLevel.RELATIONSHIP]: { bg: '#fff3e0', color: '#f57c00', label: 'Relationship' }
    };

    const style = config[level];
    return (
      <span style={{
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.label}
      </span>
    );
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>
            Household Management
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Group clients and accounts into households for aggregated billing
          </p>
        </div>
        <button
          onClick={handleAddHousehold}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          <Plus size={18} />
          Add Household
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Households</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>{households.length}</div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {households.filter(h => h.householdStatus === HouseholdStatus.ACTIVE).length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Accounts</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
            {households.reduce((sum, h) => sum + (h.numberOfAccounts || 0), 0)}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total AUM</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#9c27b0' }}>
            {formatCurrency(households.reduce((sum, h) => sum + (h.totalAUM || 0), 0))}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Annual Fees</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f44336' }}>
            {formatCurrency(households.reduce((sum, h) => sum + (h.totalAnnualFees || 0), 0))}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div style={{
        display: 'flex',
        gap: '16px',
        marginBottom: '24px',
        padding: '16px',
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search by household name, client, or relationship..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px 10px 40px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={18} style={{ color: '#666' }} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as HouseholdStatus | 'ALL')}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={HouseholdStatus.ACTIVE}>Active</option>
            <option value={HouseholdStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* Households Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>HOUSEHOLD</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>PRIMARY CONTACT</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>MEMBERS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACCOUNTS</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>TOTAL AUM</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ANNUAL FEES</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>BILLING</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>STATUS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHouseholds.map((household, index) => (
                <tr
                  key={household.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#f3e8ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Home size={20} color="#6f42c1" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                          {household.householdName}
                        </div>
                        {household.relationshipName && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {household.relationshipName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserCheck size={14} color="#666" />
                      <span style={{ fontSize: '14px', color: '#333' }}>
                        {household.primaryClientName || 'Not Set'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '4px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '12px'
                    }}>
                      <Users size={14} color="#666" />
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {household.numberOfClients || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                    {household.numberOfAccounts || 0}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {formatCurrency(household.totalAUM)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#666' }}>
                    {formatCurrency(household.totalAnnualFees)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {getBillingAggregationBadge(household.billingAggregationLevel)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: household.householdStatus === HouseholdStatus.ACTIVE ? '#e8f5e9' : '#f5f5f5',
                      color: household.householdStatus === HouseholdStatus.ACTIVE ? '#2e7d32' : '#999'
                    }}>
                      {household.householdStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditHousehold(household)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Edit Household"
                      >
                        <Edit2 size={16} color="#666" />
                      </button>
                      <button
                        onClick={() => handleDeleteHousehold(household.id)}
                        style={{
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Delete Household"
                      >
                        <Trash2 size={16} color="#f44336" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ fontSize: '16px' }}>Loading households...</p>
          </div>
        )}

        {!loading && filteredHouseholds.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <Home size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No households found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Household Form Modal */}
      <HouseholdFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveHousehold}
        household={editingHousehold}
        existingHouseholds={households}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingHousehold(null);
        }}
        onConfirm={confirmDeleteHousehold}
        title="Delete Household"
        itemName={deletingHousehold?.householdName || ''}
        warningMessage={
          deletingHousehold?.numberOfAccounts && deletingHousehold.numberOfAccounts > 0
            ? `This household contains ${deletingHousehold.numberOfAccounts} active account${deletingHousehold.numberOfAccounts !== 1 ? 's' : ''}.`
            : undefined
        }
        impactList={[
          'Remove the household',
          ...(deletingHousehold?.numberOfAccounts && deletingHousehold.numberOfAccounts > 0
            ? [`Unassign ${deletingHousehold.numberOfAccounts} account${deletingHousehold.numberOfAccounts !== 1 ? 's' : ''} from this household`]
            : []
          ),
          ...(deletingHousehold?.relationshipId
            ? ['Remove household from its relationship']
            : []
          ),
          'Keep all accounts active and available for reassignment'
        ]}
        isDangerous={false}
      />
    </div>
  );
};

export default HouseholdsPage;
