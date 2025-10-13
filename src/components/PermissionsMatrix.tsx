import React, { useState } from 'react';
import { Shield, Check, X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { UserRole, PermissionName, ROLE_PERMISSIONS } from '../types/User';

interface PermissionCategory {
  name: string;
  description: string;
  permissions: {
    id: PermissionName;
    label: string;
    description: string;
  }[];
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    name: 'Clients',
    description: 'Manage client information and relationships',
    permissions: [
      { id: 'clients.view', label: 'View Clients', description: 'View client list and details' },
      { id: 'clients.create', label: 'Create Clients', description: 'Add new clients to the system' },
      { id: 'clients.update', label: 'Update Clients', description: 'Edit existing client information' },
      { id: 'clients.delete', label: 'Delete Clients', description: 'Remove clients from the system' },
    ],
  },
  {
    name: 'Accounts',
    description: 'Manage investment accounts',
    permissions: [
      { id: 'accounts.view', label: 'View Accounts', description: 'View account list and details' },
      { id: 'accounts.create', label: 'Create Accounts', description: 'Add new accounts' },
      { id: 'accounts.update', label: 'Update Accounts', description: 'Edit account information' },
      { id: 'accounts.delete', label: 'Delete Accounts', description: 'Remove accounts' },
    ],
  },
  {
    name: 'Fees',
    description: 'Manage fee schedules and calculations',
    permissions: [
      { id: 'fees.view', label: 'View Fees', description: 'View fee schedules and reports' },
      { id: 'fees.create', label: 'Create Fees', description: 'Create new fee schedules' },
      { id: 'fees.update', label: 'Update Fees', description: 'Modify fee schedules' },
      { id: 'fees.delete', label: 'Delete Fees', description: 'Remove fee schedules' },
      { id: 'fees.calculate', label: 'Calculate Fees', description: 'Run fee calculations' },
    ],
  },
  {
    name: 'Settings',
    description: 'Manage firm and system settings',
    permissions: [
      { id: 'settings.view', label: 'View Settings', description: 'View firm settings and configurations' },
      { id: 'settings.update', label: 'Update Settings', description: 'Modify firm settings' },
    ],
  },
  {
    name: 'Users',
    description: 'Manage user accounts and permissions',
    permissions: [
      { id: 'users.view', label: 'View Users', description: 'View user list and profiles' },
      { id: 'users.create', label: 'Create Users', description: 'Invite and create new users' },
      { id: 'users.update', label: 'Update Users', description: 'Modify user roles and permissions' },
      { id: 'users.delete', label: 'Delete Users', description: 'Remove users from the system' },
    ],
  },
  {
    name: 'Data Import',
    description: 'Import and process data files',
    permissions: [
      { id: 'import.upload', label: 'Upload Data', description: 'Upload CSV and Excel files' },
      { id: 'import.process', label: 'Process Data', description: 'Process and import uploaded files' },
    ],
  },
];

const ROLE_INFO: Record<UserRole, { name: string; description: string; color: string }> = {
  admin: {
    name: 'Admin',
    description: 'Full access to all features and management capabilities',
    color: '#2563eb',
  },
  user: {
    name: 'User',
    description: 'Can view, create, and edit most data',
    color: '#7c3aed',
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to view data',
    color: '#6b7280',
  },
};

interface PermissionsMatrixProps {
  isOpen: boolean;
  onClose: () => void;
}

const PermissionsMatrix: React.FC<PermissionsMatrixProps> = ({ isOpen, onClose }) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(PERMISSION_CATEGORIES.map(cat => cat.name))
  );

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const hasPermission = (role: UserRole, permission: PermissionName): boolean => {
    return ROLE_PERMISSIONS[role].includes(permission);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '16px',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          maxWidth: '1200px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Shield size={28} color="#2563eb" />
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#111827', margin: 0 }}>
              Role Permissions Matrix
            </h2>
          </div>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            View what each role can do in the system
          </p>
        </div>

        {/* Role Descriptions */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
            {(['admin', 'user', 'viewer'] as UserRole[]).map((role) => {
              const info = ROLE_INFO[role];
              return (
                <div
                  key={role}
                  style={{
                    padding: '16px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: `2px solid ${info.color}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Shield size={20} color={info.color} />
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                      {info.name}
                    </h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                    {info.description}
                  </p>
                  <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: '600', color: info.color }}>
                    {ROLE_PERMISSIONS[role].length} permissions
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Permissions Table */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {PERMISSION_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.name);

            return (
              <div
                key={category.name}
                style={{
                  marginBottom: '24px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.name)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    backgroundColor: '#f9fafb',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px 0' }}>
                      {category.name}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                      {category.description}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp size={20} color="#6b7280" /> : <ChevronDown size={20} color="#6b7280" />}
                </button>

                {/* Permissions List */}
                {isExpanded && (
                  <div style={{ backgroundColor: 'white' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                            Permission
                          </th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>
                            Admin
                          </th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>
                            User
                          </th>
                          <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '100px' }}>
                            Viewer
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.permissions.map((permission) => (
                          <tr key={permission.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '12px 16px' }}>
                              <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827', marginBottom: '2px' }}>
                                {permission.label}
                              </div>
                              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                {permission.description}
                              </div>
                            </td>
                            {(['admin', 'user', 'viewer'] as UserRole[]).map((role) => {
                              const hasAccess = hasPermission(role, permission.id);
                              return (
                                <td key={role} style={{ padding: '12px 16px', textAlign: 'center' }}>
                                  {hasAccess ? (
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#d1fae5',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <Check size={18} color="#059669" strokeWidth={3} />
                                    </div>
                                  ) : (
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        backgroundColor: '#fee2e2',
                                        borderRadius: '50%',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                      }}
                                    >
                                      <X size={18} color="#dc2626" strokeWidth={3} />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Info size={16} color="#2563eb" />
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#111827', margin: 0 }}>
                Legend
              </h4>
            </div>
            <div style={{ display: 'flex', gap: '24px', fontSize: '13px', color: '#6b7280' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#d1fae5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={14} color="#059669" />
                </div>
                Has permission
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', backgroundColor: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={14} color="#dc2626" />
                </div>
                No permission
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionsMatrix;
