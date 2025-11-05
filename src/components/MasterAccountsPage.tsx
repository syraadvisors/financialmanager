import React, { useState, useMemo, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Building2, Download } from 'lucide-react';
import { MasterAccount } from '../types/MasterAccount';
import MasterAccountFormModal from './MasterAccountFormModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import { masterAccountsService } from '../services/api/masterAccounts.service';
import { accountsService } from '../services/api/accounts.service';
import { useFirm } from '../contexts/FirmContext';
import toast from 'react-hot-toast';

const MasterAccountsPage: React.FC = () => {
  const { firmId } = useFirm();
  const [masterAccounts, setMasterAccounts] = useState<MasterAccount[]>([]);
  const [allAccounts, setAllAccounts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingMasterAccount, setEditingMasterAccount] = useState<MasterAccount | null>(null);
  const [deletingMasterAccount, setDeletingMasterAccount] = useState<MasterAccount | null>(null);

  // Load master accounts and accounts from database
  useEffect(() => {
    const loadData = async () => {
      if (!firmId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Load master accounts
      const maResponse = await masterAccountsService.getAll(firmId);
      if (maResponse.error) {
        toast.error(`Failed to load master accounts: ${maResponse.error}`);
      } else {
        setMasterAccounts(maResponse.data || []);
      }

      // Load all accounts for this firm
      const accountsResponse = await accountsService.getAll(firmId);
      if (accountsResponse.error) {
        toast.error(`Failed to load accounts: ${accountsResponse.error}`);
      } else {
        setAllAccounts(accountsResponse.data || []);
      }

      setIsLoading(false);
    };

    loadData();
  }, [firmId]);

  // Filter master accounts
  const filteredMasterAccounts = useMemo(() => {
    let filtered = masterAccounts;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ma =>
        statusFilter === 'active' ? ma.isActive : !ma.isActive
      );
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(ma =>
        ma.masterAccountNumber.toLowerCase().includes(searchLower) ||
        ma.masterAccountName.toLowerCase().includes(searchLower) ||
        ma.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [masterAccounts, searchTerm, statusFilter]);

  const handleAddMasterAccount = () => {
    setEditingMasterAccount(null);
    setIsFormModalOpen(true);
  };

  const handleEditMasterAccount = (masterAccount: MasterAccount) => {
    setEditingMasterAccount(masterAccount);
    setIsFormModalOpen(true);
  };

  const handleDeleteMasterAccount = (masterAccount: MasterAccount) => {
    setDeletingMasterAccount(masterAccount);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteMasterAccount = async () => {
    if (!deletingMasterAccount) return;

    const deletePromise = masterAccountsService.delete(deletingMasterAccount.id);

    toast.promise(
      deletePromise,
      {
        loading: 'Deleting master account...',
        success: 'Master account deleted successfully',
        error: (err) => `Failed to delete: ${err.error || 'Unknown error'}`,
      }
    );

    const response = await deletePromise;

    if (!response.error) {
      setMasterAccounts(prev => prev.filter(ma => ma.id !== deletingMasterAccount.id));
      setIsDeleteModalOpen(false);
      setDeletingMasterAccount(null);
    }
  };

  const handleSaveMasterAccount = async (masterAccount: MasterAccount) => {
    if (!firmId) {
      toast.error('No firm selected');
      return;
    }

    if (editingMasterAccount) {
      // Update existing
      const updatePromise = masterAccountsService.update(masterAccount.id, masterAccount);

      toast.promise(
        updatePromise,
        {
          loading: 'Updating master account...',
          success: 'Master account updated successfully',
          error: (err) => `Failed to update: ${err.error || 'Unknown error'}`,
        }
      );

      const response = await updatePromise;

      if (!response.error) {
        setMasterAccounts(prev => prev.map(ma =>
          ma.id === masterAccount.id ? response.data! : ma
        ));
        setIsFormModalOpen(false);
      }
    } else {
      // Add new
      const createPromise = masterAccountsService.create(masterAccount, firmId);

      toast.promise(
        createPromise,
        {
          loading: 'Creating master account...',
          success: 'Master account created successfully',
          error: (err) => `Failed to create: ${err.error || 'Unknown error'}`,
        }
      );

      const response = await createPromise;

      if (!response.error) {
        setMasterAccounts(prev => [...prev, response.data!]);
        setIsFormModalOpen(false);
      }
    }
  };

  const handleExportToCSV = () => {
    // Prepare CSV headers
    const headers = [
      'Master Account Number',
      'Master Account Name',
      'Office',
      'Description',
      'Number of Accounts',
      'Total AUM',
      'Status',
      'Created Date',
      'Last Modified Date'
    ];

    // Prepare CSV rows
    const rows = filteredMasterAccounts.map(ma => [
      ma.masterAccountNumber,
      ma.masterAccountName,
      ma.office || '',
      ma.description || '',
      ma.numberOfAccounts?.toString() || '0',
      ma.totalAUM?.toString() || '0',
      ma.isActive ? 'Active' : 'Inactive',
      ma.createdDate,
      ma.lastModifiedDate
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${new Date().toISOString().split('T')[0]}_master_accounts.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const activeMasterAccounts = masterAccounts.filter(ma => ma.isActive);
  const inactiveMasterAccounts = masterAccounts.filter(ma => !ma.isActive);

  if (isLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ padding: '40px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>Loading master accounts...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1a202c' }}>
          Master Accounts
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage master account numbers and assignments
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
        <div style={{ width: '500px', position: 'relative' }}>
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
            placeholder="Search master accounts..."
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
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
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

          {/* Export Button */}
          <button
            onClick={handleExportToCSV}
            disabled={filteredMasterAccounts.length === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              backgroundColor: filteredMasterAccounts.length === 0 ? '#e5e7eb' : 'white',
              color: filteredMasterAccounts.length === 0 ? '#9ca3af' : '#2196f3',
              border: `2px solid ${filteredMasterAccounts.length === 0 ? '#e5e7eb' : '#2196f3'}`,
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: filteredMasterAccounts.length === 0 ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
            }}
            title={filteredMasterAccounts.length === 0 ? 'No data to export' : 'Export to CSV'}
          >
            <Download size={18} />
            Export CSV
          </button>

          {/* Add Button */}
          <button
            onClick={handleAddMasterAccount}
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
            Add Master Account
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
            {activeMasterAccounts.length}
          </div>
        </div>
        <div style={{
          backgroundColor: '#f9fafb',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Inactive</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4b5563' }}>
            {inactiveMasterAccounts.length}
          </div>
        </div>
        <div style={{
          backgroundColor: '#f0fdf4',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #bbf7d0',
        }}>
          <div style={{ fontSize: '12px', color: '#16a34a', marginBottom: '4px' }}>Total AUM</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#15803d' }}>
            ${masterAccounts.reduce((sum, ma) => sum + (ma.totalAUM || 0), 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Master Accounts List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        maxHeight: 'calc(100vh - 500px)',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '200px' }}>
                  Master Account
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '150px' }}>
                  Office
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '250px' }}>
                  Description
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '110px' }}>
                  Accounts
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '140px' }}>
                  Total AUM
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '100px' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', backgroundColor: '#f8fafc', minWidth: '120px' }}>
                  Actions
                </th>
            </tr>
          </thead>
          <tbody>
            {filteredMasterAccounts.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {searchTerm ? 'No master accounts found' : 'No master accounts yet'}
                </td>
              </tr>
            ) : (
              filteredMasterAccounts.map((ma) => (
                <tr
                  key={ma.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Building2 size={20} color="#2196f3" />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}>
                          {ma.masterAccountName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {ma.masterAccountNumber}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#1a202c', fontWeight: '500' }}>
                      {ma.office || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#64748b', maxWidth: '300px' }}>
                      {ma.description || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                      {ma.numberOfAccounts || 0}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: '#1a202c' }}>
                      ${(ma.totalAUM || 0).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: ma.isActive ? '#d1fae5' : '#f3f4f6',
                      color: ma.isActive ? '#065f46' : '#6b7280',
                    }}>
                      {ma.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEditMasterAccount(ma)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#eff6ff',
                          color: '#1e40af',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMasterAccount(ma)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Form Modal */}
      <MasterAccountFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveMasterAccount}
        masterAccount={editingMasterAccount}
        allAccounts={allAccounts}
      />

      {/* Delete Confirmation Modal */}
      {deletingMasterAccount && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={confirmDeleteMasterAccount}
          title="Delete Master Account"
          itemName={deletingMasterAccount.masterAccountName}
          warningMessage="This will unassign all accounts from this master account. The accounts will remain active."
          impactList={[
            `${deletingMasterAccount.numberOfAccounts || 0} account(s) will be unassigned`,
            'Master account number will be removed',
            'This action cannot be undone',
          ]}
          isDangerous={true}
        />
      )}
    </div>
  );
};

export default MasterAccountsPage;
