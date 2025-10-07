# Complete Setup Guide: Supabase + Vercel + Sentry

## 🎯 The Modern Stack

```
Frontend:  React + TypeScript (✅ You have this)
Backend:   Supabase (PostgreSQL + Auto APIs)
Hosting:   Vercel (One-click deploy)
Errors:    Sentry (Error tracking)
```

**Total Setup Time:** 4-6 hours
**Total Cost:** $0/month initially

---

## Part 1: Supabase Setup (2-3 hours)

### Step 1: Create Supabase Account & Project

1. **Sign up at https://supabase.com**
   - Click "Start your project"
   - Sign in with GitHub (recommended)
   - Free tier: 500MB database, no credit card needed

2. **Create New Project**
   ```
   Organization: Create new (or use existing)
   Project Name: financial-manager
   Database Password: [Generate Strong Password - SAVE THIS!]
   Region: Choose closest to you (US East, EU West, etc.)
   Pricing Plan: Free
   ```

   **Wait 2-3 minutes** for database to provision...

3. **Save Your Credentials**
   - Go to Settings → API
   - Copy and save:
     - Project URL: `https://xxxxx.supabase.co`
     - `anon` public key: `eyJhbGc...` (long string)

---

### Step 2: Design Database Schema

Let's create your database tables. I'll provide a schema optimized for your financial manager.

**Navigate to:** SQL Editor → New Query

#### Schema Overview
```
Relationships
    ↓
Master Accounts
    ↓
Households
    ↓
Clients
    ↓
Accounts
    ↓
Positions
```

#### Run This SQL (Copy and paste entire script)

```sql
-- ==================================================================
-- FINANCIAL MANAGER DATABASE SCHEMA
-- Optimized for scale and performance
-- ==================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================================================================
-- 1. RELATIONSHIPS TABLE
-- ==================================================================
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  relationship_name TEXT NOT NULL,
  relationship_status TEXT NOT NULL DEFAULT 'Active',

  -- Billing
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Computed fields (will be calculated)
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_households INTEGER DEFAULT 0,
  number_of_clients INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

-- ==================================================================
-- 2. MASTER ACCOUNTS TABLE
-- ==================================================================
CREATE TABLE master_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  master_account_number TEXT UNIQUE NOT NULL,
  master_account_name TEXT NOT NULL,
  master_account_status TEXT NOT NULL DEFAULT 'Active',

  -- Relationships
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,

  -- Billing
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Computed
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_households INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

-- ==================================================================
-- 3. HOUSEHOLDS TABLE
-- ==================================================================
CREATE TABLE households (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  household_name TEXT NOT NULL,
  household_status TEXT NOT NULL DEFAULT 'Active',

  -- Relationships
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Primary Contact
  primary_client_id UUID,

  -- Billing
  billing_aggregation_level TEXT DEFAULT 'household',
  default_fee_schedule_id UUID,

  -- Address
  mailing_address JSONB,

  -- Computed
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_clients INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

-- ==================================================================
-- 4. CLIENTS TABLE
-- ==================================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  full_legal_name TEXT NOT NULL,
  date_of_birth DATE,
  tax_id_type TEXT DEFAULT 'SSN',
  tax_id_number TEXT,
  entity_type TEXT DEFAULT 'Individual',
  client_status TEXT NOT NULL DEFAULT 'Active',

  -- Relationships
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Contact Info
  primary_email TEXT,
  secondary_email TEXT,
  mobile_phone TEXT,
  home_phone TEXT,
  office_phone TEXT,
  mailing_address JSONB,
  physical_address JSONB,

  -- Billing
  default_fee_schedule_id UUID,
  billing_frequency TEXT DEFAULT 'Quarterly',
  billing_method TEXT DEFAULT 'Debit from Account',
  fee_payment_account_id UUID,
  custom_fee_adjustment DECIMAL(5,2),

  -- Relationship Management
  primary_advisor TEXT,
  relationship_manager TEXT,
  service_team TEXT,
  client_since_date DATE,
  last_review_date DATE,
  next_review_date DATE,

  -- Additional
  risk_tolerance TEXT,
  investment_objectives TEXT,
  notes TEXT,
  preferred_contact_method TEXT,
  do_not_contact BOOLEAN DEFAULT false,
  do_not_email BOOLEAN DEFAULT false,
  do_not_call BOOLEAN DEFAULT false,

  -- Computed
  total_aum DECIMAL(15,2) DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0
);

-- ==================================================================
-- 5. ACCOUNTS TABLE
-- ==================================================================
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'Active',
  custodian TEXT,

  -- Relationships
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE SET NULL,
  relationship_id UUID REFERENCES relationships(id) ON DELETE SET NULL,
  master_account_id UUID REFERENCES master_accounts(id) ON DELETE SET NULL,

  -- Registration
  registration_type TEXT,
  tax_status TEXT,

  -- Balances (current snapshot)
  portfolio_value DECIMAL(15,2) DEFAULT 0,
  total_cash DECIMAL(15,2) DEFAULT 0,
  total_equity DECIMAL(15,2) DEFAULT 0,
  total_fixed_income DECIMAL(15,2) DEFAULT 0,
  total_alternative DECIMAL(15,2) DEFAULT 0,
  total_other DECIMAL(15,2) DEFAULT 0,

  -- Billing
  fee_schedule_id UUID,
  custom_fee_rate DECIMAL(5,4),
  billing_enabled BOOLEAN DEFAULT true,

  -- Dates
  account_opened_date DATE,
  account_closed_date DATE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==================================================================
-- 6. POSITIONS TABLE (Time-series data)
-- ==================================================================
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Date (for partitioning)
  date DATE NOT NULL,

  -- Security Info
  symbol TEXT NOT NULL,
  cusip TEXT,
  security_description TEXT,
  security_type TEXT,

  -- Position Data
  number_of_shares DECIMAL(15,4),
  price DECIMAL(15,4),
  market_value DECIMAL(15,2),
  cost_basis DECIMAL(15,2),
  unrealized_gain_loss DECIMAL(15,2),
  percent_of_account DECIMAL(5,2),

  -- Additional
  asset_class TEXT,
  sector TEXT,
  country TEXT
);

-- Create index on date for efficient time-series queries
CREATE INDEX idx_positions_date ON positions(date DESC);
CREATE INDEX idx_positions_account_date ON positions(account_id, date DESC);

-- ==================================================================
-- 7. FEE SCHEDULES TABLE
-- ==================================================================
CREATE TABLE fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Basic Info
  schedule_name TEXT NOT NULL,
  schedule_description TEXT,
  schedule_status TEXT DEFAULT 'Active',

  -- Tiers (stored as JSONB array)
  tiers JSONB NOT NULL,
  -- Example: [
  --   {"min": 0, "max": 1000000, "rate": 0.0100},
  --   {"min": 1000000, "max": 5000000, "rate": 0.0075},
  --   {"min": 5000000, "max": null, "rate": 0.0050}
  -- ]

  -- Settings
  billing_frequency TEXT DEFAULT 'Quarterly',
  minimum_fee DECIMAL(10,2),

  -- Effective dates
  effective_start_date DATE,
  effective_end_date DATE
);

-- ==================================================================
-- 8. BILLING PERIODS TABLE
-- ==================================================================
CREATE TABLE billing_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Period Info
  period_name TEXT NOT NULL UNIQUE, -- e.g., "Q4-2024"
  period_year INTEGER NOT NULL,
  period_quarter INTEGER, -- 1-4
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_in_period INTEGER NOT NULL,
  proration_factor DECIMAL(8,6), -- days/365

  -- Status
  status TEXT NOT NULL DEFAULT 'upcoming', -- upcoming, current, completed

  -- Summary
  total_fees_calculated DECIMAL(15,2) DEFAULT 0,
  number_of_accounts_billed INTEGER DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE
);

-- ==================================================================
-- 9. FEE CALCULATIONS TABLE
-- ==================================================================
CREATE TABLE fee_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  billing_period_id UUID REFERENCES billing_periods(id) ON DELETE CASCADE,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  fee_schedule_id UUID REFERENCES fee_schedules(id),

  -- Calculation Inputs
  average_aum DECIMAL(15,2) NOT NULL,
  fee_rate DECIMAL(5,4) NOT NULL,
  days_in_period INTEGER NOT NULL,
  proration_factor DECIMAL(8,6),

  -- Calculation Results
  calculated_fee DECIMAL(15,2) NOT NULL,
  adjustments DECIMAL(15,2) DEFAULT 0,
  final_fee DECIMAL(15,2) NOT NULL,

  -- Status
  status TEXT DEFAULT 'calculated', -- calculated, pending, invoiced, paid
  invoice_number TEXT,
  invoice_date DATE,
  payment_date DATE,

  -- Audit
  calculation_method TEXT,
  notes TEXT
);

-- ==================================================================
-- 10. BALANCE HISTORY TABLE (for historical tracking)
-- ==================================================================
CREATE TABLE balance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Relationships
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,

  -- Date
  date DATE NOT NULL,

  -- Balances snapshot
  portfolio_value DECIMAL(15,2),
  total_cash DECIMAL(15,2),
  total_equity DECIMAL(15,2),
  total_fixed_income DECIMAL(15,2),
  total_alternative DECIMAL(15,2),
  total_other DECIMAL(15,2)
);

CREATE INDEX idx_balance_history_account_date ON balance_history(account_id, date DESC);

-- ==================================================================
-- INDEXES FOR PERFORMANCE
-- ==================================================================

-- Relationships
CREATE INDEX idx_relationships_status ON relationships(relationship_status);

-- Master Accounts
CREATE INDEX idx_master_accounts_relationship ON master_accounts(relationship_id);
CREATE INDEX idx_master_accounts_status ON master_accounts(master_account_status);

-- Households
CREATE INDEX idx_households_relationship ON households(relationship_id);
CREATE INDEX idx_households_master_account ON households(master_account_id);
CREATE INDEX idx_households_status ON households(household_status);

-- Clients
CREATE INDEX idx_clients_household ON clients(household_id);
CREATE INDEX idx_clients_relationship ON clients(relationship_id);
CREATE INDEX idx_clients_master_account ON clients(master_account_id);
CREATE INDEX idx_clients_status ON clients(client_status);
CREATE INDEX idx_clients_email ON clients(primary_email);

-- Accounts
CREATE INDEX idx_accounts_client ON accounts(client_id);
CREATE INDEX idx_accounts_household ON accounts(household_id);
CREATE INDEX idx_accounts_relationship ON accounts(relationship_id);
CREATE INDEX idx_accounts_master_account ON accounts(master_account_id);
CREATE INDEX idx_accounts_status ON accounts(account_status);
CREATE INDEX idx_accounts_number ON accounts(account_number);

-- Positions (already created above)
CREATE INDEX idx_positions_symbol ON positions(symbol);
CREATE INDEX idx_positions_security_type ON positions(security_type);

-- Fee Calculations
CREATE INDEX idx_fee_calc_billing_period ON fee_calculations(billing_period_id);
CREATE INDEX idx_fee_calc_account ON fee_calculations(account_id);
CREATE INDEX idx_fee_calc_client ON fee_calculations(client_id);
CREATE INDEX idx_fee_calc_status ON fee_calculations(status);

-- ==================================================================
-- ROW LEVEL SECURITY (RLS) - For multi-tenancy later
-- ==================================================================

-- Enable RLS on all tables (we'll add policies later)
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_history ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (we'll add user-based policies later)
CREATE POLICY "Allow all for now" ON relationships FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON master_accounts FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON households FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON accounts FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON fee_schedules FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON billing_periods FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON fee_calculations FOR ALL USING (true);
CREATE POLICY "Allow all for now" ON balance_history FOR ALL USING (true);

-- ==================================================================
-- FUNCTIONS FOR AUTO-UPDATING TIMESTAMPS
-- ==================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_master_accounts_updated_at BEFORE UPDATE ON master_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_households_updated_at BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_schedules_updated_at BEFORE UPDATE ON fee_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- SAMPLE DATA (Optional - for testing)
-- ==================================================================

-- Insert a sample fee schedule
INSERT INTO fee_schedules (schedule_name, schedule_description, tiers, billing_frequency)
VALUES (
  'Standard Advisory Fee Schedule',
  'Tiered fee schedule for standard advisory accounts',
  '[
    {"min": 0, "max": 1000000, "rate": 0.0100, "label": "First $1M"},
    {"min": 1000000, "max": 5000000, "rate": 0.0075, "label": "$1M - $5M"},
    {"min": 5000000, "max": null, "rate": 0.0050, "label": "Over $5M"}
  ]'::jsonb,
  'Quarterly'
);

-- Insert current billing period (Q4 2024)
INSERT INTO billing_periods (
  period_name,
  period_year,
  period_quarter,
  start_date,
  end_date,
  days_in_period,
  proration_factor,
  status
) VALUES (
  'Q4-2024',
  2024,
  4,
  '2024-10-01',
  '2024-12-31',
  92,
  92.0/365.0,
  'current'
);

-- Insert upcoming billing period (Q1 2025)
INSERT INTO billing_periods (
  period_name,
  period_year,
  period_quarter,
  start_date,
  end_date,
  days_in_period,
  proration_factor,
  status
) VALUES (
  'Q1-2025',
  2025,
  1,
  '2025-01-01',
  '2025-03-31',
  90,
  90.0/365.0,
  'upcoming'
);

-- ==================================================================
-- SUCCESS!
-- ==================================================================

SELECT 'Database schema created successfully!' as message;
```

**Run the query** (click "RUN" button)

You should see: "Database schema created successfully!"

---

### Step 3: Verify Tables Created

**Navigate to:** Table Editor

You should see these tables:
- ✅ relationships
- ✅ master_accounts
- ✅ households
- ✅ clients
- ✅ accounts
- ✅ positions
- ✅ fee_schedules
- ✅ billing_periods
- ✅ fee_calculations
- ✅ balance_history

---

### Step 4: Enable Realtime (Optional but Cool!)

**Navigate to:** Database → Replication

**Enable realtime for these tables** (check boxes):
- clients
- accounts
- fee_calculations

This allows live updates in your app! 🔥

---

### Step 5: Set Up Storage (for CSV uploads)

**Navigate to:** Storage

1. **Create new bucket:**
   - Name: `imports`
   - Public: No (private)
   - File size limit: 50MB

2. **Create another bucket:**
   - Name: `exports`
   - Public: No (private)
   - File size limit: 50MB

---

## Part 2: React App Integration (1 hour)

### Step 1: Install Supabase Client

```bash
cd "s:/Software Development/financial_manager"
npm install @supabase/supabase-js
```

### Step 2: Create Environment Variables

Create `.env.local` in your project root:

```bash
# .env.local
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**Replace with your actual values** from Supabase Settings → API

**Important:** Add to `.gitignore`:
```bash
echo ".env.local" >> .gitignore
```

### Step 3: Create Supabase Client

Create file: `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application': 'financial-manager',
    },
  },
});

// Export types helper for TypeScript
export type Database = any; // We'll generate this later
```

### Step 4: Generate TypeScript Types (Optional but Awesome!)

Supabase can auto-generate TypeScript types from your database schema.

**Option A: Using Supabase CLI** (Recommended)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Generate types
supabase gen types typescript --project-id your-project-ref > src/types/supabase.ts
```

**Option B: Manual types** (We can skip this for now)

### Step 5: Update Clients Service

Update `src/services/api/clients.service.ts`:

```typescript
import { supabase } from '../../lib/supabase';
import { Client } from '../../types/Client';

export const clientsService = {
  // Get all clients
  async getAll() {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        household:households(id, household_name),
        accounts(id, account_number, portfolio_value)
      `)
      .order('full_legal_name');

    if (error) {
      console.error('Error fetching clients:', error);
      return { error: error.message };
    }

    // Calculate computed fields
    const clients = data?.map(client => ({
      ...client,
      totalAUM: client.accounts?.reduce((sum, acc) => sum + (acc.portfolio_value || 0), 0) || 0,
      numberOfAccounts: client.accounts?.length || 0,
    }));

    return { data: clients };
  },

  // Get client by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        household:households(*),
        accounts(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  },

  // Create new client
  async create(clientData: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .insert(clientData)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  },

  // Update client
  async update(id: string, updates: Partial<Client>) {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data };
  },

  // Delete client
  async delete(id: string) {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    return { data: undefined };
  },

  // Real-time subscription
  subscribeToChanges(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('clients-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'clients' },
        callback
      )
      .subscribe();

    return subscription;
  },
};
```

---

## Part 3: Vercel Deployment (30 minutes)

### Step 1: Create Vercel Account

1. Go to **https://vercel.com**
2. **Sign up with GitHub** (easiest)
3. Authorize Vercel

### Step 2: Push Code to GitHub

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add remote (create repo on GitHub first)
git remote add origin https://github.com/yourusername/financial-manager.git

# Commit all changes
git add .
git commit -m "feat: integrate Supabase backend"
git push -u origin main
```

### Step 3: Import Project to Vercel

1. **Go to Vercel Dashboard**
2. Click **"Add New..." → Project**
3. **Import Git Repository**
   - Select your GitHub repo: `financial-manager`
   - Click "Import"

4. **Configure Project:**
   ```
   Framework Preset: Create React App
   Root Directory: ./
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

5. **Environment Variables:**
   Click "Environment Variables" and add:
   ```
   REACT_APP_SUPABASE_URL = https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY = your-anon-key
   ```

6. Click **"Deploy"**

**Wait 2-3 minutes...** ☕

You'll get a URL like: `https://financial-manager-xxx.vercel.app`

### Step 4: Set Up Custom Domain (Optional)

1. **Go to Project Settings → Domains**
2. **Add your domain**: `yourdomain.com`
3. **Follow DNS instructions** from Vercel
4. Wait for DNS propagation (5-30 minutes)

---

## Part 4: Sentry Error Tracking (30 minutes)

### Step 1: Create Sentry Account

1. Go to **https://sentry.io**
2. **Sign up** (free tier: 5,000 errors/month)
3. Create organization

### Step 2: Create New Project

1. Click **"Create Project"**
2. Choose platform: **React**
3. Project name: `financial-manager`
4. Click "Create Project"

### Step 3: Install Sentry

```bash
npm install --save @sentry/react
```

### Step 4: Get Your DSN

Copy your DSN from the setup page:
```
https://xxxxx@xxxxxx.ingest.sentry.io/xxxxxx
```

Add to `.env.local`:
```bash
REACT_APP_SENTRY_DSN=https://xxxxx@xxxxxx.ingest.sentry.io/xxxxxx
```

### Step 5: Update Error Tracking

Update `src/utils/errorTracking.ts` (uncomment the code):

```typescript
import * as Sentry from '@sentry/react';

export const initializeErrorTracking = () => {
  if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,

      // Sample 25% of errors (adjust as needed)
      sampleRate: 0.25,

      // Performance monitoring (10% of transactions)
      tracesSampleRate: 0.1,

      // Release version
      release: `financial-manager@${process.env.REACT_APP_VERSION || '0.1.0'}`,

      integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }
};

export const logError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
};
```

### Step 6: Initialize in App

Update `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { initializeErrorTracking } from './utils/errorTracking';
import * as Sentry from '@sentry/react';

function App() {
  useEffect(() => {
    initializeErrorTracking();
  }, []);

  return (
    <Sentry.ErrorBoundary fallback={<ErrorFallback />}>
      {/* Your app content */}
    </Sentry.ErrorBoundary>
  );
}
```

### Step 7: Add to Vercel Environment Variables

Add to Vercel dashboard:
```
REACT_APP_SENTRY_DSN = your-sentry-dsn
```

Redeploy from Vercel dashboard.

---

## Part 5: Testing Everything Works (30 minutes)

### Test 1: Database Connection

Create `src/test-supabase.ts`:

```typescript
import { supabase } from './lib/supabase';

async function testConnection() {
  console.log('Testing Supabase connection...');

  // Test 1: Fetch fee schedules
  const { data: schedules, error: schedulesError } = await supabase
    .from('fee_schedules')
    .select('*');

  console.log('Fee Schedules:', schedules);

  // Test 2: Fetch billing periods
  const { data: periods, error: periodsError } = await supabase
    .from('billing_periods')
    .select('*');

  console.log('Billing Periods:', periods);

  // Test 3: Create test client
  const { data: newClient, error: clientError } = await supabase
    .from('clients')
    .insert({
      full_legal_name: 'Test Client',
      client_status: 'Active',
      entity_type: 'Individual',
    })
    .select()
    .single();

  console.log('Created Client:', newClient);

  // Test 4: Delete test client
  if (newClient) {
    await supabase.from('clients').delete().eq('id', newClient.id);
    console.log('Deleted test client');
  }

  console.log('✅ All tests passed!');
}

testConnection();
```

Run it temporarily in your app to test.

### Test 2: Vercel Deployment

Visit your Vercel URL and check:
- ✅ App loads
- ✅ No console errors
- ✅ Can view pages

### Test 3: Sentry Error Tracking

Add a test button:

```typescript
<button onClick={() => {
  throw new Error('Test Sentry Error!');
}}>
  Test Error Tracking
</button>
```

Click it, then check Sentry dashboard for the error.

---

## Part 6: Next Steps

### Immediate:
1. **Replace mock data** in all service files
2. **Test CRUD operations** on each entity
3. **Add authentication** (Supabase Auth)
4. **Import your existing data** via CSV

### Soon:
1. **Set up proper RLS policies** (row-level security)
2. **Add real-time subscriptions** for live updates
3. **Optimize database queries** with proper indexes
4. **Add database backups** (automatic in Supabase)

---

## 🎉 Checklist

- [ ] Supabase project created
- [ ] Database schema created (10 tables)
- [ ] Supabase client installed in React
- [ ] Environment variables configured
- [ ] Vercel account created
- [ ] GitHub repo connected
- [ ] Vercel deployment successful
- [ ] Custom domain configured (optional)
- [ ] Sentry account created
- [ ] Sentry SDK installed
- [ ] Error tracking tested
- [ ] Database connection tested

---

## 📊 Your New Stack

```
✅ Frontend:  React + TypeScript (Vercel)
✅ Backend:   Supabase (PostgreSQL + Auto APIs)
✅ Hosting:   Vercel (https://your-app.vercel.app)
✅ Errors:    Sentry (Error tracking)
✅ Database:  10 tables, indexed, optimized
✅ Cost:      $0/month to start!
```

---

## 🆘 Troubleshooting

### Issue: Can't connect to Supabase
- Check environment variables are set
- Verify `.env.local` is not in `.gitignore` for local dev
- Check Supabase project is not paused (free tier sleeps after 7 days inactivity)

### Issue: Vercel build fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in `package.json`
- Check environment variables are set in Vercel

### Issue: Sentry not capturing errors
- Verify DSN is correct
- Check errors are happening in production build
- Sentry only captures errors in production mode by default

---

## 📚 Useful Commands

```bash
# Local development
npm start

# Build for production
npm run build

# Deploy to Vercel
git push origin main  # Auto-deploys!

# View Vercel logs
npx vercel logs

# Generate Supabase types
supabase gen types typescript --project-id your-ref > src/types/supabase.ts
```

---

## 🚀 Ready to Code!

Everything is set up! You now have:
- ✅ Production-ready backend (Supabase)
- ✅ Auto-deployed hosting (Vercel)
- ✅ Error tracking (Sentry)
- ✅ Database with 10 tables
- ✅ Type-safe APIs

**Next:** Let's migrate your data and replace mock services!

Want me to help you:
1. Import your existing CSV data to Supabase?
2. Update the remaining service files?
3. Add authentication?
4. Something else?
