import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  Users,
  Home,
  DollarSign,
  Building2,
  TrendingUp
} from 'lucide-react';
import { Relationship, RelationshipStatus, RelationshipFormData } from '../types/Relationship';
import RelationshipFormModal from './RelationshipFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const RelationshipsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RelationshipStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRelationship, setDeletingRelationship] = useState<Relationship | null>(null);

  // Mock data for demonstration
  const mockRelationships: Relationship[] = [
    {
      id: 'REL-001',
      createdAt: new Date('2021-06-15'),
      updatedAt: new Date('2024-10-04'),
      relationshipName: 'Johnson Extended Family',
      relationshipStatus: RelationshipStatus.ACTIVE,
      memberHouseholdIds: ['HH-003'],
      memberHouseholdNames: ['Johnson Family'],
      primaryContactClientId: '4',
      primaryContactClientName: 'Robert Johnson',
      feeScheduleId: 'FS-001',
      feeScheduleName: 'Standard Tiered',
      establishedDate: new Date('2021-06-15'),
      numberOfHouseholds: 1,
      numberOfAccounts: 2,
      totalAUM: 3500000,
      totalAnnualFees: 32500,
      numberOfClients: 2,
      notes: 'Multi-generational family relationship'
    },
    {
      id: 'REL-002',
      createdAt: new Date('2020-03-15'),
      updatedAt: new Date('2024-10-04'),
      relationshipName: 'Smith Multi-Gen Trust',
      relationshipStatus: RelationshipStatus.ACTIVE,
      memberHouseholdIds: [],
      memberHouseholdNames: [],
      primaryContactClientId: '1',
      primaryContactClientName: 'John Smith',
      feeScheduleId: 'FS-001',
      feeScheduleName: 'Standard Tiered',
      establishedDate: new Date('2020-03-15'),
      numberOfHouseholds: 0,
      numberOfAccounts: 0,
      totalAUM: 0,
      totalAnnualFees: 0,
      numberOfClients: 0,
      notes: 'Prepared for future multi-household structure'
    },
    {
      id: 'REL-003',
      createdAt: new Date('2022-08-20'),
      updatedAt: new Date('2024-03-15'),
      relationshipName: 'Williams Business Group',
      relationshipStatus: RelationshipStatus.INACTIVE,
      memberHouseholdIds: [],
      memberHouseholdNames: [],
      primaryContactClientId: '6',
      primaryContactClientName: 'David Williams',
      feeScheduleId: 'FS-003',
      feeScheduleName: 'Corporate Standard',
      establishedDate: new Date('2022-08-20'),
      numberOfHouseholds: 0,
      numberOfAccounts: 0,
      totalAUM: 0,
      totalAnnualFees: 0,
      numberOfClients: 0,
      notes: 'Business dissolved, relationship closed'
    }
  ];

  const [relationships, setRelationships] = useState<Relationship[]>(mockRelationships);

  const handleAddRelationship = () => {
    setEditingRelationship(null);
    setIsModalOpen(true);
  };

  const handleEditRelationship = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setIsModalOpen(true);
  };

  const handleDeleteRelationship = (relationshipId: string) => {
    const relationship = relationships.find(r => r.id === relationshipId);
    if (!relationship) return;

    setDeletingRelationship(relationship);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRelationship = () => {
    if (!deletingRelationship) return;

    // In production, this would:
    // 1. Update all households to remove their relationshipId (unassign from relationship)
    // 2. Delete the relationship record
    // 3. Households remain active and available for reassignment to other relationships

    setRelationships(prev => prev.filter(r => r.id !== deletingRelationship.id));

    // TODO: In production API calls:
    // await updateHouseholdsRelationship(relationship.memberHouseholdIds, null);
    // await deleteRelationship(relationshipId);

    setDeletingRelationship(null);
  };

  const handleSaveRelationship = (relationshipData: RelationshipFormData) => {
    if (relationshipData.id) {
      // Edit existing relationship
      setRelationships(prev => prev.map(r =>
        r.id === relationshipData.id
          ? { ...r, ...relationshipData, updatedAt: new Date() }
          : r
      ));
    } else {
      // Add new relationship
      const newRelationship: Relationship = {
        ...relationshipData,
        id: `REL-${String(relationships.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        relationshipName: relationshipData.relationshipName,
        relationshipStatus: relationshipData.relationshipStatus,
        memberHouseholdIds: relationshipData.memberHouseholdIds,
        numberOfHouseholds: relationshipData.memberHouseholdIds.length,
        numberOfAccounts: 0,
        totalAUM: 0,
        totalAnnualFees: 0,
        numberOfClients: 0
      };
      setRelationships(prev => [...prev, newRelationship]);
    }
    setIsModalOpen(false);
    setEditingRelationship(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRelationship(null);
  };

  const filteredRelationships = useMemo(() => {
    return relationships.filter(relationship => {
      const matchesSearch = relationship.relationshipName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           relationship.primaryContactClientName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || relationship.relationshipStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [relationships, searchTerm, statusFilter]);

  const formatCurrency = (value?: number) => {
    if (!value) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
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
            Relationship Management
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Group households into relationships for the highest level of billing aggregation
          </p>
        </div>
        <button
          onClick={handleAddRelationship}
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
          Add Relationship
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
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Relationships</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc3545' }}>{relationships.length}</div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {relationships.filter(r => r.relationshipStatus === RelationshipStatus.ACTIVE).length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Households</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6f42c1' }}>
            {relationships.reduce((sum, r) => sum + (r.numberOfHouseholds || 0), 0)}
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
            {formatCurrency(relationships.reduce((sum, r) => sum + (r.totalAUM || 0), 0))}
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
            {formatCurrency(relationships.reduce((sum, r) => sum + (r.totalAnnualFees || 0), 0))}
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
            placeholder="Search by relationship name or primary contact..."
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
            onChange={(e) => setStatusFilter(e.target.value as RelationshipStatus | 'ALL')}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={RelationshipStatus.ACTIVE}>Active</option>
            <option value={RelationshipStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* Relationships Table */}
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
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>RELATIONSHIP</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>PRIMARY CONTACT</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>HOUSEHOLDS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACCOUNTS</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>TOTAL AUM</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ANNUAL FEES</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>STATUS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredRelationships.map((relationship, index) => (
                <tr
                  key={relationship.id}
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
                        backgroundColor: '#fff5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Building2 size={20} color="#dc3545" />
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                          {relationship.relationshipName}
                        </div>
                        {relationship.feeScheduleName && (
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            {relationship.feeScheduleName}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} color="#666" />
                      <span style={{ fontSize: '14px', color: '#333' }}>
                        {relationship.primaryContactClientName || 'Not Set'}
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
                      <Home size={14} color="#666" />
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {relationship.numberOfHouseholds || 0}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px', color: '#666' }}>
                    {relationship.numberOfAccounts || 0}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {formatCurrency(relationship.totalAUM)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', color: '#666' }}>
                    {formatCurrency(relationship.totalAnnualFees)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: relationship.relationshipStatus === RelationshipStatus.ACTIVE ? '#e8f5e9' : '#f5f5f5',
                      color: relationship.relationshipStatus === RelationshipStatus.ACTIVE ? '#2e7d32' : '#999'
                    }}>
                      {relationship.relationshipStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditRelationship(relationship)}
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
                        title="Edit Relationship"
                      >
                        <Edit2 size={16} color="#666" />
                      </button>
                      <button
                        onClick={() => handleDeleteRelationship(relationship.id)}
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
                        title="Delete Relationship"
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

        {filteredRelationships.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <Building2 size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No relationships found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Relationship Form Modal */}
      <RelationshipFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveRelationship}
        relationship={editingRelationship}
        existingRelationships={relationships}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingRelationship(null);
        }}
        onConfirm={confirmDeleteRelationship}
        title="Delete Relationship"
        itemName={deletingRelationship?.relationshipName || ''}
        warningMessage={
          deletingRelationship?.numberOfHouseholds && deletingRelationship.numberOfHouseholds > 0
            ? `This relationship contains ${deletingRelationship.numberOfHouseholds} household${deletingRelationship.numberOfHouseholds !== 1 ? 's' : ''}.`
            : undefined
        }
        impactList={[
          'Remove the relationship',
          ...(deletingRelationship?.numberOfHouseholds && deletingRelationship.numberOfHouseholds > 0
            ? [`Unassign ${deletingRelationship.numberOfHouseholds} household${deletingRelationship.numberOfHouseholds !== 1 ? 's' : ''} from this relationship`]
            : []
          ),
          'Keep all households and accounts active and available for reassignment'
        ]}
        isDangerous={false}
      />
    </div>
  );
};

export default RelationshipsPage;
