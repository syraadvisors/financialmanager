-- Migration: Fix billing_periods table
-- Description: Drop and recreate billing_periods table with correct schema

-- Drop existing table and all related objects
DROP TABLE IF EXISTS public.billing_periods CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS generate_period_number() CASCADE;
DROP FUNCTION IF EXISTS set_default_period_name() CASCADE;
DROP FUNCTION IF EXISTS update_billing_periods_updated_at() CASCADE;

-- Now create the table with correct schema
CREATE TABLE IF NOT EXISTS public.billing_periods (
  -- System Fields
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Period Identification
  period_number TEXT NOT NULL, -- Auto-generated unique identifier (e.g., BP-2025-Q1, BP-CUSTOM-0001)
  period_name TEXT NOT NULL, -- User-friendly name (e.g., "Q1 2025", "Special Mid-Month Period")

  -- Period Type
  period_type TEXT NOT NULL CHECK (period_type IN ('standard', 'custom')),

  -- For Standard (Recurring) Periods
  frequency TEXT CHECK (frequency IN ('Monthly', 'Quarterly', 'Semi-Annual', 'Annual')),
  -- frequency is required for standard periods, NULL for custom

  -- Period Dates
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,

  -- Status
  status TEXT NOT NULL CHECK (status IN ('Draft', 'Active', 'Closed', 'Cancelled')) DEFAULT 'Draft',

  -- Billing Information
  billing_date DATE, -- When bills should be generated for this period
  due_date DATE, -- When payment is due

  -- Related Fee Agreement (optional - may apply to specific agreements or all)
  fee_agreement_id UUID REFERENCES public.billing_fee_agreements(id) ON DELETE SET NULL,

  -- Period Statistics (calculated/updated as billing runs)
  accounts_billed INTEGER DEFAULT 0,
  total_fees_calculated DECIMAL(15, 2) DEFAULT 0,
  total_fees_collected DECIMAL(15, 2) DEFAULT 0,

  -- Flags
  is_locked BOOLEAN DEFAULT FALSE, -- Prevent modifications after billing run
  billing_completed BOOLEAN DEFAULT FALSE,
  billing_completed_at TIMESTAMPTZ,

  -- Metadata
  description TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- Audit
  created_by UUID REFERENCES auth.users(id),
  closed_by UUID REFERENCES auth.users(id),
  closed_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_billing_date CHECK (billing_date IS NULL OR billing_date >= start_date),
  CONSTRAINT valid_due_date CHECK (due_date IS NULL OR due_date >= start_date),
  CONSTRAINT unique_period_number_per_firm UNIQUE(firm_id, period_number),
  CONSTRAINT frequency_required_for_standard CHECK (
    (period_type = 'standard' AND frequency IS NOT NULL) OR
    (period_type = 'custom' AND frequency IS NULL)
  )
);

-- Create indexes for common queries
CREATE INDEX idx_billing_periods_firm_id ON public.billing_periods(firm_id);
CREATE INDEX idx_billing_periods_period_type ON public.billing_periods(period_type);
CREATE INDEX idx_billing_periods_status ON public.billing_periods(status);
CREATE INDEX idx_billing_periods_start_date ON public.billing_periods(start_date);
CREATE INDEX idx_billing_periods_end_date ON public.billing_periods(end_date);
CREATE INDEX idx_billing_periods_billing_date ON public.billing_periods(billing_date);
CREATE INDEX idx_billing_periods_fee_agreement_id ON public.billing_periods(fee_agreement_id);
CREATE INDEX idx_billing_periods_frequency ON public.billing_periods(frequency);

-- Composite index for date range queries
CREATE INDEX idx_billing_periods_date_range ON public.billing_periods(start_date, end_date);

-- Function to auto-generate period number
CREATE OR REPLACE FUNCTION generate_period_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num INTEGER;
  new_period_number TEXT;
  year_part TEXT;
  quarter_part TEXT;
BEGIN
  -- If period_number is not provided, generate one
  IF NEW.period_number IS NULL OR NEW.period_number = '' THEN

    IF NEW.period_type = 'standard' THEN
      -- For standard periods, use format: BP-YYYY-QX or BP-YYYY-MXX or BP-YYYY-HX or BP-YYYY
      year_part := EXTRACT(YEAR FROM NEW.start_date)::TEXT;

      CASE NEW.frequency
        WHEN 'Quarterly' THEN
          -- Determine quarter based on start month
          quarter_part := 'Q' || CEIL(EXTRACT(MONTH FROM NEW.start_date) / 3.0)::TEXT;
          new_period_number := 'BP-' || year_part || '-' || quarter_part;

        WHEN 'Monthly' THEN
          -- Format: BP-YYYY-M01, BP-YYYY-M02, etc.
          new_period_number := 'BP-' || year_part || '-M' ||
            LPAD(EXTRACT(MONTH FROM NEW.start_date)::TEXT, 2, '0');

        WHEN 'Semi-Annual' THEN
          -- H1 for first half, H2 for second half
          IF EXTRACT(MONTH FROM NEW.start_date) <= 6 THEN
            new_period_number := 'BP-' || year_part || '-H1';
          ELSE
            new_period_number := 'BP-' || year_part || '-H2';
          END IF;

        WHEN 'Annual' THEN
          -- Format: BP-YYYY
          new_period_number := 'BP-' || year_part;

        ELSE
          -- Fallback for unknown frequency
          new_period_number := 'BP-' || year_part || '-STD';
      END CASE;

    ELSE
      -- For custom periods, use sequential numbering: BP-CUSTOM-0001, BP-CUSTOM-0002, etc.
      SELECT COALESCE(
        MAX(
          CAST(
            SUBSTRING(period_number FROM 'BP-CUSTOM-([0-9]+)') AS INTEGER
          )
        ), 0
      ) + 1
      INTO next_num
      FROM public.billing_periods
      WHERE firm_id = NEW.firm_id
      AND period_number ~ '^BP-CUSTOM-[0-9]+$';

      new_period_number := 'BP-CUSTOM-' || LPAD(next_num::TEXT, 4, '0');
    END IF;

    -- Ensure uniqueness within firm (in case of race condition)
    WHILE EXISTS (
      SELECT 1 FROM public.billing_periods
      WHERE firm_id = NEW.firm_id
      AND period_number = new_period_number
    ) LOOP
      -- Add suffix -A, -B, -C, etc. for duplicates
      IF new_period_number ~ '-[A-Z]$' THEN
        -- Increment the letter
        new_period_number := REGEXP_REPLACE(
          new_period_number,
          '-([A-Z])$',
          '-' || CHR(ASCII(SUBSTRING(new_period_number FROM '-([A-Z])$')) + 1)
        );
      ELSE
        new_period_number := new_period_number || '-A';
      END IF;
    END LOOP;

    NEW.period_number := new_period_number;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_period_number_trigger
  BEFORE INSERT ON public.billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION generate_period_number();

-- Function to update period_name if not provided
CREATE OR REPLACE FUNCTION set_default_period_name()
RETURNS TRIGGER AS $$
BEGIN
  -- If period_name is not provided, generate a default based on period_number
  IF NEW.period_name IS NULL OR NEW.period_name = '' THEN
    IF NEW.period_type = 'standard' THEN
      -- Extract readable name from period_number
      NEW.period_name := REPLACE(
        REGEXP_REPLACE(NEW.period_number, '^BP-', ''),
        '-', ' '
      );
    ELSE
      -- For custom periods, use dates
      NEW.period_name := 'Custom Period: ' ||
        TO_CHAR(NEW.start_date, 'Mon DD, YYYY') || ' - ' ||
        TO_CHAR(NEW.end_date, 'Mon DD, YYYY');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_default_period_name_trigger
  BEFORE INSERT ON public.billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION set_default_period_name();

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_billing_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_periods_updated_at
  BEFORE UPDATE ON public.billing_periods
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_periods_updated_at();

-- Row Level Security (RLS) Policies
ALTER TABLE public.billing_periods ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view billing periods for their own firm
CREATE POLICY "Users can view own firm billing periods"
  ON public.billing_periods
  FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can insert billing periods for their own firm
CREATE POLICY "Users can insert own firm billing periods"
  ON public.billing_periods
  FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
  );

-- Policy: Users can update billing periods for their own firm (unless locked)
CREATE POLICY "Users can update own firm billing periods"
  ON public.billing_periods
  FOR UPDATE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
    AND is_locked = FALSE
  );

-- Policy: Users can delete billing periods for their own firm (unless locked or closed)
CREATE POLICY "Users can delete own firm billing periods"
  ON public.billing_periods
  FOR DELETE
  USING (
    firm_id IN (
      SELECT firm_id FROM public.user_profiles WHERE id = auth.uid()
    )
    AND is_locked = FALSE
    AND status NOT IN ('Closed', 'Cancelled')
  );

-- Super admin policy: Super admins can view all billing periods
CREATE POLICY "Super admins can view all billing periods"
  ON public.billing_periods
  FOR SELECT
  USING (public.is_super_admin());

-- Comment on table
COMMENT ON TABLE public.billing_periods IS 'Billing periods define time ranges for fee calculations and billing cycles. Supports both standard (recurring) periods based on frequency and custom (one-time) periods for special billing needs.';

-- Column comments
COMMENT ON COLUMN public.billing_periods.period_type IS 'Either "standard" (recurring) or "custom" (one-time)';
COMMENT ON COLUMN public.billing_periods.frequency IS 'Required for standard periods: Monthly, Quarterly, Semi-Annual, or Annual';
COMMENT ON COLUMN public.billing_periods.period_number IS 'Auto-generated unique identifier (e.g., BP-2025-Q1, BP-CUSTOM-0001)';
COMMENT ON COLUMN public.billing_periods.is_locked IS 'Prevents modifications after billing run has been executed';
COMMENT ON COLUMN public.billing_periods.billing_date IS 'Date when bills should be generated';
COMMENT ON COLUMN public.billing_periods.due_date IS 'Date when payment is due';
