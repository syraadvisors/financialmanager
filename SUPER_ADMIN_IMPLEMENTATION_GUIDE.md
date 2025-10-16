# Super Admin Implementation Guide

## Overview

This guide explains the super-admin feature implementation that provides:

1. **Cross-Firm Access**: Super admins can view and manage data across ALL firms
2. **User Impersonation**: Ability to impersonate any user for troubleshooting
3. **Super Admin Management**: Create and manage other super admins
4. **Full Audit Trail**: All super admin actions are logged for security
5. **Global User Management**: Manage users across all firms

## What Has Been Implemented

### 1. Database Layer ✅

**File**: `database/15_add_super_admin_support.sql`

Features:
- Updated `user_profiles` table to support `super_admin` role
- Made `firm_id` nullable for super admins (they aren't tied to a specific firm)
- Created `impersonation_sessions` table to track impersonation activity
- Added super-admin specific permissions
- Updated ALL RLS policies to give super admins full access
- Created helper functions:
  - `is_super_admin()` - Check if current user is super admin
  - `start_impersonation(user_id, reason)` - Start impersonating a user
  - `end_impersonation()` - End current impersonation
  - `check_is_super_admin(user_id)` - Check if specific user is super admin
  - `get_active_impersonation_session()` - Get current impersonation

### 2. Type Definitions ✅

**File**: `src/types/User.ts`

Updates:
- Added `'super_admin'` to `UserRole` type
- Added 5 new super-admin permissions:
  - `super_admin.access`
  - `super_admin.impersonate`
  - `super_admin.manage_firms`
  - `super_admin.manage_super_admins`
  - `super_admin.view_all_data`
- Added `ImpersonationSession` interface
- Added `isSuperAdmin()` helper function
- Updated `ROLE_PERMISSIONS` to include super_admin with ALL permissions

### 3. Service Layer ✅

**File**: `src/services/api/superAdmin.service.ts`

Services:
- `isSuperAdmin()` - Check if current user is super admin
- `getAllFirms()` - Get all firms in the system
- `getAllUsers(filters)` - Get all users with optional filtering
- `getUserById(userId)` - Get any user by ID (cross-firm)
- `updateUserProfile(userId, updates)` - Update any user (cross-firm)
- `createSuperAdmin(data)` - Create invitation for new super admin
- `startImpersonation(userId, reason)` - Start impersonating a user
- `endImpersonation()` - End current impersonation
- `getActiveImpersonation()` - Get active impersonation session
- `getImpersonationHistory(filters)` - View impersonation history
- `getStats()` - Get dashboard statistics
- `updateFirm(firmId, updates)` - Update any firm
- `deleteFirm(firmId)` - Delete a firm

### 4. Impersonation Context ✅

**File**: `src/contexts/ImpersonationContext.tsx`

Provides:
- `impersonationSession` - Current impersonation session state
- `isImpersonating` - Boolean flag if currently impersonating
- `startImpersonation(userId, reason)` - Function to start impersonation
- `endImpersonation()` - Function to end impersonation
- `refreshImpersonation()` - Refresh impersonation state

### 5. API Response Types ✅

**Files**:
- `src/types/api.ts` - Complete HTTP status codes and error types
- `src/utils/apiErrorHandler.ts` - Error handling utilities

## What Needs To Be Done

### Step 1: Fix TypeScript Compilation Errors ⚠️

There are several compilation errors to fix:

#### A. Fix User.ts ROLE_PERMISSIONS

The `ROLE_PERMISSIONS` object is missing the `super_admin` key. It should be BEFORE `admin`, not after. This was done correctly in the edit but didn't apply properly.

```typescript
export const ROLE_PERMISSIONS: Record<UserRole, PermissionName[]> = {
  super_admin: [
    // All permissions
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
    // ... existing admin permissions
  ],
  // ... other roles
};
```

#### B. Update PermissionsMatrix.tsx

Add super_admin to ROL_INFO:

```typescript
const ROLE_INFO: Record<UserRole, { name: string; description: string; color: string }> = {
  super_admin: {
    name: 'Super Admin',
    description: 'System administrator with access to all firms and data',
    color: '#9333ea' // purple
  },
  admin: {
    // ... existing
  },
  // ... other roles
};
```

#### C. Update UserManagementPage.tsx

Add super_admin to `getRoleBadgeColor` function:

```typescript
const getRoleBadgeColor = (role: UserRole) => {
  const styles = {
    super_admin: {
      bg: '#f3e8ff',
      color: '#7e22ce',
      icon: Shield
    },
    admin: {
      bg: '#fef3c7',
      color: '#d97706',
      icon: Shield
    },
    // ... other roles
  };
  return styles[role] || styles.viewer;
};
```

#### D. Fix superAdmin.service.ts

Fix the type issues with `safeServiceCall`:

```typescript
// For getAllFirms
async getAllFirms(): Promise<ApiResponse<FirmSettings[]>> {
  return safeServiceCall(
    async () => {
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .order('firm_name');

      if (error) throw error;
      return data;
    },
    {
      resourceType: 'Firms',
      successMessage: 'Firms loaded successfully'
    }
  );
}

// For getUserById
async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
  return safeServiceCall(
    async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    {
      resourceType: 'User',
      resourceId: userId
    }
  );
}
```

Replace all instances of `'UNKNOWN_ERROR'`, `'NOT_FOUND'`, `'INSUFFICIENT_PERMISSIONS'`, `'ALREADY_EXISTS'` with the proper enum:
- `ApiErrorCode.UNKNOWN_ERROR`
- `ApiErrorCode.NOT_FOUND`
- `ApiErrorCode.INSUFFICIENT_PERMISSIONS`
- `ApiErrorCode.ALREADY_EXISTS`

### Step 2: Create Super Admin Dashboard

Create `src/pages/SuperAdminDashboard.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { superAdminService } from '../services/api/superAdmin.service';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Users, UserCog, Activity } from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [firms, setFirms] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    const [statsRes, firmsRes, usersRes] = await Promise.all([
      superAdminService.getStats(),
      superAdminService.getAllFirms(),
      superAdminService.getAllUsers({ limit: 10 })
    ]);

    if (statsRes.success) setStats(statsRes.data);
    if (firmsRes.success) setFirms(firmsRes.data);
    if (usersRes.success) setUsers(usersRes.data);

    setLoading(false);
  };

  if (userProfile?.role !== 'super_admin') {
    return <div>Access Denied</div>;
  }

  return (
    <div style={{ padding: '24px' }}>
      <h1>Super Admin Dashboard</h1>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
        <StatsCard
          icon={<Building2 />}
          label="Total Firms"
          value={stats?.totalFirms || 0}
        />
        <StatsCard
          icon={<Users />}
          label="Total Users"
          value={stats?.totalUsers || 0}
        />
        <StatsCard
          icon={<UserCog />}
          label="Super Admins"
          value={stats?.totalSuperAdmins || 0}
        />
        <StatsCard
          icon={<Activity />}
          label="Recent Impersonations"
          value={stats?.recentImpersonations || 0}
        />
      </div>

      {/* Firms List */}
      <section style={{ marginTop: '32px' }}>
        <h2>All Firms</h2>
        <div>
          {firms.map(firm => (
            <div key={firm.id} style={{ padding: '12px', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
              <strong>{firm.firmName}</strong>
              <div>{firm.firmDomain}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Users */}
      <section style={{ marginTop: '32px' }}>
        <h2>Recent Users</h2>
        <div>
          {users.map(user => (
            <div key={user.id} style={{ padding: '12px', border: '1px solid #e5e7eb', marginBottom: '8px' }}>
              <strong>{user.email}</strong>
              <div>Role: {user.role} | Status: {user.status}</div>
              <button onClick={() => handleImpersonate(user.id)}>
                Impersonate
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const StatsCard: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div style={{ padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      {icon}
      <div>
        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{value}</div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>{label}</div>
      </div>
    </div>
  </div>
);
```

### Step 3: Create Impersonation Banner Component

Create `src/components/ImpersonationBanner.tsx`:

```typescript
import React from 'react';
import { useImpersonation } from '../contexts/ImpersonationContext';
import { AlertCircle, X } from 'lucide-react';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, impersonationSession, endImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonationSession) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertCircle size={20} />
        <div>
          <strong>Impersonating:</strong> {impersonationSession.impersonatedUserEmail}
          {impersonationSession.reason && (
            <span style={{ marginLeft: '12px', opacity: 0.9 }}>
              (Reason: {impersonationSession.reason})
            </span>
          )}
        </div>
      </div>
      <button
        onClick={endImpersonation}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid white',
          color: 'white',
          padding: '6px 16px',
          borderRadius: '4px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <X size={16} />
        End Impersonation
      </button>
    </div>
  );
};
```

### Step 4: Update App.tsx

Wrap your app with the ImpersonationProvider and add the banner:

```typescript
import { ImpersonationProvider } from './contexts/ImpersonationContext';
import { ImpersonationBanner } from './components/ImpersonationBanner';

function App() {
  return (
    <AuthProvider>
      <ImpersonationProvider>
        <ImpersonationBanner />
        <div style={{ marginTop: '0px' }}> {/* Add margin if impersonating */}
          {/* Your existing app content */}
        </div>
      </ImpersonationProvider>
    </AuthProvider>
  );
}
```

### Step 5: Add Super Admin Route

In your routing file, add the super admin dashboard route:

```typescript
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';

// In your routes
{
  path: '/super-admin',
  element: <ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>
}
```

### Step 6: Add Navigation for Super Admins

Update your navigation component to show super admin link:

```typescript
{userProfile?.role === 'super_admin' && (
  <Link to="/super-admin">
    <Shield size={20} />
    Super Admin
  </Link>
)}
```

## Database Setup

### Run the Migration

Execute the SQL migration file in your Supabase SQL editor:

```bash
# Copy contents of database/15_add_super_admin_support.sql
# Paste into Supabase SQL Editor
# Run the migration
```

### Create Your First Super Admin

After logging in with your account:

```sql
-- Replace with your email
UPDATE user_profiles
SET role = 'super_admin', firm_id = NULL
WHERE email = 'your-email@domain.com';
```

## Testing

### Test Super Admin Access

1. Log in as super admin
2. Navigate to `/super-admin`
3. Verify you can see all firms and users

### Test Impersonation

1. From super admin dashboard, click "Impersonate" on a user
2. Red banner should appear at top
3. Navigate around the app - you should see data as that user
4. Click "End Impersonation" to return to super admin view

### Test Audit Logs

Query impersonation history:

```sql
SELECT * FROM impersonation_sessions
ORDER BY created_at DESC;

SELECT * FROM audit_logs
WHERE action LIKE 'super_admin.%'
ORDER BY created_at DESC;
```

## Security Considerations

### Best Practices

1. **Limit Super Admins**: Only create super admin accounts for trusted personnel
2. **Always Provide Reason**: When impersonating, always provide a reason (e.g., "Troubleshooting invoice issue")
3. **Review Audit Logs**: Regularly review impersonation logs for suspicious activity
4. **Rotate Access**: Periodically review who has super admin access
5. **Use MFA**: Enable multi-factor authentication for all super admin accounts

### Audit Trail

All super admin actions are logged:
- User impersonation start/end
- Super admin creation
- Cross-firm data access (via RLS policies)

### Permissions

Super admins bypass ALL RLS policies through the `is_super_admin()` function check in policies.

## Troubleshooting

### Super Admin Can't See Data

Check:
1. User's role is exactly `'super_admin'` (case-sensitive)
2. SQL migration ran successfully
3. RLS policies include super admin checks
4. Browser cache cleared after role change

### Impersonation Not Working

Check:
1. Super admin role verified
2. Target user exists and is active
3. Database functions created successfully
4. No errors in browser console

### Can't Create Super Admin

Check:
1. Current user is already a super admin
2. Target email doesn't already exist
3. Firm domain validation if applicable

## API Endpoints Summary

| Endpoint | Purpose | Returns |
|----------|---------|---------|
| `isSuperAdmin()` | Check super admin status | `Promise<boolean>` |
| `getAllFirms()` | Get all firms | `ApiResponse<Firm[]>` |
| `getAllUsers(filters)` | Get all users | `ApiResponse<User[]>` |
| `getUserById(id)` | Get specific user | `ApiResponse<User>` |
| `updateUserProfile(id, data)` | Update user | `ApiResponse<User>` |
| `createSuperAdmin(data)` | Create super admin | `ApiResponse<{success}>` |
| `startImpersonation(id, reason)` | Start impersonating | `ApiResponse<Session>` |
| `endImpersonation()` | End impersonating | `ApiResponse<{success}>` |
| `getActiveImpersonation()` | Get current session | `ApiResponse<Session>` |
| `getImpersonationHistory(filters)` | Get history | `ApiResponse<Session[]>` |
| `getStats()` | Get dashboard stats | `ApiResponse<Stats>` |

## Future Enhancements

### Potential Additions

1. **Time-Limited Impersonation**: Auto-end after X minutes
2. **Impersonation Approval**: Require second super admin to approve
3. **Advanced Analytics**: Dashboard with graphs and trends
4. **Bulk Operations**: Bulk user management across firms
5. **System Settings**: Global configuration management
6. **Email Notifications**: Alert when impersonation occurs
7. **Session Recording**: Record actions during impersonation
8. **IP Whitelisting**: Restrict super admin access to specific IPs

## Support

For issues or questions:
1. Check audit logs for errors
2. Verify database migration completed
3. Check browser console for errors
4. Review Supabase logs for RLS policy issues

## Summary

The super admin implementation provides a complete solution for:
- ✅ Cross-firm data access
- ✅ User impersonation with audit trail
- ✅ Global user and firm management
- ✅ Secure permission system
- ✅ Full audit logging
- ⚠️ Needs UI components completed
- ⚠️ Needs TypeScript errors fixed

Once the remaining steps are completed, you'll have a fully functional super admin system!
