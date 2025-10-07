-- =====================================================
-- Multi-Tenant Architecture: Firms Table
-- =====================================================
-- This table stores firm/organization information
-- All other tables will reference firm_id for data isolation

-- Create firms table
CREATE TABLE IF NOT EXISTS firms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Firm Information
  firm_name TEXT NOT NULL,
  firm_domain TEXT NOT NULL UNIQUE, -- e.g., 'yourfirm.com' for email domain restriction
  firm_status TEXT NOT NULL DEFAULT 'Active', -- Active, Suspended, Inactive

  -- Contact Information
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  phone_number TEXT,

  -- Address
  address JSONB, -- {street, city, state, zip, country}

  -- Billing/Subscription (for future SaaS model)
  subscription_tier TEXT DEFAULT 'trial', -- trial, basic, professional, enterprise
  subscription_status TEXT DEFAULT 'active', -- active, past_due, cancelled
  max_users INTEGER DEFAULT 5,
  max_clients INTEGER DEFAULT 100,
  billing_email TEXT,

  -- Settings
  settings JSONB DEFAULT '{}', -- Firm-specific settings/preferences

  -- Feature Flags (for per-firm features)
  features JSONB DEFAULT '{"advanced_reporting": false, "api_access": false}',

  CONSTRAINT valid_firm_status CHECK (firm_status IN ('Active', 'Suspended', 'Inactive'))
);

-- Add index for domain lookup (used during OAuth)
CREATE INDEX idx_firms_domain ON firms(firm_domain);
CREATE INDEX idx_firms_status ON firms(firm_status);

-- Add updated_at trigger
CREATE TRIGGER update_firms_updated_at
  BEFORE UPDATE ON firms
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert your test firm
INSERT INTO firms (
  firm_name,
  firm_domain,
  firm_status,
  subscription_tier,
  subscription_status,
  max_users,
  max_clients
) VALUES (
  'Test Financial Advisors',
  'testfirm.com', -- Change this to your actual email domain
  'Active',
  'professional',
  'active',
  10,
  1000
);

-- Get the firm_id for use in next migration
-- You'll need to note this ID after running this script
SELECT id, firm_name, firm_domain FROM firms;
