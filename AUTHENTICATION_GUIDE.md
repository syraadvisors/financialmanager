# FeeMGR Authentication & Authorization System

## Overview

FeeMGR implements a comprehensive authentication and authorization system with:
- **Google OAuth** for secure sign-in
- **Multi-tenant architecture** with email domain whitelisting
- **Role-Based Access Control (RBAC)** with 3 roles
- **User profiles** with preferences
- **Email verification** (configurable)
- **Multi-Factor Authentication (MFA)** support (configurable)
- **Audit logging** for compliance

---

## Architecture

### Database Schema

#### Tables Created
1. **user_profiles** - Stores user information, roles, preferences
2. **permissions** - Defines granular permissions
3. **role_permissions** - Maps roles to permissions
4. **audit_logs** - Tracks all user actions

#### Migration Script
Run `database/12_create_user_profiles_and_rbac.sql` in Supabase SQL Editor

---

## Roles & Permissions

### Three Roles

| Role | Description | Access Level |
|------|-------------|--------------|
| **admin** | Full system access | Can manage users, settings, all data |
| **user** | Standard access | Can create/edit most data, no user management |
| **viewer** | Read-only access | Can view data only |

### Permissions by Role

#### Admin Permissions
- All client operations (view, create, update, delete)
- All account operations
- All fee operations (including delete)
- All settings operations
- All user management operations (view, create, update, delete)
- All import operations

#### User Permissions
- Client operations (view, create, update)
- Account operations (view, create, update)
- Fee operations (view, create, update, calculate)
- Import operations

#### Viewer Permissions
- View clients
- View accounts
- View fees

---

## Authentication Flow

### 1. Google OAuth Sign-In

```
User clicks "Sign in with Google"
    ↓
Redirects to Google OAuth consent screen
    ↓
User grants permission
    ↓
Redirects to /auth/callback
    ↓
AuthCallback validates email domain
    ↓
If domain authorized:
  - Creates/updates user profile
  - Logs login to audit_logs
  - Redirects to dashboard
Else:
  - Shows error message
  - Redirects to login page
```

### 2. Email Domain Whitelisting

**Authorized Domains** (configured in `firms` table):
- `syraadvisors.com`
- `casrocny.com`

To add more domains, insert into the `firms` table:

```sql
INSERT INTO firms (firm_name, firm_domain, firm_status)
VALUES ('Your Company', 'yourdomain.com', 'Active');
```

### 3. Profile Creation

On first login, a `user_profiles` entry is automatically created:
- Default role: `user`
- Default status: `active`
- Email from Google OAuth
- Full name from Google profile
- Avatar URL from Google

### 4. Session Management

- **Default session**: 1 hour
- **Remember Me** (optional): 30 days
- Configured in user preferences

---

## User Profile Modal

Access via avatar menu → "My Profile"

### Three Tabs

#### 1. Profile Tab
- Full Name
- Job Title
- Department
- Phone Number
- Bio

#### 2. Preferences Tab
- Theme (Light/Dark)
- Timezone
- Language
- Notifications toggle
- Email notifications toggle
- Remember Me toggle

#### 3. Security Tab
- Email verification status
- MFA status
- Last login timestamp
- Total login count
- MFA enrollment button

---

## User Management (Admin Only)

Navigate to **User Management** from the sidebar (admins only).

### Features

1. **User List**
   - View all users in your firm
   - See user details, roles, status
   - Filter by role, status, search

2. **Role Management**
   - Change user roles (admin/user/viewer)
   - Dropdown selection per user
   - Cannot change your own role

3. **Status Management**
   - Suspend/activate users
   - Suspended users cannot log in
   - Cannot suspend yourself

4. **Statistics Dashboard**
   - Total users
   - Active users
   - Admin count

### Permissions Required
- `users.view` - See user management page
- `users.update` - Change roles and status

---

## Setting Up Email Verification

### Supabase Dashboard Steps

1. Go to **Authentication** → **Settings**
2. Under **User Signups**, enable **Confirm email**
3. Configure email templates (optional):
   - Go to **Authentication** → **Email Templates**
   - Customize "Confirm signup" template

### In Your App

Email verification status is automatically tracked in `user_profiles.email_verified`.

Users can see their verification status in:
- Profile Modal → Security tab
- Shows green checkmark if verified
- Shows warning if not verified

---

## Setting Up MFA (Multi-Factor Authentication)

### Supabase Dashboard Steps

1. Go to **Authentication** → **Settings**
2. Under **Multi-Factor Authentication**:
   - Enable **Phone (SMS)** or **Authenticator App**
   - Configure phone provider (Twilio, MessageBird)
   - Or use **TOTP** for authenticator apps

### In Your App

MFA enrollment button is in:
- Profile Modal → Security tab
- Click "Enable MFA" button
- Follow Supabase's MFA enrollment flow

MFA status is tracked in `user_profiles.mfa_enabled`.

---

## Audit Logging

All user actions are logged to the `audit_logs` table:

### What's Logged
- User logins
- Profile updates
- Role changes (by admins)
- Status changes (by admins)
- All data modifications (future)

### Log Structure
```typescript
{
  id: UUID,
  user_id: UUID,
  firm_id: UUID,
  action: 'login' | 'create' | 'update' | 'delete',
  resource_type: 'client' | 'account' | etc.,
  resource_id: string,
  details: JSON,
  ip_address: string,
  user_agent: string,
  created_at: timestamp
}
```

### Viewing Audit Logs

Admins can query audit logs:

```sql
-- View all logs for your firm
SELECT * FROM audit_logs
WHERE firm_id = 'your-firm-id'
ORDER BY created_at DESC;

-- View specific user's actions
SELECT * FROM audit_logs
WHERE user_id = 'user-id'
ORDER BY created_at DESC;
```

---

## API Usage

### Check User Permissions

```typescript
import { useAuth } from '../contexts/AuthContext';

const MyComponent = () => {
  const { hasPermission, hasRole } = useAuth();

  // Check permission
  if (hasPermission('clients.delete')) {
    // Show delete button
  }

  // Check role
  if (hasRole('admin')) {
    // Show admin panel
  }
};
```

### User Service API

```typescript
import { usersService } from '../services/api/users.service';

// Get current user profile
const { data: profile } = await usersService.getCurrentUserProfile();

// Update profile
await usersService.updateProfile({
  fullName: 'John Doe',
  jobTitle: 'Financial Advisor'
});

// Update preferences
await usersService.updatePreferences({
  theme: 'dark',
  rememberMe: true
});

// Get all users in firm (admin only)
const { data: users } = await usersService.getAllInFirm(firmId);

// Update user role (admin only)
await usersService.updateUserRole(userId, 'admin');

// Update user status (admin only)
await usersService.updateUserStatus(userId, 'suspended');
```

---

## Security Features

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only see data from their firm
- Users can only update their own profile
- Admins can update any profile in their firm
- Firm data is completely isolated

### Multi-Tenant Isolation

- Every table has `firm_id`
- All queries filter by `firm_id`
- Users auto-assigned to firm via email domain
- Cross-firm data access is impossible

### Protected Routes

All routes require authentication:
```typescript
<Route path="/*" element={
  <ProtectedRoute>
    <App />
  </ProtectedRoute>
} />
```

---

## Configuration

### Environment Variables

Required in `.env.local`:
```env
REACT_APP_SUPABASE_URL=your-supabase-url
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

### Google OAuth Setup

1. Create project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth credentials
4. Add to Supabase:
   - Dashboard → Authentication → Providers → Google
   - Paste Client ID and Client Secret
5. Add redirect URL:
   - `https://your-project.supabase.co/auth/v1/callback`

### OAuth Consent Screen

- Set to **External** (unless using Google Workspace)
- App name: **FeeMGR**
- Support email: Your email
- Logo: Optional
- Scopes: `email`, `profile`, `openid`

---

## Making Yourself Admin

After first login, run this SQL in Supabase:

```sql
UPDATE user_profiles
SET role = 'admin'
WHERE email = 'your-email@syraadvisors.com';
```

Then refresh the page. You'll now see the "User Management" menu item.

---

## Troubleshooting

### "Domain not authorized" error

**Solution:** Add your email domain to the `firms` table:
```sql
INSERT INTO firms (firm_name, firm_domain, firm_status)
VALUES ('Your Company', 'yourdomain.com', 'Active');
```

### Stuck on loading screen

**Solution:** Clear browser storage:
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.href = '/login';
```

### "Profile not found" error

**Solution:** Sign out and sign back in to create profile, or manually insert:
```sql
INSERT INTO user_profiles (id, firm_id, email, role)
SELECT
  auth.uid(),
  (SELECT id FROM firms WHERE firm_domain = 'yourdomain.com'),
  'your-email@yourdomain.com',
  'admin';
```

### Can't see User Management page

**Check:**
1. Your role is 'admin':
   ```sql
   SELECT role FROM user_profiles WHERE id = auth.uid();
   ```
2. You have permission:
   ```sql
   SELECT * FROM role_permissions rp
   JOIN permissions p ON p.id = rp.permission_id
   WHERE rp.role = 'admin' AND p.name = 'users.view';
   ```

---

## Future Enhancements

### Planned Features
- [ ] Invite users via email
- [ ] Password reset flow (for email/password auth)
- [ ] Custom roles with granular permissions
- [ ] IP whitelisting
- [ ] Session management (view/revoke sessions)
- [ ] Advanced audit log viewer in UI
- [ ] Export audit logs
- [ ] User activity dashboard

### Potential Integrations
- [ ] Microsoft/Azure AD SSO
- [ ] SAML 2.0 support
- [ ] LDAP integration
- [ ] Slack notifications for admin actions

---

## Support

For issues or questions:
1. Check Supabase logs: Dashboard → Logs
2. Check browser console for errors
3. Verify RLS policies are correct
4. Ensure user has proper role/permissions

---

## Summary

✅ **Completed Features:**
- Google OAuth authentication
- Email domain whitelisting
- User profiles with preferences
- Role-Based Access Control (3 roles)
- User management admin panel
- Audit logging
- Protected routes
- Multi-tenant isolation
- Remember Me functionality

🔧 **Configuration Required:**
- Enable email verification (Supabase dashboard)
- Enable MFA (Supabase dashboard)
- Make yourself admin (SQL command)

🎯 **Ready to Use:**
- Login with Google
- Edit your profile
- Manage users (if admin)
- All features work out of the box!
