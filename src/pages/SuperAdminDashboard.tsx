/**
 * Super Admin Dashboard
 *
 * Main dashboard for super admins with:
 * - System statistics
 * - Firm management
 * - User management across all firms
 * - Impersonation capabilities
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  UserCheck,
  Activity,
  Search,
  Eye,
  Shield,
  Settings,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { superAdminService } from '../services/api/superAdmin.service';
import { UserProfile } from '../types/User';
import { FirmSettings } from '../services/api/firms.service';
import { useImpersonation } from '../contexts/ImpersonationContext';
import { isSuccessResponse } from '../types/api';
import { showError, showSuccess } from '../utils/toast';
import LoadingSkeleton from '../components/LoadingSkeleton';

interface SuperAdminStats {
  totalFirms: number;
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSuperAdmins: number;
  recentImpersonations: number;
}

const SuperAdminDashboard: React.FC = () => {
  console.log('[SuperAdminDashboard] Component function called - about to initialize hooks');
  const navigate = useNavigate();
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [firms, setFirms] = useState<FirmSettings[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'firms' | 'users'>('overview');

  console.log('[SuperAdminDashboard] About to call useImpersonation hook');
  const { startImpersonation } = useImpersonation();
  console.log('[SuperAdminDashboard] useImpersonation hook completed successfully');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[SuperAdminDashboard] Loading data...');
      const [statsResponse, firmsResponse, usersResponse] = await Promise.all([
        superAdminService.getStats(),
        superAdminService.getAllFirms(),
        superAdminService.getAllUsers()
      ]);

      console.log('[SuperAdminDashboard] Stats response:', statsResponse);
      console.log('[SuperAdminDashboard] Firms response:', firmsResponse);
      console.log('[SuperAdminDashboard] Users response:', usersResponse);

      if (isSuccessResponse(statsResponse)) {
        setStats(statsResponse.data);
      } else {
        console.error('[SuperAdminDashboard] Stats failed:', statsResponse);
      }

      if (isSuccessResponse(firmsResponse)) {
        setFirms(firmsResponse.data);
      } else {
        console.error('[SuperAdminDashboard] Firms failed:', firmsResponse);
      }

      if (isSuccessResponse(usersResponse)) {
        setUsers(usersResponse.data);
      } else {
        console.error('[SuperAdminDashboard] Users failed:', usersResponse);
      }
    } catch (error: any) {
      console.error('[SuperAdminDashboard] Load error:', error);
      const errorMessage = error.message || 'Failed to load dashboard data';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (user: UserProfile) => {
    const reason = prompt('Enter reason for impersonation (optional):');
    const success = await startImpersonation(user.id, reason || undefined);
    if (success) {
      // Optionally redirect to a specific page
      window.location.href = '/dashboard';
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  if (error) {
    return (
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#991b1b' }}>Error Loading Dashboard</h3>
          <p style={{ margin: 0, color: '#7f1d1d' }}>{error}</p>
        </div>
        <button
          onClick={loadData}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={32} style={{ color: '#dc2626' }} />
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700 }}>Super Admin Dashboard</h1>
          </div>
          <button
            onClick={() => navigate('/app')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1d4ed8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#2563eb';
            }}
          >
            <ArrowLeft size={18} />
            Back to App
          </button>
        </div>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
          System-wide management and monitoring
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #f3f4f6',
        paddingBottom: '0'
      }}>
        {(['overview', 'firms', 'users'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#2563eb' : '#6b7280',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: '14px',
              cursor: 'pointer',
              borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div>
          {/* Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}>
            <StatCard
              icon={<Building2 size={24} />}
              label="Total Firms"
              value={stats.totalFirms}
              color="#2563eb"
            />
            <StatCard
              icon={<Users size={24} />}
              label="Total Users"
              value={stats.totalUsers}
              color="#7c3aed"
              subValue={`${stats.activeUsers} active`}
            />
            <StatCard
              icon={<UserCheck size={24} />}
              label="Active Sessions"
              value={stats.activeUsers}
              color="#059669"
            />
            <StatCard
              icon={<Activity size={24} />}
              label="Recent Impersonations"
              value={stats.recentImpersonations}
              color="#dc2626"
            />
          </div>

          {/* Quick Actions */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              Quick Actions
            </h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <ActionButton
                icon={<Users size={18} />}
                label="View All Users"
                onClick={() => setActiveTab('users')}
              />
              <ActionButton
                icon={<Building2 size={18} />}
                label="Manage Firms"
                onClick={() => setActiveTab('firms')}
              />
              <ActionButton
                icon={<RefreshCw size={18} />}
                label="Refresh Data"
                onClick={loadData}
              />
            </div>
          </div>
        </div>
      )}

      {/* Firms Tab */}
      {activeTab === 'firms' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600 }}>
            All Firms ({firms.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {firms.map((firm) => (
              <div
                key={firm.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {firm.firmName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    ID: {firm.id}
                  </div>
                </div>
                <button
                  onClick={() => {/* Navigate to firm settings */}}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: '#f3f4f6',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Settings size={14} />
                  Manage
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600 }}>
              All Users ({users.length})
            </h3>
            <div style={{ position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#9ca3af'
                }}
              />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 40px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {user.fullName || user.email}
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    {user.email} • {user.role}
                  </div>
                </div>
                <button
                  onClick={() => handleImpersonate(user)}
                  disabled={user.role === 'super_admin'}
                  style={{
                    padding: '6px 16px',
                    backgroundColor: user.role === 'super_admin' ? '#f3f4f6' : '#dbeafe',
                    color: user.role === 'super_admin' ? '#9ca3af' : '#1e40af',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: user.role === 'super_admin' ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} />
                  Impersonate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
  subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, subValue }) => (
  <div style={{
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
    </div>
    <div style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>
      {value.toLocaleString()}
    </div>
    {subValue && (
      <div style={{ fontSize: '13px', color: '#6b7280' }}>
        {subValue}
      </div>
    )}
  </div>
);

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: '10px 20px',
      backgroundColor: '#f3f4f6',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: 500,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = '#e5e7eb';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#f3f4f6';
    }}
  >
    {icon}
    {label}
  </button>
);

export default SuperAdminDashboard;
