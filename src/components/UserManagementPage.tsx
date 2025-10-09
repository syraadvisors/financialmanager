import React, { useState, useEffect } from 'react';
import { Users, Shield, Mail, Calendar, Search, Edit2, UserX, UserCheck, Crown, Eye, RefreshCw } from 'lucide-react';
import { UserProfile, UserRole, UserStatus } from '../types/User';
import { usersService } from '../services/api/users.service';
import { useFirm } from '../contexts/FirmContext';
import { useAuth } from '../contexts/AuthContext';
import ErrorBoundary from './ErrorBoundary';
import LoadingSkeleton from './LoadingSkeleton';

const UserManagementPage: React.FC = () => {
  const { firmId } = useFirm();
  const { userProfile, hasPermission } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<UserStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setError(null);

    const response = await usersService.getAllInFirm(firmId);

    if (response.error) {
      setError(response.error);
    } else if (response.data) {
      setUsers(response.data);
    }

    setLoading(false);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    setError(null);
    setSuccessMessage(null);

    const response = await usersService.updateUserRole(userId, newRole);

    if (response.error) {
      setError(response.error);
    } else {
      setSuccessMessage(`User role updated to ${newRole}`);
      await loadUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: UserStatus) => {
    setError(null);
    setSuccessMessage(null);

    const response = await usersService.updateUserStatus(userId, newStatus);

    if (response.error) {
      setError(response.error);
    } else {
      setSuccessMessage(`User status updated to ${newStatus}`);
      await loadUsers();
      setTimeout(() => setSuccessMessage(null), 3000);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.jobTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

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
      </div>

      {/* Messages */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {successMessage && (
        <div style={{
          padding: '12px',
          backgroundColor: '#d1fae5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          color: '#065f46',
          fontSize: '14px',
          marginBottom: '16px'
        }}>
          {successMessage}
        </div>
      )}

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
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Admins</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2563eb' }}>
            {users.filter(u => u.role === 'admin').length}
          </div>
        </div>
      </div>

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
                  Last Login
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
                  <td colSpan={canManageUsers ? 6 : 5} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
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
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>
                              {user.fullName || 'No Name'}
                              {isCurrentUser && (
                                <span style={{
                                  marginLeft: '8px',
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
                      <td style={{ padding: '16px', color: '#6b7280', fontSize: '14px' }}>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
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
                                onChange={(e) => handleUpdateRole(user.id, e.target.value as UserRole)}
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
                                onClick={() => handleUpdateStatus(user.id, 'suspended')}
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
                                onClick={() => handleUpdateStatus(user.id, 'active')}
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
    </div>
  </ErrorBoundary>
  );
};

export default UserManagementPage;
