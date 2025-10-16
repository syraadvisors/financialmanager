// User Profile and RBAC Types

export type UserRole = 'super_admin' | 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'suspended' | 'inactive';

export interface UserPreferences {
  theme: 'light' | 'dark';
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  language: string;
  timezone: string;
  rememberMe: boolean;
}

export interface UserProfile {
  id: string; // UUID matching auth.users.id
  firmId: string | null; // Nullable for super_admin users
  createdAt: Date;
  updatedAt: Date;

  // Basic Info
  email: string;
  fullName: string | null;
  avatarUrl: string | null;

  // Profile Details
  jobTitle: string | null;
  department: string | null;
  phoneNumber: string | null;
  bio: string | null;

  // Role and Status
  role: UserRole;
  status: UserStatus;

  // Preferences
  preferences: UserPreferences | null; // Nullable for fallback profiles

  // Audit
  lastLoginAt: Date | null;
  loginCount: number;
  mfaEnabled: boolean;
  emailVerified: boolean;
}

export interface Permission {
  id: string;
  createdAt: Date;
  name: string;
  description: string | null;
  category: string | null;
}

export interface RolePermission {
  id: string;
  createdAt: Date;
  role: UserRole;
  permissionId: string;
  permission?: Permission; // Joined data
}

export interface AuditLog {
  id: string;
  createdAt: Date;
  userId: string | null;
  firmId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
}

// Form data types
export interface UserProfileFormData {
  fullName: string;
  jobTitle: string;
  department: string;
  phoneNumber: string;
  bio: string;
}

export interface UserPreferencesFormData extends UserPreferences {}

export interface InviteUserData {
  email: string;
  role: UserRole;
  fullName?: string;
  jobTitle?: string;
  department?: string;
}

// Permission check types
export type PermissionName =
  | 'clients.view'
  | 'clients.create'
  | 'clients.update'
  | 'clients.delete'
  | 'accounts.view'
  | 'accounts.create'
  | 'accounts.update'
  | 'accounts.delete'
  | 'fees.view'
  | 'fees.create'
  | 'fees.update'
  | 'fees.delete'
  | 'fees.calculate'
  | 'settings.view'
  | 'settings.update'
  | 'users.view'
  | 'users.create'
  | 'users.update'
  | 'users.delete'
  | 'import.upload'
  | 'import.process'
  | 'super_admin.access'
  | 'super_admin.impersonate'
  | 'super_admin.manage_firms'
  | 'super_admin.manage_super_admins'
  | 'super_admin.view_all_data';

// Role permission mappings (for frontend reference) - Updated for super_admin support
export const ROLE_PERMISSIONS: Record<UserRole, PermissionName[]> = {
  super_admin: [
    // Super admin has ALL permissions
    'clients.view', 'clients.create', 'clients.update', 'clients.delete',
    'accounts.view', 'accounts.create', 'accounts.update', 'accounts.delete',
    'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.calculate',
    'settings.view', 'settings.update',
    'users.view', 'users.create', 'users.update', 'users.delete',
    'import.upload', 'import.process',
    'super_admin.access',
    'super_admin.impersonate',
    'super_admin.manage_firms',
    'super_admin.manage_super_admins',
    'super_admin.view_all_data'
  ],
  admin: [
    'clients.view', 'clients.create', 'clients.update', 'clients.delete',
    'accounts.view', 'accounts.create', 'accounts.update', 'accounts.delete',
    'fees.view', 'fees.create', 'fees.update', 'fees.delete', 'fees.calculate',
    'settings.view', 'settings.update',
    'users.view', 'users.create', 'users.update', 'users.delete',
    'import.upload', 'import.process'
  ],
  user: [
    'clients.view', 'clients.create', 'clients.update',
    'accounts.view', 'accounts.create', 'accounts.update',
    'fees.view', 'fees.create', 'fees.update', 'fees.calculate',
    'import.upload', 'import.process'
  ],
  viewer: [
    'clients.view',
    'accounts.view',
    'fees.view'
  ]
};

// Helper function to check if a role has a permission
export function roleHasPermission(role: UserRole, permission: PermissionName): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

// Helper function to check if a role is super admin
export function isSuperAdmin(role: UserRole): boolean {
  return role === 'super_admin';
}

// Impersonation Types
export interface ImpersonationSession {
  superAdminId: string;
  superAdminEmail: string;
  impersonatedUserId: string;
  impersonatedUserEmail: string;
  impersonatedUserFirmId: string;
  startedAt: Date;
  reason?: string;
}

export interface ImpersonationAuditLog extends AuditLog {
  action: 'super_admin.impersonate.start' | 'super_admin.impersonate.end';
  details: {
    superAdminId: string;
    superAdminEmail: string;
    targetUserId: string;
    targetUserEmail: string;
    targetFirmId: string;
    reason?: string;
  };
}
