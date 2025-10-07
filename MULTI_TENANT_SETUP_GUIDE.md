# Multi-Tenant Architecture Setup Guide

## Overview

This guide walks you through implementing multi-tenant (firm-level) data isolation for your financial management application. This architecture allows multiple firms to use the same application while keeping their data completely separate.

## Architecture Design

### Key Concepts

1. **Firm Isolation**: Each firm's data is completely isolated using `firm_id` foreign keys
2. **Row Level Security (RLS)**: PostgreSQL RLS ensures users can only access their firm's data
3. **OAuth Integration**: Google OAuth with email domain restrictions
4. **Scalability**: Designed to support thousands of firms efficiently

### Data Flow

```
User logs in with Google OAuth
    ↓
Email domain validated (e.g., @yourfirm.com)
    ↓
User matched to firm record
    ↓
firm_id stored in JWT token (app_metadata)
    ↓
All queries automatically filtered by firm_id via RLS
    ↓
User only sees their firm's data
```

## Step-by-Step Implementation

### Phase 1: Database Schema Updates (Do This First)

#### 1. Create Firms Table

Run this script in Supabase SQL Editor:

```bash
database/06_create_firms_table.sql
```

**Important:** After running, note your firm's UUID:
```sql
SELECT id, firm_name, firm_domain FROM firms;
```

You'll need this ID for testing.

#### 2. Add firm_id to All Tables

Run this script:

```bash
database/07_add_firm_id_to_tables.sql
```

This will:
- Add `firm_id` column to all 10 data tables
- Update your existing sample data with the test firm's ID
- Create indexes for query performance
- Make `firm_id` required (NOT NULL)

#### 3. Update Row Level Security Policies

Run this script:

```bash
database/08_update_rls_for_multi_tenant.sql
```

This implements firm-scoped RLS policies that:
- Allow users to only see their firm's data
- Automatically filter all queries by `firm_id`
- Prevent cross-firm data access

### Phase 2: Update TypeScript Types

Add `firmId` to all your TypeScript interfaces:

**Example for Client type:**

```typescript
export interface Client {
  id: string;
  firmId: string; // ADD THIS
  createdAt: Date;
  updatedAt: Date;
  fullLegalName: string;
  // ... rest of fields
}
```

Do this for:
- Client
- Account
- Household
- Relationship
- Position
- FeeSchedule
- BillingPeriod
- FeeCalculation
- BalanceHistory

### Phase 3: Update Service Layer

Modify all service functions to handle `firm_id`:

**For Development (Before Auth):**
Create a context to store the current firm:

```typescript
// src/contexts/FirmContext.tsx
import React, { createContext, useContext, useState } from 'react';

interface FirmContextType {
  firmId: string | null;
  setFirmId: (id: string) => void;
}

const FirmContext = createContext<FirmContextType>({
  firmId: null,
  setFirmId: () => {},
});

export const useFirm = () => useContext(FirmContext);

export const FirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // For development, hardcode your test firm ID
  const [firmId, setFirmId] = useState<string>('YOUR_FIRM_ID_FROM_STEP_1');

  return (
    <FirmContext.Provider value={{ firmId, setFirmId }}>
      {children}
    </FirmContext.Provider>
  );
};
```

**Update Service Functions:**

```typescript
// src/services/api/clients.service.ts
import { useFirm } from '../../contexts/FirmContext';

export const clientsService = {
  async create(client: Partial<Client>): Promise<ApiResponse<Client>> {
    const { firmId } = useFirm(); // Get current firm context

    const snakeCaseClient = mapToSnakeCase({
      ...client,
      firmId, // Add firm_id to all creates
    });

    // ... rest of create logic
  },

  // getAll, getById, etc. automatically filtered by RLS
};
```

### Phase 4: Google OAuth Setup

#### 1. Enable Google Auth in Supabase

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google OAuth
3. Add your Google Client ID and Secret
4. Configure redirect URL: `https://your-project.supabase.co/auth/v1/callback`

#### 2. Set Up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable Google+ API
4. Create OAuth 2.0 Credentials
5. Add authorized redirect URIs
6. Copy Client ID and Secret to Supabase

#### 3. Implement Email Domain Restriction

Create a Supabase Edge Function or Database Function:

```sql
-- Function to validate email domain and assign firm
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_domain TEXT;
  matched_firm_id UUID;
BEGIN
  -- Extract domain from email
  user_domain := split_part(NEW.email, '@', 2);

  -- Find firm with matching domain
  SELECT id INTO matched_firm_id
  FROM firms
  WHERE firm_domain = user_domain
    AND firm_status = 'Active';

  -- If no matching firm, reject signup
  IF matched_firm_id IS NULL THEN
    RAISE EXCEPTION 'Email domain % is not authorized', user_domain;
  END IF;

  -- Store firm_id in user metadata
  NEW.raw_app_meta_data := jsonb_set(
    COALESCE(NEW.raw_app_meta_data, '{}'::jsonb),
    '{firm_id}',
    to_jsonb(matched_firm_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on user signup
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();
```

#### 4. Add Login to React App

```typescript
// src/components/LoginPage.tsx
import { supabase } from '../lib/supabase';

const LoginPage = () => {
  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Login error:', error);
      alert('Login failed: ' + error.message);
    }
  };

  return (
    <button onClick={handleGoogleLogin}>
      Sign in with Google
    </button>
  );
};
```

### Phase 5: Testing Multi-Tenancy

#### Test Scenario 1: Single Firm Isolation

1. Create test data for Firm A
2. Query clients - should only see Firm A's clients
3. Try to manually query Firm B's data (should fail)

```sql
-- Should only return Firm A's clients
SELECT * FROM clients; -- RLS automatically filters

-- Direct query should fail (RLS blocks it)
SELECT * FROM clients WHERE firm_id = 'FIRM_B_ID'; -- Returns empty
```

#### Test Scenario 2: Cross-Firm Protection

1. Log in as user from Firm A
2. Note a client ID from Firm B (via direct DB access)
3. Try to access Firm B's client via API
4. Should fail or return empty

#### Test Scenario 3: OAuth Domain Restriction

1. Try to sign up with email from unauthorized domain
2. Should be rejected
3. Sign up with authorized domain
4. Should succeed and be assigned correct firm_id

## Scaling Considerations

### Database Performance

**Current Design (Good for 100+ firms):**
- Indexed firm_id on all tables
- Composite indexes for common queries
- RLS policies optimized

**At Scale (1000+ firms):**
- Consider partitioning large tables by firm_id
- Implement caching layer (Redis)
- Use read replicas for reporting

### Cost Scaling

**Storage:**
- 100 firms × 500 clients = 50,000 clients
- ~50GB database = $25/month (Supabase Pro)

**Performance:**
- Up to 500 concurrent users: Supabase Pro ($25/mo)
- 500-2000 users: Dedicated instance ($599/mo)

### Migration Path

**When you outgrow Supabase:**
1. Export PostgreSQL database
2. Set up AWS RDS or Google Cloud SQL
3. Deploy backend API (Node.js/Express)
4. Keep same database schema (minimal changes)

## Development Workflow

### Without Authentication (Current)

1. Hardcode firm_id in FirmContext
2. Temporarily disable RLS or use permissive policies
3. Test all features with single firm

### With Authentication

1. Enable Google OAuth
2. Remove hardcoded firm_id
3. Get firm_id from authenticated user
4. Enable full RLS policies

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] firm_id is NOT NULL on all tables
- [ ] Indexes created for firm_id
- [ ] Email domain validation enabled
- [ ] OAuth configured correctly
- [ ] Service role key secured (never in frontend)
- [ ] anon key used in frontend (safe)
- [ ] CORS configured properly
- [ ] Rate limiting enabled

## Troubleshooting

### Issue: Can't see any data after RLS update

**Cause:** RLS is blocking queries because user doesn't have firm_id

**Solution (Development):**
```sql
-- Temporarily allow anon access
CREATE POLICY "temp_allow_anon" ON clients
  FOR ALL USING (true) WITH CHECK (true);
```

### Issue: "firm_id violates not-null constraint"

**Cause:** Trying to insert without firm_id

**Solution:** Ensure FirmContext provides firm_id, or pass it explicitly:
```typescript
await clientsService.create({ ...clientData, firmId: currentFirmId });
```

### Issue: User can't log in with valid email

**Cause:** Email domain not in firms table

**Solution:**
```sql
-- Check firms table
SELECT * FROM firms WHERE firm_domain = 'yourdomain.com';

-- Add if missing
INSERT INTO firms (firm_name, firm_domain)
VALUES ('Your Firm', 'yourdomain.com');
```

## Next Steps

After completing multi-tenant setup:

1. **Test thoroughly** with your test firm
2. **Add second test firm** to verify isolation
3. **Implement OAuth** for production auth
4. **Update all pages** to use firm context
5. **Deploy to Vercel** with environment variables

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Multi-Tenant Patterns](https://supabase.com/docs/guides/auth/managing-user-data#using-triggers)
- [Google OAuth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
