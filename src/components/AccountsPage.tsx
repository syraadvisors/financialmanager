import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Link2,
  Unlink,
  DollarSign,
  Users
} from 'lucide-react';
import { Account, AccountStatus, ReconciliationStatus, AccountMismatch, AccountFormData } from '../types/Account';
import AccountFormModal from './AccountFormModal';

const AccountsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AccountStatus | 'ALL'>('ALL');
  const [reconciliationFilter, setReconciliationFilter] = useState<ReconciliationStatus | 'ALL'>('ALL');
  const [showMismatchesOnly, setShowMismatchesOnly] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isOffboardModalOpen, setIsOffboardModalOpen] = useState(false);
  const [isLinkAccountModalOpen, setIsLinkAccountModalOpen] = useState(false);
  const [isAccountFormModalOpen, setIsAccountFormModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Mock data - in production, this would come from API/state management
  const mockAccounts: Account[] = [
    {
      id: '1',
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-12345',
      accountName: 'John Smith Individual',
      accountType: 'Individual' as any,
      accountStatus: AccountStatus.ACTIVE,
      clientId: '1',
      clientName: 'John Smith',
      householdId: 'HH-001',
      householdName: 'Smith Family',
      custodianAccountId: 'CUST-12345',
      registrationName: 'John Smith',
      openDate: new Date('2020-03-15'),
      currentBalance: 1250000,
      lastImportDate: new Date('2024-10-04'),
      reconciliationStatus: ReconciliationStatus.MATCHED,
      lastReconciledDate: new Date('2024-10-04'),
      isExcludedFromBilling: false,
      feeScheduleId: 'FS-001',
      feeScheduleName: 'Standard Tiered'
    },
    {
      id: '2',
      createdAt: new Date('2024-10-04'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-67890',
      accountName: 'Jane Doe IRA',
      accountType: 'IRA Roth' as any,
      accountStatus: AccountStatus.ACTIVE,
      custodianAccountId: 'CUST-67890',
      registrationName: 'Jane Doe IRA',
      openDate: new Date('2024-09-28'),
      currentBalance: 450000,
      lastImportDate: new Date('2024-10-04'),
      reconciliationStatus: ReconciliationStatus.NEW_ACCOUNT,
      reconciliationNotes: 'New account from recent custodian import - needs client assignment',
      isExcludedFromBilling: false,
    },
    {
      id: '3',
      createdAt: new Date('2023-06-10'),
      updatedAt: new Date('2024-09-28'),
      accountNumber: 'ACC-11111',
      accountName: 'Smith Family Trust',
      accountType: 'Trust' as any,
      accountStatus: AccountStatus.INACTIVE,
      clientId: '2',
      clientName: 'Smith Family Trust',
      householdId: 'HH-001',
      householdName: 'Smith Family',
      registrationName: 'Smith Family Revocable Trust',
      openDate: new Date('2021-06-10'),
      closeDate: new Date('2024-09-28'),
      currentBalance: 0,
      lastImportDate: new Date('2024-09-20'),
      reconciliationStatus: ReconciliationStatus.DELINKED,
      reconciliationNotes: 'Account not in recent custodian data - may be closed',
      isExcludedFromBilling: false,
      feeScheduleId: 'FS-002',
      feeScheduleName: 'Premium Flat'
    },
    {
      id: '4',
      createdAt: new Date('2023-03-20'),
      updatedAt: new Date('2024-10-04'),
      accountNumber: 'ACC-22222',
      accountName: 'Tech Startup LLC Operating',
      accountType: 'LLC' as any,
      accountStatus: AccountStatus.ACTIVE,
      clientId: '3',
      clientName: 'Tech Startup LLC',
      custodianAccountId: 'CUST-22222',
      registrationName: 'Tech Startup LLC',
      openDate: new Date('2024-02-01'),
      currentBalance: 1200000,
      lastImportDate: new Date('2024-10-04'),
      reconciliationStatus: ReconciliationStatus.MATCHED,
      lastReconciledDate: new Date('2024-10-04'),
      isExcludedFromBilling: false,
      feeScheduleId: 'FS-003',
      feeScheduleName: 'Corporate Standard'
    },
  ];

  const [accounts, setAccounts] = useState<Account[]>(mockAccounts);

  // Mock clients for assignment dropdown
  const mockClients = [
    { id: '1', name: 'John Smith' },
    { id: '2', name: 'Smith Family Trust' },
    { id: '3', name: 'Tech Startup LLC' },
    { id: '4', name: 'Jane Doe' },
    { id: '5', name: 'Robert Johnson' },
  ];

  // Mock households for account form
  const mockHouseholds = [
    { id: 'HH-001', name: 'Smith Family' },
    { id: 'HH-002', name: 'Johnson Family' },
    { id: 'HH-003', name: 'Doe Family' },
  ];

  // Mock fee schedules for account form
  const mockFeeSchedules = [
    { id: 'FS-001', name: 'Standard Tiered' },
    { id: 'FS-002', name: 'Premium Flat' },
    { id: 'FS-003', name: 'Corporate Standard' },
  ];

  // Mock master accounts for account form
  const mockMasterAccounts = [
    { id: 'MA-001', masterAccountNumber: 'MA-12345', masterAccountName: 'Primary Master Account' },
    { id: 'MA-002', masterAccountNumber: 'MA-67890', masterAccountName: 'Secondary Master Account' },
  ];

  const handleAddAccount = () => {
    setEditingAccount(null);
    setIsAccountFormModalOpen(true);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setIsAccountFormModalOpen(true);
  };

  const handleSaveAccount = (accountData: AccountFormData) => {
    if (accountData.id) {
      // Update existing account
      setAccounts(prev => prev.map(acc =>
        acc.id === accountData.id
          ? { ...acc, ...accountData, updatedAt: new Date() }
          : acc
      ));
    } else {
      // Create new account
      const newAccount: Account = {
        ...accountData,
        id: (accounts.length + 1).toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Account;
      setAccounts(prev => [...prev, newAccount]);
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

  const handleAssignAccount = (clientId: string) => {
    if (!selectedAccount) return;

    const selectedClient = mockClients.find(c => c.id === clientId);
    if (!selectedClient) return;

    setAccounts(prev => prev.map(account =>
      account.id === selectedAccount.id
        ? {
            ...account,
            clientId,
            clientName: selectedClient.name,
            reconciliationStatus: ReconciliationStatus.MATCHED,
            lastReconciledDate: new Date(),
            reconciliationNotes: `Assigned to ${selectedClient.name} on ${new Date().toLocaleDateString()}`
          }
        : account
    ));

    setIsAssignModalOpen(false);
    setSelectedAccount(null);
  };

  const handleOffboardAccount = () => {
    if (!selectedAccount) return;

    setAccounts(prev => prev.map(account =>
      account.id === selectedAccount.id
        ? {
            ...account,
            accountStatus: AccountStatus.INACTIVE,
            reconciliationStatus: ReconciliationStatus.MATCHED,
            closeDate: new Date(),
            reconciliationNotes: `Marked inactive on ${new Date().toLocaleDateString()}`
          }
        : account
    ));

    setIsOffboardModalOpen(false);
    setSelectedAccount(null);
  };

  const handleLinkAccount = (accountData: { accountNumber: string; clientId: string }) => {
    const selectedClient = mockClients.find(c => c.id === accountData.clientId);
    if (!selectedClient) return;

    // In production, this would create a new account linked to existing custodian data
    const newAccount: Account = {
      id: (accounts.length + 1).toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
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
    };

    setAccounts(prev => [...prev, newAccount]);
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
      const matchesReconciliation = reconciliationFilter === 'ALL' || account.reconciliationStatus === reconciliationFilter;
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

    const style = config[status];

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
        {status}
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
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
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
            onChange={(e) => setReconciliationFilter(e.target.value as ReconciliationStatus | 'ALL')}
            style={{
              padding: '10px 16px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Reconciliation</option>
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
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACCOUNT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>CLIENT</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>TYPE</th>
                <th style={{ padding: '16px', textAlign: 'right', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>BALANCE</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>STATUS</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>RECONCILIATION</th>
                <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>LAST IMPORT</th>
                <th style={{ padding: '16px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#666' }}>ACTIONS</th>
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

        {filteredAccounts.length === 0 && (
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
        availableHouseholds={mockHouseholds}
        availableFeeSchedules={mockFeeSchedules}
        availableMasterAccounts={mockMasterAccounts}
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
