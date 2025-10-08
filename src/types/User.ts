// User Profile and RBAC Types

export type UserRole = 'admin' | 'user' | 'viewer';
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
  firmId: string;
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
  preferences: UserPreferences;

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
  | 'import.process';

// Role permission mappings (for frontend reference)
export const ROLE_PERMISSIONS: Record<UserRole, PermissionName[]> = {
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
