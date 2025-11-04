import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  Users
} from 'lucide-react';
import { Account, AccountStatus, ReconciliationStatus, AccountMismatch, AccountFormData } from '../types/Account';
import AccountFormModal from './AccountFormModal';
import { useFirm } from '../contexts/FirmContext';
import { accountsService } from '../services/api/accounts.service';
import { masterAccountsService } from '../services/api/masterAccounts.service';
import { householdsService } from '../services/api/households.service';
import { MasterAccount } from '../types/MasterAccount';
import { Household } from '../types/Household';

const AccountsPage: React.FC = () => {
  const { firmId } = useFirm();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL');
  const [reconciliationFilter, setReconciliationFilter] = useState<ReconciliationStatus | 'ALL' | 'UNMATCHED'>('ALL');
  const [showMismatchesOnly, setShowMismatchesOnly] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isOffboardModalOpen, setIsOffboardModalOpen] = useState(false);
  const [isLinkAccountModalOpen, setIsLinkAccountModalOpen] = useState(false);
  const [isAccountFormModalOpen, setIsAccountFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [masterAccounts, setMasterAccounts] = useState<MasterAccount[]>([]);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch accounts, master accounts, and households from Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!firmId) return;

      setLoading(true);

      // Fetch accounts
      const accountsResponse = await accountsService.getAll(firmId);
      if (accountsResponse.data) {
        setAccounts(accountsResponse.data);
      } else if (accountsResponse.error) {
        console.error('Failed to fetch accounts:', accountsResponse.error);
      }

      // Fetch master accounts
      const masterAccountsResponse = await masterAccountsService.getAll(firmId);
      if (masterAccountsResponse.data) {
        setMasterAccounts(masterAccountsResponse.data);
      } else if (masterAccountsResponse.error) {
        console.error('Failed to fetch master accounts:', masterAccountsResponse.error);
      }

      // Fetch households
      const householdsResponse = await householdsService.getAll(firmId);
      if (householdsResponse.data) {
        setHouseholds(householdsResponse.data);
      } else if (householdsResponse.error) {
        console.error('Failed to fetch households:', householdsResponse.error);
      }

      setLoading(false);
    };

    fetchData();
  }, [firmId]);

  // Mock clients for assignment dropdown
  const mockClients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Smith Family Trust' },
    { id: '3', name: 'Tech Startup LLC' },
    { id: '4', name: 'Jane Doe' },
    { id: '5', name: 'Robert Johnson' },
  ];

  // Transform households for account form (convert to simple name format)
  const availableHouseholds = households.map(h => ({
    id: h.id,
    name: h.householdName
  }));

  // Mock fee schedules for account form
  const mockFeeSchedules = [
    { id: 'FS-001', name: 'Standard Tiered' },
    { id: 'FS-002', name: 'Premium Flat' },
    { id: 'FS-003', name: 'Corporate Standard' },
  ];

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsAccountFormModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountFormModalOpen(true);
  };

  const handleSaveAccount = async (accountData: AccountFormData) => {
    if (!firmId) return;

    if (accountData.id) {
      // Update existing account
      const response = await accountsService.update(accountData.id, accountData);
      if (response.data) {
        // Refetch all accounts to get the client name populated via join
        const accountsResponse = await accountsService.getAll(firmId);
        if (accountsResponse.data) {
          setAccounts(accountsResponse.data);
        }
      } else if (response.error) {
        console.error('Failed to update account:', response.error);
        alert('Failed to update account');
        return;
      }
    } else {
      // Create new account
      const response = await accountsService.create({
        ...accountData,
        firmId,
      });
      if (response.data) {
        // Refetch all accounts to get the client name populated via join
        const accountsResponse = await accountsService.getAll(firmId);
        if (accountsResponse.data) {
          setAccounts(accountsResponse.data);
        }
      } else if (response.error) {
        console.error('Failed to create account:', response.error);
        alert(`Failed to create account: ${response.error}`);
        return;
      }
    }
    setIsAccountFormModalOpen(false);
    setEditingAccount(null);
  };

  const handleAssignClick = (account: Account) => {
    setSelectedAccount(account);
    setIsAssignModalOpen(true);
  };

  const handleOffboardClick = (account: Account) => {
    setSelectedAccount(account);
    setIsOffboardModalOpen(true);
  };

  const handleAssignAccount = async (clientId: string) => {
    if (!selectedAccount || !firmId) return;

    const selectedClient = mockClients.find(c => c.id === clientId);
    if (!selectedClient) return;

    const response = await accountsService.update(selectedAccount.id, {
      clientId,
      clientName: selectedClient.name,
      reconciliationStatus: ReconciliationStatus.MATCHED,
      lastReconciledDate: new Date(),
      reconciliationNotes: `Assigned to ${selectedClient.name} on ${new Date().toLocaleDateString()}`
    });

    if (response.data) {
      // Refetch all accounts to get the client name populated via join
      const accountsResponse = await accountsService.getAll(firmId);
      if (accountsResponse.data) {
        setAccounts(accountsResponse.data);
      }
    } else if (response.error) {
      console.error('Failed to assign account:', response.error);
      alert('Failed to assign account');
      return;
    }

    setIsAssignModalOpen(false);
    setSelectedAccount(null);
  };

  const handleOffboardAccount = async () => {
    if (!selectedAccount || !firmId) return;

    const response = await accountsService.update(selectedAccount.id, {
      accountStatus: AccountStatus.INACTIVE,
      reconciliationStatus: ReconciliationStatus.MATCHED,
      closeDate: new Date(),
      reconciliationNotes: `Marked inactive on ${new Date().toLocaleDateString()}`
    });

    if (response.data) {
      // Refetch all accounts to get the client name populated via join
      const accountsResponse = await accountsService.getAll(firmId);
      if (accountsResponse.data) {
        setAccounts(accountsResponse.data);
      }
    } else if (response.error) {
      console.error('Failed to offboard account:', response.error);
      alert('Failed to offboard account');
      return;
    }

    setIsOffboardModalOpen(false);
    setSelectedAccount(null);
  };

  const handleLinkAccount = async (accountData: { accountNumber: string; clientId: string }) => {
    if (!firmId) return;

    const selectedClient = mockClients.find(c => c.id === accountData.clientId);
    if (!selectedClient) return;

    const response = await accountsService.create({
      firmId,
      accountNumber: accountData.accountNumber,
      accountName: `${selectedClient.name} - Linked Account`,
      accountType: 'Individual' as any,
      accountStatus: AccountStatus.ACTIVE,
      clientId: accountData.clientId,
      clientName: selectedClient.name,
      custodianAccountId: accountData.accountNumber,
      registrationName: selectedClient.name,
      openDate: new Date(),
      currentBalance: 0,
      lastImportDate: new Date(),
      reconciliationStatus: ReconciliationStatus.MATCHED,
      lastReconciledDate: new Date(),
      isExcludedFromBilling: false,
    });

    if (response.data) {
      // Refetch all accounts to get the client name populated via join
      const accountsResponse = await accountsService.getAll(firmId);
      if (accountsResponse.data) {
        setAccounts(accountsResponse.data);
      }
    } else if (response.error) {
      console.error('Failed to link account:', response.error);
      alert('Failed to link account');
      return;
    }

    setIsLinkAccountModalOpen(false);
  };

  // Calculate mismatches
  const mismatches = useMemo((): AccountMismatch[] => {
    const result: AccountMismatch[] = [];

    accounts.forEach(account => {
      if (account.reconciliationStatus === ReconciliationStatus.NEW_ACCOUNT) {
        result.push({
          type: 'new_account',
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          currentBalance: account.currentBalance,
          lastSeen: account.lastImportDate,
          details: 'Account exists in custodian data but not assigned to any client profile'
        });
      } else if (account.reconciliationStatus === ReconciliationStatus.DELINKED) {
        result.push({
          type: 'delinked',
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          clientName: account.clientName,
          lastSeen: account.lastImportDate,
          details: 'Account in client profile but not found in recent custodian import'
        });
      }
    });

    return result;
  }, [accounts]);

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.accountNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           account.clientName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || account.accountStatus === statusFilter;

      // Handle UNMATCHED filter (shows accounts without a client assignment)
      const matchesReconciliation = reconciliationFilter === 'ALL' ||
                                   (reconciliationFilter === 'UNMATCHED'
                                     ? !account.clientId
                                     : account.reconciliationStatus === reconciliationFilter);

      const matchesMismatch = !showMismatchesOnly ||
                             account.reconciliationStatus === ReconciliationStatus.NEW_ACCOUNT ||
                             account.reconciliationStatus === ReconciliationStatus.DELINKED;

      return matchesSearch && matchesStatus && matchesReconciliation && matchesMismatch;
    });
  }, [accounts, searchTerm, statusFilter, reconciliationFilter, showMismatchesOnly]);

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
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

  const getReconciliationBadge = (status: ReconciliationStatus) => {
    const config = {
      [ReconciliationStatus.MATCHED]: {
        bg: '#e8f5e9',
        color: '#2e7d32',
        icon: <CheckCircle size={14} />
      },
      [ReconciliationStatus.NEW_ACCOUNT]: {
        bg: '#fff3e0',
        color: '#f57c00',
        icon: <AlertTriangle size={14} />
      },
      [ReconciliationStatus.DELINKED]: {
        bg: '#ffebee',
        color: '#c62828',
        icon: <XCircle size={14} />
      },
      [ReconciliationStatus.PENDING_LINK]: {
        bg: '#e3f2fd',
        color: '#1565c0',
        icon: <Link2 size={14} />
      },
    };

    const style = config[status] || {
      bg: '#f5f5f5',
      color: '#666',
      icon: <AlertTriangle size={14} />
    };

    return (
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        backgroundColor: style.bg,
        color: style.color
      }}>
        {style.icon}
        {status || 'Unknown'}
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
            Account Management
          </h1>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Manage accounts and reconcile with custodian data
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleAddAccount}
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
            Add Account
          </button>
          <button
            onClick={() => setIsLinkAccountModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              backgroundColor: 'white',
              color: '#2196f3',
              border: '2px solid #2196f3',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          >
            <Link2 size={18} />
            Link Existing
          </button>
        </div>
      </div>

      {/* Mismatch Alert Banner */}
      {mismatches.length > 0 && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fff3e0',
          border: '1px solid #ffb74d',
          borderRadius: '8px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={24} color="#f57c00" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold', color: '#e65100', marginBottom: '4px' }}>
              {mismatches.length} Account Mismatch{mismatches.length > 1 ? 'es' : ''} Detected
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {mismatches.filter(m => m.type === 'new_account').length} new account(s) need client assignment • {' '}
              {mismatches.filter(m => m.type === 'delinked').length} delinked account(s) need review
            </div>
          </div>
          <button
            onClick={() => setShowMismatchesOnly(!showMismatchesOnly)}
            style={{
              padding: '8px 16px',
              backgroundColor: showMismatchesOnly ? '#f57c00' : 'white',
              color: showMismatchesOnly ? 'white' : '#f57c00',
              border: `1px solid #f57c00`,
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
            }}
          >
            {showMismatchesOnly ? 'Show All' : 'Show Mismatches Only'}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Total Accounts</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#2196f3' }}>{accounts.length}</div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Matched</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4caf50' }}>
            {accounts.filter(a => a.reconciliationStatus === ReconciliationStatus.MATCHED).length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>New Accounts</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff9800' }}>
            {accounts.filter(a => a.reconciliationStatus === ReconciliationStatus.NEW_ACCOUNT).length}
          </div>
        </div>
        <div style={{
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          border: '1px solid #e0e0e0'
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>Delinked</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f44336' }}>
            {accounts.filter(a => a.reconciliationStatus === ReconciliationStatus.DELINKED).length}
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
            {formatCurrency(accounts.reduce((sum, a) => sum + (a.currentBalance || 0), 0))}
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
        border: '1px solid #e0e0e0',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <Search size={18} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search by account, number, or client..."
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
            onChange={(e) => setStatusFilter(e.target.value as AccountStatus | 'ALL')}
            style={{
              padding: '10px 32px 10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '150px'
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value={AccountStatus.ACTIVE}>Active</option>
            <option value={AccountStatus.INACTIVE}>Inactive</option>
            <option value={AccountStatus.CLOSED}>Closed</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={reconciliationFilter}
            onChange={(e) => setReconciliationFilter(e.target.value as ReconciliationStatus | 'ALL' | 'UNMATCHED')}
            style={{
              padding: '10px 32px 10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer',
              minWidth: '180px'
            }}
          >
            <option value="ALL">All Reconciliation</option>
            <option value="UNMATCHED">Unmatched</option>
            <option value={ReconciliationStatus.MATCHED}>Matched</option>
            <option value={ReconciliationStatus.NEW_ACCOUNT}>New Accounts</option>
            <option value={ReconciliationStatus.DELINKED}>Delinked</option>
          </select>
        </div>
      </div>

      {/* Accounts Table */}
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
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>ACCOUNT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>CLIENT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>TYPE</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>BALANCE</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>STATUS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>RECONCILIATION</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>LAST IMPORT</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666', backgroundColor: '#f5f5f5' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account, index) => (
                <tr
                  key={account.id}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? 'white' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#333', fontSize: '14px', marginBottom: '4px' }}>
                      {account.accountName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {account.accountNumber}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {account.clientName ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Users size={14} color="#666" />
                        <span style={{ fontSize: '14px', color: '#333' }}>{account.clientName}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: '14px', color: '#f44336', fontWeight: 'bold' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#666'
                    }}>
                      {account.accountType}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                    {formatCurrency(account.currentBalance)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      backgroundColor: account.accountStatus === AccountStatus.ACTIVE ? '#e8f5e9' : '#f5f5f5',
                      color: account.accountStatus === AccountStatus.ACTIVE ? '#2e7d32' : '#999'
                    }}>
                      {account.accountStatus}
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    {getReconciliationBadge(account.reconciliationStatus)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#666' }}>
                    {formatDate(account.lastImportDate)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {account.reconciliationStatus === ReconciliationStatus.NEW_ACCOUNT && (
                        <button
                          onClick={() => handleAssignClick(account)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2196f3',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Assign to Client"
                        >
                          <Link2 size={14} />
                          Assign
                        </button>
                      )}
                      {account.reconciliationStatus === ReconciliationStatus.DELINKED && (
                        <button
                          onClick={() => handleOffboardClick(account)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title="Mark Inactive"
                        >
                          <Unlink size={14} />
                          Offboard
                        </button>
                      )}
                      <button
                        onClick={() => handleEditAccount(account)}
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
                        title="Edit Account"
                      >
                        <Edit2 size={16} color="#666" />
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
            <p style={{ fontSize: '16px' }}>Loading accounts...</p>
          </div>
        )}

        {!loading && filteredAccounts.length === 0 && (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#999'
          }}>
            <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No accounts found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Assign Account Modal */}
      {isAssignModalOpen && selectedAccount && (
        <AssignAccountModal
          account={selectedAccount}
          clients={mockClients}
          onAssign={handleAssignAccount}
          onClose={() => {
            setIsAssignModalOpen(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {/* Offboard Account Modal */}
      {isOffboardModalOpen && selectedAccount && (
        <OffboardAccountModal
          account={selectedAccount}
          onOffboard={handleOffboardAccount}
          onClose={() => {
            setIsOffboardModalOpen(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {/* Link Account Modal */}
      {isLinkAccountModalOpen && (
        <LinkAccountModal
          clients={mockClients}
          onLink={handleLinkAccount}
          onClose={() => setIsLinkAccountModalOpen(false)}
        />
      )}

      {/* Account Form Modal */}
      <AccountFormModal
        isOpen={isAccountFormModalOpen}
        onClose={() => {
          setIsAccountFormModalOpen(false);
          setEditingAccount(null);
        }}
        onSave={handleSaveAccount}
        account={editingAccount}
        availableClients={mockClients}
        availableHouseholds={availableHouseholds}
        availableFeeSchedules={mockFeeSchedules}
        availableMasterAccounts={masterAccounts}
      />
    </div>
  );
};

// Assign Account Modal Component
interface AssignAccountModalProps {
  account: Account;
  clients: { id: string; name: string }[];
  onAssign: (clientId: string) => void;
  onClose: () => void;
}

const AssignAccountModal: React.FC<AssignAccountModalProps> = ({ account, clients, onAssign, onClose }) => {
  const [selectedClientId, setSelectedClientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientId) {
      onAssign(selectedClientId);
    }
  };

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '90%'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          Assign Account to Client
        </h2>
        <div style={{
          padding: '16px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            {account.accountName}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {account.accountNumber}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Select Client *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{
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
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#2196f3',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Assign Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Offboard Account Modal Component
interface OffboardAccountModalProps {
  account: Account;
  onOffboard: () => void;
  onClose: () => void;
}

const OffboardAccountModal: React.FC<OffboardAccountModalProps> = ({ account, onOffboard, onClose }) => {
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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '90%'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#f44336' }}>
          Offboard Account
        </h2>
        <div style={{
          padding: '16px',
          backgroundColor: '#ffebee',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
            {account.accountName}
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
            {account.accountNumber}
          </div>
          <div style={{ fontSize: '13px', color: '#c62828' }}>
            This account was not found in the recent custodian import and may be closed.
          </div>
        </div>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          This will mark the account as inactive and update its reconciliation status.
          The account will no longer appear in mismatch alerts.
        </p>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '1px solid #ddd',
              background: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button
            onClick={onOffboard}
            style={{
              padding: '10px 24px',
              border: 'none',
              background: '#f44336',
              color: 'white',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Mark as Inactive
          </button>
        </div>
      </div>
    </div>
  );
};

// Link Account Modal Component
interface LinkAccountModalProps {
  clients: { id: string; name: string }[];
  onLink: (data: { accountNumber: string; clientId: string }) => void;
  onClose: () => void;
}

const LinkAccountModal: React.FC<LinkAccountModalProps> = ({ clients, onLink, onClose }) => {
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accountNumber && selectedClientId) {
      onLink({ accountNumber, clientId: selectedClientId });
    }
  };

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
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '500px',
        maxWidth: '90%'
      }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
          Link New Account
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Link an existing custodian account to a client profile.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Account Number *
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              placeholder="Enter custodian account number"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '8px'
            }}>
              Select Client *
            </label>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px'
              }}
            >
              <option value="">Choose a client...</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{
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
                fontWeight: 'bold'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 24px',
                border: 'none',
                background: '#2196f3',
                color: 'white',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Link Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AccountsPage;
