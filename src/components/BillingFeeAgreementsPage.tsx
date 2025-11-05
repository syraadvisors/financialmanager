import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  FileText,
  Calendar,
  DollarSign,
  Users,
  Home,
  AlertCircle
} from 'lucide-react';
import { BillingFeeAgreement, BillingFeeAgreementStatus } from '../types/BillingFeeAgreement';
import { FeeSchedule } from '../types/FeeSchedule';
import { Relationship } from '../types/Relationship';
import { Client } from '../types/Client';
import BillingFeeAgreementFormModal from './BillingFeeAgreementFormModal';
import BillingFeeAgreementDetailPage from './BillingFeeAgreementDetailPage';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { useFirm } from '../contexts/FirmContext';
import { billingFeeAgreementsService } from '../services/api/billingFeeAgreements.service';
import { feeSchedulesService } from '../services/api/feeSchedules.service';
import { relationshipsService } from '../services/api/relationships.service';
import { clientsService } from '../services/api/clients.service';
import { accountsService } from '../services/api/accounts.service';
import { householdsService } from '../services/api/households.service';

const BillingFeeAgreementsPage: React.FC = () => {
  const { firmId } = useFirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BillingFeeAgreementStatus | 'ALL'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<BillingFeeAgreement | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingAgreement, setDeletingAgreement] = useState<BillingFeeAgreement | null>(null);
  const [agreements, setAgreements] = useState<BillingFeeAgreement[]>([]);
  const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [households, setHouseholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingAgreement, setViewingAgreement] = useState<BillingFeeAgreement | null>(null);

  // Fetch billing fee agreements, fee schedules, relationships, and clients from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!firmId) return;

      setLoading(true);

      // Fetch all data in parallel
      const [agreementsResponse, feeSchedulesResponse, relationshipsResponse, clientsResponse, accountsResponse, householdsResponse] = await Promise.all([
        billingFeeAgreementsService.getAll(firmId),
        feeSchedulesService.getActive(firmId),
        relationshipsService.getAll(firmId),
        clientsService.getAll(),
        accountsService.getAll(firmId),
        householdsService.getAll(firmId)
      ]);

      if (agreementsResponse.data) {
        setAgreements(agreementsResponse.data);
      } else if (agreementsResponse.error) {
        console.error('Failed to fetch billing fee agreements:', agreementsResponse.error);
      }

      if (feeSchedulesResponse.data) {
        console.log('Fetched fee schedules:', feeSchedulesResponse.data.length, feeSchedulesResponse.data);
        setFeeSchedules(feeSchedulesResponse.data);
      } else if (feeSchedulesResponse.error) {
        console.error('Failed to fetch fee schedules:', feeSchedulesResponse.error);
      }

      if (relationshipsResponse.data) {
        setRelationships(relationshipsResponse.data);
      } else if (relationshipsResponse.error) {
        console.error('Failed to fetch relationships:', relationshipsResponse.error);
      }

      if (clientsResponse.data) {
        setClients(clientsResponse.data);
      } else if (clientsResponse.error) {
        console.error('Failed to fetch clients:', clientsResponse.error);
      }

      if (accountsResponse.data) {
        setAccounts(accountsResponse.data);
      } else if (accountsResponse.error) {
        console.error('Failed to fetch accounts:', accountsResponse.error);
      }

      if (householdsResponse.data) {
        setHouseholds(householdsResponse.data);
      } else if (householdsResponse.error) {
        console.error('Failed to fetch households:', householdsResponse.error);
      }

      setLoading(false);
    };

    fetchData();
  }, [firmId]);

  const handleAddAgreement = () => {
    setEditingAgreement(null);
    setIsModalOpen(true);
  };

  const handleEditAgreement = (agreement: BillingFeeAgreement) => {
    setEditingAgreement(agreement);
    setIsModalOpen(true);
  };

  const handleDeleteAgreement = (agreementId: string) => {
    const agreement = agreements.find(a => a.id === agreementId);
    if (!agreement) return;

    setDeletingAgreement(agreement);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteAgreement = async () => {
    if (!deletingAgreement) return;

    const response = await billingFeeAgreementsService.delete(deletingAgreement.id);

    if (response.error) {
      console.error('Failed to delete billing fee agreement:', response.error);
      alert('Failed to delete billing fee agreement');
      return;
    }

    setAgreements(prev => prev.filter(a => a.id !== deletingAgreement.id));
    setIsDeleteModalOpen(false);
    setDeletingAgreement(null);
  };

  const handleSaveAgreement = async (agreementData: any, householdAccountFeeSchedules?: { [householdId: string]: { [accountId: string]: string } }) => {
    if (!firmId) return;

    if (agreementData.id) {
      // Update existing agreement
      const response = await billingFeeAgreementsService.update(agreementData.id, agreementData);
      if (response.data) {
        setAgreements(prev => prev.map(a =>
          a.id === agreementData.id ? response.data! : a
        ));
      } else if (response.error) {
        console.error('Failed to update billing fee agreement:', response.error);
        alert('Failed to update billing fee agreement');
        return;
      }
    } else {
      // Create new agreements - one per household with its account-fee schedule mappings
      if (!householdAccountFeeSchedules || Object.keys(householdAccountFeeSchedules).length === 0) {
        alert('Please select at least one household with account fee schedules');
        return;
      }

      const createdAgreements: any[] = [];
      let hasError = false;
      let totalAccounts = 0;

      // Create one BFA per household
      for (const [householdId, accountFeeScheduleMap] of Object.entries(householdAccountFeeSchedules)) {
        const accountIds = Object.keys(accountFeeScheduleMap);
        totalAccounts += accountIds.length;

        // For each account in this household, create a separate BFA
        for (const [accountId, feeScheduleId] of Object.entries(accountFeeScheduleMap)) {
          const response = await billingFeeAgreementsService.create({
            ...agreementData,
            firmId,
            feeScheduleId, // Individual fee schedule for this account
            householdIds: [householdId], // Single household
            accountIds: [accountId], // Single account per BFA
          });

          if (response.data) {
            createdAgreements.push(response.data);
          } else if (response.error) {
            console.error('Failed to create billing fee agreement for account:', accountId, 'in household:', householdId);
            console.error('Error details:', response.error);
            console.error('Agreement data being sent:', {
              ...agreementData,
              firmId,
              feeScheduleId,
              householdIds: [householdId],
              accountIds: [accountId],
            });
            hasError = true;
            // Continue creating others even if one fails
          }
        }
      }

      if (hasError) {
        alert(`Created ${createdAgreements.length} of ${totalAccounts} billing fee agreements. Some failed - check console for details.`);
      }

      // Add all created agreements to the list
      if (createdAgreements.length > 0) {
        setAgreements(prev => [...prev, ...createdAgreements]);
      }

      if (createdAgreements.length === 0) {
        alert('Failed to create billing fee agreements');
        return;
      }
    }
    setIsModalOpen(false);
    setEditingAgreement(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingAgreement(null);
  };

  // Filter and sort agreements
  const filteredAgreements = useMemo(() => {
    let filtered = agreements.filter(agreement => {
      const matchesSearch = agreement.agreementNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agreement.feeScheduleCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           agreement.relationshipName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || agreement.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    // Sort by status (Active, Pending, Inactive, Terminated) then by agreement number
    return filtered.sort((a, b) => {
      const statusOrder = { 'Active': 1, 'Pending': 2, 'Inactive': 3, 'Terminated': 4 };
      const statusDiff = statusOrder[a.status] - statusOrder[b.status];
      if (statusDiff !== 0) return statusDiff;
      return a.agreementNumber.localeCompare(b.agreementNumber);
    });
  }, [agreements, searchTerm, statusFilter]);

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

  const getStatusColor = (status: BillingFeeAgreementStatus) => {
    const colors = {
      [BillingFeeAgreementStatus.ACTIVE]: { bg: '#e8f5e9', color: '#2e7d32' },
      [BillingFeeAgreementStatus.PENDING]: { bg: '#fff3e0', color: '#f57c00' },
      [BillingFeeAgreementStatus.INACTIVE]: { bg: '#f5f5f5', color: '#999' },
      [BillingFeeAgreementStatus.TERMINATED]: { bg: '#ffebee', color: '#c62828' },
    };
    return colors[status] || { bg: '#f5f5f5', color: '#666' };
  };

  const handleViewExceptions = (agreement: BillingFeeAgreement) => {
    setViewingAgreement(agreement);
  };

  // If viewing an agreement's exceptions, show the detail page
  if (viewingAgreement) {
    return (
      <BillingFeeAgreementDetailPage
        agreement={viewingAgreement}
        onBack={() => setViewingAgreement(null)}
      />
    );
  }

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
            Billing Fee Agreements
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Manage billing fee agreements that link accounts to fee schedules
          </p>
        </div>
        <button
          onClick={handleAddAgreement}
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
          Add Agreement
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
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Agreements</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>{agreements.length}</div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Active</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {agreements.filter(a => a.status === BillingFeeAgreementStatus.ACTIVE).length}
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
            {agreements.reduce((sum, a) => sum + (a.numberOfAccounts || 0), 0)}
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
            {formatCurrency(agreements.reduce((sum, a) => sum + (a.totalAUM || 0), 0))}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Est. Annual Fees</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f44336' }}>
            {formatCurrency(agreements.reduce((sum, a) => sum + (a.estimatedAnnualFees || 0), 0))}
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
            placeholder="Search by agreement number, fee schedule, or relationship..."
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
            onChange={(e) => setStatusFilter(e.target.value as BillingFeeAgreementStatus | 'ALL')}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={BillingFeeAgreementStatus.ACTIVE}>Active</option>
            <option value={BillingFeeAgreementStatus.PENDING}>Pending</option>
            <option value={BillingFeeAgreementStatus.INACTIVE}>Inactive</option>
            <option value={BillingFeeAgreementStatus.TERMINATED}>Terminated</option>
          </select>
        </div>
      </div>

      {/* Agreements Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 500px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '200px' }}>AGREEMENT</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '180px' }}>FEE SCHEDULE</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '180px' }}>RELATIONSHIP</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '110px' }}>ACCOUNTS</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '140px' }}>TOTAL AUM</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '150px' }}>BILLING</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '100px' }}>STATUS</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5', minWidth: '120px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgreements.map((agreement, index) => {
                const statusStyle = getStatusColor(agreement.status);
                return (
                  <tr
                    key={agreement.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                    }}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px' }}>
                        {agreement.agreementNumber}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '14px', color: '#333', fontWeight: '500', marginBottom: '2px' }}>
                        {agreement.feeScheduleCode}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {agreement.feeScheduleName}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                      {agreement.relationshipName || <span style={{ color: '#999' }}>—</span>}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        {agreement.numberOfAccounts || 0}
                      </div>
                      {agreement.numberOfHouseholds ? (
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          {agreement.numberOfHouseholds} households
                        </div>
                      ) : null}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                      {formatCurrency(agreement.totalAUM)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '13px', color: '#666' }}>
                        {agreement.billingFrequency}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {agreement.billingMethod}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color
                      }}>
                        {agreement.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          onClick={() => handleViewExceptions(agreement)}
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
                          title="View Fee Exceptions"
                        >
                          <AlertCircle size={16} color="#2196f3" />
                        </button>
                        <button
                          onClick={() => handleEditAgreement(agreement)}
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
                          title="Edit Agreement"
                        >
                          <Edit2 size={16} color="#666" />
                        </button>
                        <button
                          onClick={() => handleDeleteAgreement(agreement.id)}
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
                          title="Delete Agreement"
                        >
                          <Trash2 size={16} color="#f44336" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {loading && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <p style={{ fontSize: '16px' }}>Loading billing fee agreements...</p>
          </div>
        )}

        {!loading && filteredAgreements.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No billing fee agreements found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Agreement Form Modal */}
      <BillingFeeAgreementFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveAgreement}
        agreement={editingAgreement}
        availableFeeSchedules={feeSchedules}
        availableRelationships={relationships}
        availableClients={clients}
        availableAccounts={accounts}
        availableHouseholds={households}
        existingAgreements={agreements}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingAgreement(null);
        }}
        onConfirm={confirmDeleteAgreement}
        title="Delete Billing Fee Agreement"
        itemName={deletingAgreement?.agreementNumber || ''}
        warningMessage={
          deletingAgreement?.numberOfAccounts && deletingAgreement.numberOfAccounts > 0
            ? `This agreement currently manages ${deletingAgreement.numberOfAccounts} account${deletingAgreement.numberOfAccounts !== 1 ? 's' : ''}.`
            : undefined
        }
        impactList={[
          'Remove the billing fee agreement',
          ...(deletingAgreement?.numberOfAccounts && deletingAgreement.numberOfAccounts > 0
            ? [`${deletingAgreement.numberOfAccounts} account${deletingAgreement.numberOfAccounts !== 1 ? 's' : ''} will no longer have an active billing agreement`]
            : []
          ),
          'Fee calculations will no longer be performed for these accounts',
          'Historical billing records will be preserved'
        ]}
        isDangerous={true}
      />
    </div>
  );
};

export default BillingFeeAgreementsPage;
