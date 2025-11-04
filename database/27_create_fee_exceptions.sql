-- Migration: Create Fee Exceptions Table
-- Description: Creates table for managing fee exceptions and adjustments within billing fee agreements
-- Author: System
-- Date: 2025-10-17

-- =====================================================
-- FEE EXCEPTIONS TABLE
-- =====================================================
-- Purpose: Store exceptions and adjustments to standard fee calculations
-- Examples:
--   - Minimum/maximum fee thresholds
--   - Debit/credit adjustments
--   - Premium/discount percentages
--   - Fund exclusions (specific tickers to exclude from billable value)
--   - Dollar amount exclusions

CREATE TABLE IF NOT EXISTS public.fee_exceptions (
  -- Primary identification
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firm_id UUID NOT NULL REFERENCES public.firms(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Parent billing fee agreement
  billing_fee_agreement_id UUID NOT NULL REFERENCES public.billing_fee_agreements(id) ON DELETE CASCADE,

  -- Exception details
  exception_type TEXT NOT NULL CHECK (exception_type IN (
    'Minimum Fee',
    'Maximum Fee',
    'Debit Amount',
    'Credit Amount',
    'Premium Percentage',
    'Discount Percentage',
    'Fund Exclusion',
    'Dollar Amount Exclusion'
  )),
  status TEXT NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Expired')),

  -- Scope - which accounts does this exception apply to?
  -- Empty array means applies to all accounts in the agreement
  account_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Minimum/Maximum fee amounts
  minimum_fee_amount NUMERIC(15, 2),
  maximum_fee_amount NUMERIC(15, 2),

  -- Debit/Credit adjustments
  debit_amount NUMERIC(15, 2),
  credit_amount NUMERIC(15, 2),

  -- Premium/Discount percentages
  premium_percentage NUMERIC(5, 2), -- e.g., 10.00 means +10% fee
  discount_percentage NUMERIC(5, 2), -- e.g., 15.00 means -15% fee

  -- Fund exclusions - array of ticker symbols to exclude from billable value
  excluded_fund_tickers TEXT[],

  -- Dollar amount exclusion - specific dollar amount to hold out
  excluded_dollar_amount NUMERIC(15, 2),

  -- Effective dates
  effective_date DATE NOT NULL,
  expiration_date DATE,

  -- Notes and documentation
  description TEXT,
  notes TEXT,
  internal_notes TEXT,

  -- Audit fields
  created_by_user_id UUID REFERENCES auth.users(id),
  last_modified_by_user_id UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT valid_date_range CHECK (expiration_date IS NULL OR expiration_date >= effective_date),
  CONSTRAINT valid_minimum_fee CHECK (minimum_fee_amount IS NULL OR minimum_fee_amount >= 0),
  CONSTRAINT valid_maximum_fee CHECK (maximum_fee_amount IS NULL OR maximum_fee_amount >= 0),
  CONSTRAINT valid_debit CHECK (debit_amount IS NULL OR debit_amount >= 0),
  CONSTRAINT valid_credit CHECK (credit_amount IS NULL OR credit_amount >= 0),
  CONSTRAINT valid_premium CHECK (premium_percentage IS NULL OR premium_percentage >= 0),
  CONSTRAINT valid_discount CHECK (discount_percentage IS NULL OR discount_percentage >= 0),
  CONSTRAINT valid_excluded_amount CHECK (excluded_dollar_amount IS NULL OR excluded_dollar_amount >= 0),
  CONSTRAINT min_max_fee_range CHECK (
    minimum_fee_amount IS NULL OR
    maximum_fee_amount IS NULL OR
    maximum_fee_amount >= minimum_fee_amount
  )
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Primary lookup indexes
CREATE INDEX idx_fee_exceptions_firm_id ON public.fee_exceptions(firm_id);
CREATE INDEX idx_fee_exceptions_billing_fee_agreement_id ON public.fee_exceptions(billing_fee_agreement_id);
CREATE INDEX idx_fee_exceptions_status ON public.fee_exceptions(status);
CREATE INDEX idx_fee_exceptions_exception_type ON public.fee_exceptions(exception_type);
CREATE INDEX idx_fee_exceptions_effective_date ON public.fee_exceptions(effective_date);
CREATE INDEX idx_fee_exceptions_expiration_date ON public.fee_exceptions(expiration_date);

-- Array search index for account_ids
CREATE INDEX idx_fee_exceptions_account_ids ON public.fee_exceptions USING GIN(account_ids);

-- Composite indexes for common queries
CREATE INDEX idx_fee_exceptions_agreement_status ON public.fee_exceptions(billing_fee_agreement_id, status);
CREATE INDEX idx_fee_exceptions_firm_status ON public.fee_exceptions(firm_id, status);
CREATE INDEX idx_fee_exceptions_agreement_dates ON public.fee_exceptions(billing_fee_agreement_id, effective_date, expiration_date);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.fee_exceptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view fee exceptions for their firm
CREATE POLICY "Users can view fee exceptions for their firm"
  ON public.fee_exceptions
  FOR SELECT
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id
      FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can create fee exceptions for their firm
CREATE POLICY "Users can create fee exceptions for their firm"
  ON public.fee_exceptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    firm_id IN (
      SELECT firm_id
      FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can update fee exceptions for their firm
CREATE POLICY "Users can update fee exceptions for their firm"
  ON public.fee_exceptions
  FOR UPDATE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id
      FROM public.user_profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    firm_id IN (
      SELECT firm_id
      FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Users can delete fee exceptions for their firm
CREATE POLICY "Users can delete fee exceptions for their firm"
  ON public.fee_exceptions
  FOR DELETE
  TO authenticated
  USING (
    firm_id IN (
      SELECT firm_id
      FROM public.user_profiles
      WHERE id = auth.uid()
    )
  );

-- Policy: Super admins can view all fee exceptions
CREATE POLICY "Super admins can view all fee exceptions"
  ON public.fee_exceptions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.user_profiles
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE TRIGGER update_fee_exceptions_updated_at
  BEFORE UPDATE ON public.fee_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNCTION: Auto-expire fee exceptions
-- =====================================================
-- This function can be called periodically (e.g., via a scheduled job)
-- to automatically update the status of expired exceptions

CREATE OR REPLACE FUNCTION auto_expire_fee_exceptions()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.fee_exceptions
  SET
    status = 'Expired',
    updated_at = NOW()
  WHERE
    status = 'Active'
    AND expiration_date IS NOT NULL
    AND expiration_date < CURRENT_DATE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get active exceptions for a billing fee agreement
CREATE OR REPLACE FUNCTION get_active_fee_exceptions(
  p_billing_fee_agreement_id UUID,
  p_account_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  exception_type TEXT,
  minimum_fee_amount NUMERIC,
  maximum_fee_amount NUMERIC,
  debit_amount NUMERIC,
  credit_amount NUMERIC,
  premium_percentage NUMERIC,
  discount_percentage NUMERIC,
  excluded_fund_tickers TEXT[],
  excluded_dollar_amount NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.id,
    fe.exception_type,
    fe.minimum_fee_amount,
    fe.maximum_fee_amount,
    fe.debit_amount,
    fe.credit_amount,
    fe.premium_percentage,
    fe.discount_percentage,
    fe.excluded_fund_tickers,
    fe.excluded_dollar_amount
  FROM public.fee_exceptions fe
  WHERE
    fe.billing_fee_agreement_id = p_billing_fee_agreement_id
    AND fe.status = 'Active'
    AND fe.effective_date <= CURRENT_DATE
    AND (fe.expiration_date IS NULL OR fe.expiration_date >= CURRENT_DATE)
    AND (
      -- No specific accounts means applies to all
      CARDINALITY(fe.account_ids) = 0
      -- Or the specific account is in the list
      OR p_account_id IS NULL
      OR p_account_id = ANY(fe.account_ids)
    )
  ORDER BY fe.effective_date DESC, fe.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.fee_exceptions IS 'Stores fee exceptions and adjustments for billing fee agreements';
COMMENT ON COLUMN public.fee_exceptions.account_ids IS 'Empty array means exception applies to all accounts in the agreement';
COMMENT ON COLUMN public.fee_exceptions.excluded_fund_tickers IS 'Array of ticker symbols to exclude from billable value calculation';
COMMENT ON COLUMN public.fee_exceptions.premium_percentage IS 'Positive percentage to add to calculated fee (e.g., 10.00 = +10%)';
COMMENT ON COLUMN public.fee_exceptions.discount_percentage IS 'Positive percentage to subtract from calculated fee (e.g., 15.00 = -15%)';
COMMENT ON FUNCTION get_active_fee_exceptions IS 'Returns active fee exceptions for a billing fee agreement, optionally filtered by account';
COMMENT ON FUNCTION auto_expire_fee_exceptions IS 'Automatically marks expired fee exceptions as Expired status';
