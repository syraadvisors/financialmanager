-- Migration: Create billing_fee_agreements table
-- Description: Billing Fee Agreements determine how fees are calculated and applied to accounts
-- A billing fee agreement links relationships, households, and accounts to a specific fee schedule

CREATE TABLE IF NOT EXISTS public.billing_fee_agreements (
  -- System Fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Basic Information
  agreement_number TEXT NOT NULL UNIQUE, -- Auto-generated unique identifier
  status TEXT NOT NULL CHECK (status IN ('Active', 'Inactive', 'Pending', 'Terminated')),

  -- Fee Schedule Reference
  fee_schedule_id UUID REFERENCES public.fee_schedules(id) ON DELETE RESTRICT,
  fee_schedule_code TEXT,     -- Denormalized for display
  fee_schedule_name TEXT,     -- Denormalized for display

  -- Billing Configuration
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('Quarterly', 'Semi-Annual', 'Annual', 'Monthly')),
  billing_method TEXT NOT NULL CHECK (billing_method IN ('Arrears', 'Advance')),
  billing_day INTEGER CHECK (billing_day BETWEEN 1 AND 31),

  -- Scope - What this agreement covers
  relationship_id UUID REFERENCES public.relationships(id) ON DELETE SET NULL,
  relationship_name TEXT,     -- Denormalized for display

  household_ids UUID[] DEFAULT ARRAY[]::UUID[],
  household_names TEXT[] DEFAULT ARRAY[]::TEXT[],    -- Denormalized for display

  account_ids UUID[] DEFAULT ARRAY[]::UUID[],
  account_numbers TEXT[] DEFAULT ARRAY[]::TEXT[],    -- Denormalized for display
  account_names TEXT[] DEFAULT ARRAY[]::TEXT[],      -- Denormalized for display

  -- Primary Contact
  primary_contact_client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  primary_contact_client_name TEXT,

  -- Fee Adjustments
  custom_fee_adjustment DECIMAL(5, 2),  -- Percentage (e.g., -10.00 for 10% discount)
  custom_fee_adjustment_notes TEXT,

  -- Agreement Dates
  effective_date DATE NOT NULL,
  termination_date DATE,
  next_billing_date DATE,
  last_billing_date DATE,

  -- Metadata
  notes TEXT,
  internal_notes TEXT,

  -- Calculated Fields (denormalized for performance)
  number_of_households INTEGER DEFAULT 0,
  number_of_accounts INTEGER DEFAULT 0,
  total_aum DECIMAL(15, 2) DEFAULT 0,
  estimated_annual_fees DECIMAL(15, 2) DEFAULT 0,
  estimated_quarterly_fees DECIMAL(15, 2) DEFAULT 0,

  -- Note: agreement_number already has UNIQUE constraint above
);

-- Create indexes for common queries
CREATE INDEX idx_billing_fee_agreements_firm_id ON public.billing_fee_agreements(firm_id);
CREATE INDEX idx_billing_fee_agreements_status ON public.billing_fee_agreements(status);
CREATE INDEX idx_billing_fee_agreements_fee_schedule_id ON public.billing_fee_agreements(fee_schedule_id);
CREATE INDEX idx_billing_fee_agreements_relationship_id ON public.billing_fee_agreements(relationship_id);
CREATE INDEX idx_billing_fee_agreements_effective_date ON public.billing_fee_agreements(effective_date);
CREATE INDEX idx_billing_fee_agreements_next_billing_date ON public.billing_fee_agreements(next_billing_date);

-- Create index for array searches (GIN index for UUID arrays)
CREATE INDEX idx_billing_fee_agreements_household_ids ON public.billing_fee_agreements USING GIN(household_ids);
CREATE INDEX idx_billing_fee_agreements_account_ids ON public.billing_fee_agreements USING GIN(account_ids);

-- Function to auto-generate agreement number
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  new_agreement_number TEXT;
BEGIN
  -- If agreement_number is not provided, generate one
  IF NEW.agreement_number IS NULL OR NEW.agreement_number = '' THEN
    -- Get the next number by finding the max existing number for this firm
    SELECT COALESCE(
      MAX(
        CAST(
          SUBSTRING(agreement_number FROM 'BFA-([0-9]+)') AS INTEGER
        )
      ), 0
    ) + 1
    INTO next_num
    FROM public.billing_fee_agreements
    WHERE firm_id = NEW.firm_id
    AND agreement_number ~ '^BFA-[0-9]+$';

    -- Format as BFA-0001, BFA-0002, etc.
    new_agreement_number := 'BFA-' || LPAD(next_num::TEXT, 4, '0');

    -- Ensure uniqueness (in case of race condition)
    WHILE EXISTS (
      SELECT 1 FROM public.billing_fee_agreements
      WHERE agreement_number = new_agreement_number
    ) LOOP
      next_num := next_num + 1;
      new_agreement_number := 'BFA-' || LPAD(next_num::TEXT, 4, '0');
    END LOOP;

    NEW.agreement_number := new_agreement_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_agreement_number_trigger
  BEFORE INSERT ON public.billing_fee_agreements
  FOR EACH ROW
  EXECUTE FUNCTION generate_agreement_number();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_billing_fee_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_fee_agreements_updated_at
  BEFORE UPDATE ON public.billing_fee_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_fee_agreements_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.billing_fee_agreements ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view billing fee agreements for their own firm
CREATE POLICY "Users can view own firm billing fee agreements"
  ON public.billing_fee_agreements
  FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert billing fee agreements for their own firm
CREATE POLICY "Users can insert own firm billing fee agreements"
  ON public.billing_fee_agreements
  FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update billing fee agreements for their own firm
CREATE POLICY "Users can update own firm billing fee agreements"
  ON public.billing_fee_agreements
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete billing fee agreements for their own firm
CREATE POLICY "Users can delete own firm billing fee agreements"
  ON public.billing_fee_agreements
  FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Super admin policy: Super admins can view all billing fee agreements
CREATE POLICY "Super admins can view all billing fee agreements"
  ON public.billing_fee_agreements
  FOR SELECT
  USING (public.is_super_admin());

-- Comment on table
COMMENT ON TABLE public.billing_fee_agreements IS 'Billing Fee Agreements determine how fees are calculated and applied. Each agreement links relationships, households, and accounts to a specific fee schedule with billing configuration.';
