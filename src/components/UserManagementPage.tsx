import React, { useState, useEffect, useMemo } from 'react';
import { Users, Shield, Mail, Calendar, Search, Edit2, UserX, UserCheck, Crown, Eye, RefreshCw, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { UserProfile, UserRole, UserStatus } from '../types/User';
import { usersService } from '../services/api/users.service';
import { useFirm } from '../contexts/FirmContext';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import LoadingSkeleton from './LoadingSkeleton';
import ConfirmationDialog from './ConfirmationDialog';
import InviteUserModal from './InviteUserModal';
import PermissionsMatrix from './PermissionsMatrix';
import ExportButton from './ExportButton';

interface PendingAction {
  type: 'role' | 'status' | 'bulk-role' | 'bulk-status';
  userId?: string;
  userName?: string;
  currentValue?: string;
  newValue: string;
  userIds?: string[];
  count?: number;
}

const UserManagementPage: React.FC = () => {
  const { firmId } = useFirm();
  const { userProfile, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showPermissionsMatrix, setShowPermissionsMatrix] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    action: PendingAction | null;
  }>({ isOpen: false, action: null });

  // Check if user has permission to manage users
  const canManageUsers = hasPermission('users.update');
  const canViewUsers = hasPermission('users.view');

  useEffect(() => {
    if (canViewUsers) {
      loadUsers();
    }
  }, [firmId, canViewUsers]);

  const loadUsers = async () => {
    if (!firmId) return;

    setLoading(true);

    const response = await usersService.getAllInFirm(firmId);

    if (response.error) {
      toast.error(response.error);
    } else if (response.data) {
      setUsers(response.data);
    }

    setLoading(false);
  };

  const handleRoleChangeRequest = (userId: string, userName: string, currentRole: UserRole, newRole: UserRole) => {
    setConfirmationDialog({
      isOpen: true,
      action: {
        type: 'role',
        userId,
        userName,
        currentValue: currentRole,
        newValue: newRole,
      },
    });
  };

  const handleStatusChangeRequest = (userId: string, userName: string, currentStatus: UserStatus, newStatus: UserStatus) => {
    setConfirmationDialog({
      isOpen: true,
      action: {
        type: 'status',
        userId,
        userName,
        currentValue: currentStatus,
        newValue: newStatus,
      },
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmationDialog.action) return;

    const { type, userId, newValue } = confirmationDialog.action;

    // Handle bulk actions
    if (type === 'bulk-role' || type === 'bulk-status') {
      await executeBulkAction(confirmationDialog.action);
      setConfirmationDialog({ isOpen: false, action: null });
      setSelectedUserIds(new Set()); // Clear selection after action
      return;
    }

    // Handle single user actions
    if (type === 'role' && userId) {
      const loadingToast = toast.loading('Updating user role...');
      const response = await usersService.updateUserRole(userId, newValue as UserRole);

      if (response.error) {
        toast.error(response.error, { id: loadingToast });
      } else {
        toast.success(`User role updated to ${newValue}`, { id: loadingToast });
        await loadUsers();
      }
    } else if (type === 'status' && userId) {
      const loadingToast = toast.loading('Updating user status...');
      const response = await usersService.updateUserStatus(userId, newValue as UserStatus);

      if (response.error) {
        toast.error(response.error, { id: loadingToast });
      } else {
        toast.success(`User status updated to ${newValue}`, { id: loadingToast });
        await loadUsers();
      }
    }

    setConfirmationDialog({ isOpen: false, action: null });
  };

  // Bulk action handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableUserIds = filteredUsers
        .filter(user => user.id !== userProfile?.id) // Exclude current user
        .map(user => user.id);
      setSelectedUserIds(new Set(selectableUserIds));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelection = new Set(selectedUserIds);
    if (checked) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUserIds(newSelection);
  };

  const handleBulkRoleChange = (newRole: UserRole) => {
    setConfirmationDialog({
      isOpen: true,
      action: {
        type: 'bulk-role',
        newValue: newRole,
        userIds: Array.from(selectedUserIds),
        count: selectedUserIds.size,
      },
    });
  };

  const handleBulkStatusChange = (newStatus: UserStatus) => {
    setConfirmationDialog({
      isOpen: true,
      action: {
        type: 'bulk-status',
        newValue: newStatus,
        userIds: Array.from(selectedUserIds),
        count: selectedUserIds.size,
      },
    });
  };

  const executeBulkAction = async (action: PendingAction) => {
    if (!action.userIds || action.userIds.length === 0) return;

    const loadingToast = toast.loading(`Updating ${action.count} users...`);
    let successCount = 0;
    let errorCount = 0;

    for (const userId of action.userIds) {
      try {
        if (action.type === 'bulk-role') {
          const response = await usersService.updateUserRole(userId, action.newValue as UserRole);
          if (response.error) {
            errorCount++;
          } else {
            successCount++;
          }
        } else if (action.type === 'bulk-status') {
          const response = await usersService.updateUserStatus(userId, action.newValue as UserStatus);
          if (response.error) {
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (error) {
        errorCount++;
      }
    }

    await loadUsers();

    if (errorCount === 0) {
      toast.success(`Successfully updated ${successCount} users`, { id: loadingToast });
    } else if (successCount === 0) {
      toast.error(`Failed to update all users`, { id: loadingToast });
    } else {
      toast.success(`Updated ${successCount} users (${errorCount} failed)`, { id: loadingToast });
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return { bg: '#dbeafe', color: '#1e40af', icon: Crown };
      case 'user': return { bg: '#ddd6fe', color: '#5b21b6', icon: Users };
      case 'viewer': return { bg: '#e5e7eb', color: '#374151', icon: Eye };
    }
  };

  const getStatusBadgeColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return { bg: '#d1fae5', color: '#065f46' };
      case 'suspended': return { bg: '#fee2e2', color: '#991b1b' };
      case 'inactive': return { bg: '#f3f4f6', color: '#6b7280' };
    }
  };

  // Online status helpers
  const isUserOnline = (lastLoginAt: Date | null): boolean => {
    if (!lastLoginAt) return false;
    const now = new Date().getTime();
    const lastLogin = new Date(lastLoginAt).getTime();
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return (now - lastLogin) < fiveMinutes;
  };

  const getLastSeenText = (lastLoginAt: Date | null): string => {
    if (!lastLoginAt) return 'Never';

    const now = new Date().getTime();
    const lastLogin = new Date(lastLoginAt).getTime();
    const diffMs = now - lastLogin;
    const diffMins = Math.floor(diffMs / (60 * 1000));
    const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 5) return 'Online';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(lastLoginAt).toLocaleDateString();
  };

  const onlineUsers = useMemo(() => {
    return users.filter(u => u.status === 'active' && isUserOnline(u.lastLoginAt));
  }, [users]);

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Prepare export data with formatted fields
  const exportData = useMemo(() => {
    return filteredUsers.map(user => ({
      'Full Name': user.fullName || 'N/A',
      'Email': user.email,
      'Job Title': user.jobTitle || 'N/A',
      'Role': user.role,
      'Status': user.status,
      'Last Login': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never',
      'Login Count': user.loginCount || 0,
      'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A',
      'Phone': user.phoneNumber || 'N/A',
      'Department': user.department || 'N/A'
    }));
  }, [filteredUsers]);

  if (!canViewUsers) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center'
      }}>
        <Shield size={48} color="#dc2626" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
          Access Denied
        </h2>
        <p style={{ color: '#6b7280' }}>
          You don't have permission to view user management.
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  return (
    <ErrorBoundary level="page">
      <div style={{
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
      {/* Header */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Users size={32} color="#2196f3" />
            User Management
          </h1>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            Manage users, roles, and permissions for your firm
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <ExportButton
            data={exportData}
            dataType="mixed"
            title="Users"
            variant="dropdown"
            size="medium"
          />
          <button
            onClick={() => setShowPermissionsMatrix(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Shield size={16} />
            View Permissions
          </button>
          <button
            onClick={loadUsers}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {canManageUsers && (
            <button
              onClick={() => setShowInviteModal(true)}
              style={{
                padding: '12px 20px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <UserPlus size={16} />
              Invite User
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        display: 'flex',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ flex: '1 1 300px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px'
          }}>
            <Search size={14} style={{ display: 'inline', marginRight: '6px' }} />
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or job title..."
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Role Filter */}
        <div style={{ flex: '0 0 150px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Role
          </label>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as UserRole | 'all')}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>

        {/* Status Filter */}
        <div style={{ flex: '0 0 150px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: '#374151',
            marginBottom: '6px'
          }}>
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as UserStatus | 'all')}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Users</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#111827' }}>{users.length}</div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Active Users</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>
            {users.filter(u => u.status === 'active').length}
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }} />
            Online Now
          </div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
            {onlineUsers.length}
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Admins</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>

      {/* Bulk Actions Toolbar */}
      {selectedUserIds.size > 0 && canManageUsers && (
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#1e40af' }}>
              {selectedUserIds.size} user{selectedUserIds.size !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedUserIds(new Set())}
              style={{
                padding: '6px 12px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
            >
              Clear Selection
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  handleBulkRoleChange(e.target.value as UserRole);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              style={{
                padding: '8px 12px',
                backgroundColor: 'white',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer'
              }}
              defaultValue=""
            >
              <option value="" disabled>Assign Role...</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              onClick={() => handleBulkStatusChange('active')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserCheck size={16} />
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusChange('suspended')}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <UserX size={16} />
              Suspend
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                {canManageUsers && (
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedUserIds.size === filteredUsers.filter(u => u.id !== userProfile?.id).length && filteredUsers.length > 1}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </th>
                )}
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  User
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Role
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Last Seen
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                  Login Count
                </th>
                {canManageUsers && (
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={canManageUsers ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleStyle = getRoleBadgeColor(user.role);
                  const statusStyle = getStatusBadgeColor(user.status);
                  const RoleIcon = roleStyle.icon;
                  const isCurrentUser = user.id === userProfile?.id;

                  return (
                    <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      {canManageUsers && (
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          {!isCurrentUser && (
                            <input
                              type="checkbox"
                              checked={selectedUserIds.has(user.id)}
                              onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          )}
                        </td>
                      )}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ position: 'relative' }}>
                            <div style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              backgroundColor: '#2196f3',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '16px'
                            }}>
                              {user.email.charAt(0).toUpperCase()}
                            </div>
                            {/* Online Status Dot */}
                            {isUserOnline(user.lastLoginAt) && (
                              <div style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: '#10b981',
                                border: '2px solid white',
                                boxShadow: '0 0 0 1px rgba(16, 185, 129, 0.4)'
                              }} title="Online now" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {user.fullName || 'No Name'}
                              {isCurrentUser && (
                                <span style={{
                                  padding: '2px 8px',
                                  backgroundColor: '#dbeafe',
                                  color: '#1e40af',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: '600'
                                }}>
                                  YOU
                                </span>
                              )}
                            </div>
                            <div style={{ color: '#6b7280', fontSize: '13px' }}>{user.email}</div>
                            {user.jobTitle && (
                              <div style={{ color: '#9ca3af', fontSize: '12px' }}>{user.jobTitle}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: roleStyle.bg,
                          color: roleStyle.color,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          <RoleIcon size={14} />
                          {user.role}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'inline-block',
                          padding: '6px 12px',
                          backgroundColor: statusStyle.bg,
                          color: statusStyle.color,
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {user.status}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '14px'
                        }}>
                          {isUserOnline(user.lastLoginAt) && (
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#10b981',
                              flexShrink: 0
                            }} />
                          )}
                          <div>
                            <div style={{
                              color: isUserOnline(user.lastLoginAt) ? '#10b981' : '#6b7280',
                              fontWeight: isUserOnline(user.lastLoginAt) ? '600' : 'normal'
                            }}>
                              {getLastSeenText(user.lastLoginAt)}
                            </div>
                            {user.lastLoginAt && !isUserOnline(user.lastLoginAt) && (
                              <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                                {new Date(user.lastLoginAt).toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                        {user.loginCount || 0}
                      </td>
                      {canManageUsers && (
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            {/* Role Change Dropdown */}
                            {!isCurrentUser && (
                              <select
                                value={user.role}
                                onChange={(e) => {
                                  const newRole = e.target.value as UserRole;
                                  if (newRole !== user.role) {
                                    handleRoleChangeRequest(user.id, user.fullName || user.email, user.role, newRole);
                                  }
                                }}
                                style={{
                                  padding: '6px 10px',
                                  border: '1px solid #d1d5db',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="admin">Admin</option>
                                <option value="user">User</option>
                                <option value="viewer">Viewer</option>
                              </select>
                            )}

                            {/* Status Toggle Button */}
                            {!isCurrentUser && user.status === 'active' && (
                              <button
                                onClick={() => handleStatusChangeRequest(user.id, user.fullName || user.email, user.status, 'suspended')}
                                title="Suspend User"
                                style={{
                                  padding: '8px',
                                  backgroundColor: '#fee2e2',
                                  color: '#dc2626',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <UserX size={16} />
                              </button>
                            )}

                            {!isCurrentUser && user.status === 'suspended' && (
                              <button
                                onClick={() => handleStatusChangeRequest(user.id, user.fullName || user.email, user.status, 'active')}
                                title="Activate User"
                                style={{
                                  padding: '8px',
                                  backgroundColor: '#d1fae5',
                                  color: '#059669',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                              >
                                <UserCheck size={16} />
                              </button>
                            )}

                            {isCurrentUser && (
                              <span style={{
                                padding: '6px 10px',
                                color: '#9ca3af',
                                fontSize: '12px',
                                fontStyle: 'italic'
                              }}>
                                Current User
                              </span>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={() => setConfirmationDialog({ isOpen: false, action: null })}
        onConfirm={handleConfirmAction}
        title={
          confirmationDialog.action?.type === 'bulk-role'
            ? 'Confirm Bulk Role Change'
            : confirmationDialog.action?.type === 'bulk-status'
            ? confirmationDialog.action.newValue === 'suspended'
              ? 'Confirm Bulk User Suspension'
              : 'Confirm Bulk User Activation'
            : confirmationDialog.action?.type === 'role'
            ? 'Confirm Role Change'
            : confirmationDialog.action?.type === 'status'
            ? confirmationDialog.action.newValue === 'suspended'
              ? 'Confirm User Suspension'
              : 'Confirm User Activation'
            : 'Confirm Action'
        }
        message={
          confirmationDialog.action?.type === 'bulk-role'
            ? `Are you sure you want to change the role to "${confirmationDialog.action.newValue}" for ${confirmationDialog.action.count} selected user${confirmationDialog.action.count !== 1 ? 's' : ''}? This will affect their access permissions.`
            : confirmationDialog.action?.type === 'bulk-status'
            ? confirmationDialog.action.newValue === 'suspended'
              ? `Are you sure you want to suspend ${confirmationDialog.action.count} selected user${confirmationDialog.action.count !== 1 ? 's' : ''}? They will lose access to the system until reactivated.`
              : `Are you sure you want to activate ${confirmationDialog.action.count} selected user${confirmationDialog.action.count !== 1 ? 's' : ''}? They will regain access to the system.`
            : confirmationDialog.action?.type === 'role'
            ? `Are you sure you want to change ${confirmationDialog.action.userName}'s role from "${confirmationDialog.action.currentValue}" to "${confirmationDialog.action.newValue}"? This will affect their access permissions.`
            : confirmationDialog.action?.type === 'status'
            ? confirmationDialog.action.newValue === 'suspended'
              ? `Are you sure you want to suspend ${confirmationDialog.action.userName}? They will lose access to the system until reactivated.`
              : `Are you sure you want to activate ${confirmationDialog.action.userName}? They will regain access to the system.`
            : 'Are you sure you want to proceed with this action?'
        }
        confirmText={
          confirmationDialog.action?.type === 'bulk-status' && confirmationDialog.action.newValue === 'suspended'
            ? `Suspend ${confirmationDialog.action.count} Users`
            : confirmationDialog.action?.type === 'bulk-status' && confirmationDialog.action.newValue === 'active'
            ? `Activate ${confirmationDialog.action.count} Users`
            : confirmationDialog.action?.type === 'bulk-role'
            ? `Change ${confirmationDialog.action.count} Users`
            : confirmationDialog.action?.type === 'status' && confirmationDialog.action.newValue === 'suspended'
            ? 'Suspend User'
            : confirmationDialog.action?.type === 'status' && confirmationDialog.action.newValue === 'active'
            ? 'Activate User'
            : 'Change Role'
        }
        variant={
          (confirmationDialog.action?.type === 'status' || confirmationDialog.action?.type === 'bulk-status') && confirmationDialog.action.newValue === 'suspended'
            ? 'danger'
            : 'warning'
        }
      />

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={loadUsers}
      />

      {/* Permissions Matrix Modal */}
      <PermissionsMatrix
        isOpen={showPermissionsMatrix}
        onClose={() => setShowPermissionsMatrix(false)}
      />
    </div>
  </ErrorBoundary>
  );
};

export default UserManagementPage;
