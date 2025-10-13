import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Filter, Calendar, User, Activity, AlertCircle, RefreshCw } from 'lucide-react';
import { AuditLog } from '../types/User';
import { auditService, AuditLogFilters } from '../services/api/audit.service';
import { useFirm } from '../contexts/FirmContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorBoundary from '../components/ErrorBoundary';
import toast from 'react-hot-toast';

const AuditLogsPage: React.FC = () => {
  const { firmId } = useFirm();
  const { hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterResourceType, setFilterResourceType] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'today' | '7days' | '30days' | 'all'>('30days');
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [availableResourceTypes, setAvailableResourceTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<{
    totalActions: number;
    uniqueUsers: number;
    recentActions: number;
  } | null>(null);

  const canViewAudit = hasPermission('settings.view'); // Admins can view audit logs

  useEffect(() => {
    if (canViewAudit && firmId) {
      loadAuditLogs();
      loadFilterOptions();
      loadStats();
    }
  }, [firmId, canViewAudit, filterAction, filterResourceType, filterDateRange]);

  const loadAuditLogs = async () => {
    if (!firmId) return;

    setLoading(true);

    const filters: AuditLogFilters = {
      limit: 100,
    };

    // Apply action filter
    if (filterAction !== 'all') {
      filters.action = filterAction;
    }

    // Apply resource type filter
    if (filterResourceType !== 'all') {
      filters.resourceType = filterResourceType;
    }

    // Apply date range filter
    if (filterDateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();

      switch (filterDateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case '7days':
          startDate.setDate(now.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(now.getDate() - 30);
          break;
      }

      filters.startDate = startDate.toISOString();
    }

    const response = await auditService.getAuditLogs(firmId, filters);

    if (response.error) {
      toast.error(response.error);
    } else if (response.data) {
      setLogs(response.data);
    }

    setLoading(false);
  };

  const loadFilterOptions = async () => {
    if (!firmId) return;

    const [actionsResponse, resourceTypesResponse] = await Promise.all([
      auditService.getUniqueActions(firmId),
      auditService.getUniqueResourceTypes(firmId),
    ]);

    if (actionsResponse.data) {
      setAvailableActions(actionsResponse.data);
    }

    if (resourceTypesResponse.data) {
      setAvailableResourceTypes(resourceTypesResponse.data);
    }
  };

  const loadStats = async () => {
    if (!firmId) return;

    const response = await auditService.getAuditStats(firmId, 30);

    if (response.data) {
      setStats(response.data);
    }
  };

  const handleExport = () => {
    const csvContent = auditService.exportToCSV(filteredLogs);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Audit logs exported successfully');
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;

    const lowerSearch = searchTerm.toLowerCase();
    const userEmail = (log as any).user?.email?.toLowerCase() || '';
    const action = log.action?.toLowerCase() || '';
    const resourceType = log.resourceType?.toLowerCase() || '';
    const details = JSON.stringify(log.details || {}).toLowerCase();

    return (
      userEmail.includes(lowerSearch) ||
      action.includes(lowerSearch) ||
      resourceType.includes(lowerSearch) ||
      details.includes(lowerSearch)
    );
  });

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('login')) return { bg: '#d1fae5', color: '#065f46' };
    if (action.includes('update') || action.includes('change')) return { bg: '#dbeafe', color: '#1e40af' };
    if (action.includes('delete') || action.includes('suspend')) return { bg: '#fee2e2', color: '#991b1b' };
    return { bg: '#f3f4f6', color: '#6b7280' };
  };

  if (!canViewAudit) {
    return (
      <ErrorBoundary>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '24px', color: '#111827', marginBottom: '8px' }}>Access Denied</h2>
          <p style={{ color: '#6b7280' }}>
            You don't have permission to view audit logs. Contact your administrator.
          </p>
        </div>
      </ErrorBoundary>
    );
  }

  if (loading) {
    return <LoadingSkeleton type="page" />;
  }

  return (
    <ErrorBoundary>
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <FileText size={32} color="#2196f3" />
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111827', margin: 0 }}>
              Audit Logs
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>
            View system activity and user actions for compliance and troubleshooting
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
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
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Actions</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#2196f3' }}>{stats.totalActions}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Active Users</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#059669' }}>{stats.uniqueUsers}</div>
            </div>
            <div style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Last 24 Hours</div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{stats.recentActions}</div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 300px', minWidth: '200px' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}
              />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 10px 10px 40px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </div>

            {/* Action Filter */}
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Actions</option>
              {availableActions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>

            {/* Resource Type Filter */}
            <select
              value={filterResourceType}
              onChange={(e) => setFilterResourceType(e.target.value)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="all">All Resources</option>
              {availableResourceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>

            {/* Date Range Filter */}
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              style={{
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>

            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={filteredLogs.length === 0}
              style={{
                padding: '10px 16px',
                backgroundColor: '#2196f3',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: filteredLogs.length === 0 ? 'not-allowed' : 'pointer',
                opacity: filteredLogs.length === 0 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Export
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadAuditLogs}
              style={{
                padding: '10px 16px',
                backgroundColor: 'white',
                color: '#6b7280',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
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
        </div>

        {/* Logs Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Timestamp
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    User
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Action
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Resource
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    Details
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
                      No audit logs found for the selected filters
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const actionStyle = getActionColor(log.action);
                    return (
                      <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} color="#6b7280" />
                            <span style={{ fontSize: '14px', color: '#111827' }}>
                              {(log as any).user?.email || 'System'}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '600',
                            backgroundColor: actionStyle.bg,
                            color: actionStyle.color
                          }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ padding: '16px', fontSize: '14px', color: '#6b7280' }}>
                          {log.resourceType ? `${log.resourceType}${log.resourceId ? ` (${log.resourceId.substring(0, 8)}...)` : ''}` : 'N/A'}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280', maxWidth: '300px' }}>
                          {log.details ? (
                            <details style={{ cursor: 'pointer' }}>
                              <summary style={{ fontWeight: '500', color: '#2196f3' }}>View details</summary>
                              <pre style={{
                                marginTop: '8px',
                                padding: '8px',
                                backgroundColor: '#f9fafb',
                                borderRadius: '4px',
                                fontSize: '11px',
                                overflow: 'auto',
                                maxHeight: '200px'
                              }}>
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </details>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', color: '#6b7280' }}>
                          {log.ipAddress || 'N/A'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Results Count */}
        <div style={{
          marginTop: '16px',
          textAlign: 'center',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AuditLogsPage;
