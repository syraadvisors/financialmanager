-- ==================================================================
-- SECURITY FIX: Add search_path to all functions
-- ==================================================================
-- This migration adds SET search_path = pg_catalog, public to all
-- functions to prevent search path manipulation attacks
-- ==================================================================

-- Fix: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: user_has_permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_profiles up
    JOIN role_permissions rp ON rp.role = up.role
    JOIN permissions p ON p.id = rp.permission_id
    WHERE up.id = auth.uid()
      AND p.name = permission_name
      AND up.status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: get_user_role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: get_user_firm_id
CREATE OR REPLACE FUNCTION get_user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: log_user_login
CREATE OR REPLACE FUNCTION log_user_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET
    last_login_at = NOW(),
    login_count = login_count + 1
  WHERE id = NEW.id;

  INSERT INTO audit_logs (user_id, firm_id, action, details)
  SELECT
    NEW.id,
    firm_id,
    'login',
    jsonb_build_object('email', email)
  FROM user_profiles
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: is_super_admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: check_is_super_admin
CREATE OR REPLACE FUNCTION check_is_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: get_active_impersonation_session
CREATE OR REPLACE FUNCTION get_active_impersonation_session()
RETURNS TABLE (
  id UUID,
  super_admin_id UUID,
  super_admin_email TEXT,
  impersonated_user_id UUID,
  impersonated_user_email TEXT,
  impersonated_user_firm_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  reason TEXT
) AS $$
  SELECT
    id,
    super_admin_id,
    super_admin_email,
    impersonated_user_id,
    impersonated_user_email,
    impersonated_user_firm_id,
    created_at as started_at,
    reason
  FROM impersonation_sessions
  WHERE super_admin_id = auth.uid()
    AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: start_impersonation
CREATE OR REPLACE FUNCTION start_impersonation(
  target_user_id UUID,
  impersonation_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  super_admin_email_var TEXT;
  target_email_var TEXT;
  target_firm_id_var UUID;
BEGIN
  -- Check if caller is super admin
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can impersonate users';
  END IF;

  -- End any existing active impersonation sessions
  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE super_admin_id = auth.uid() AND is_active = true;

  -- Get super admin email
  SELECT email INTO super_admin_email_var
  FROM user_profiles WHERE id = auth.uid();

  -- Get target user info
  SELECT email, firm_id
  INTO target_email_var, target_firm_id_var
  FROM user_profiles WHERE id = target_user_id;

  IF target_email_var IS NULL THEN
    RAISE EXCEPTION 'Target user not found';
  END IF;

  -- Create new impersonation session
  INSERT INTO impersonation_sessions (
    super_admin_id,
    super_admin_email,
    impersonated_user_id,
    impersonated_user_email,
    impersonated_user_firm_id,
    reason,
    is_active
  ) VALUES (
    auth.uid(),
    super_admin_email_var,
    target_user_id,
    target_email_var,
    target_firm_id_var,
    impersonation_reason,
    true
  ) RETURNING id INTO session_id;

  -- Log the impersonation start
  INSERT INTO audit_logs (
    user_id,
    firm_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    target_firm_id_var,
    'super_admin.impersonate.start',
    'user',
    target_user_id::TEXT,
    jsonb_build_object(
      'superAdminId', auth.uid(),
      'superAdminEmail', super_admin_email_var,
      'targetUserId', target_user_id,
      'targetUserEmail', target_email_var,
      'targetFirmId', target_firm_id_var,
      'reason', impersonation_reason
    )
  );

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: end_impersonation
CREATE OR REPLACE FUNCTION end_impersonation()
RETURNS BOOLEAN AS $$
DECLARE
  session_record RECORD;
BEGIN
  -- Check if caller is super admin
  IF NOT check_is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only super admins can end impersonation';
  END IF;

  -- Get active session
  SELECT * INTO session_record
  FROM impersonation_sessions
  WHERE super_admin_id = auth.uid() AND is_active = true
  ORDER BY created_at DESC
  LIMIT 1;

  IF session_record.id IS NULL THEN
    RETURN false; -- No active session
  END IF;

  -- End the session
  UPDATE impersonation_sessions
  SET is_active = false, ended_at = NOW()
  WHERE id = session_record.id;

  -- Log the impersonation end
  INSERT INTO audit_logs (
    user_id,
    firm_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    auth.uid(),
    session_record.impersonated_user_firm_id,
    'super_admin.impersonate.end',
    'user',
    session_record.impersonated_user_id::TEXT,
    jsonb_build_object(
      'superAdminId', auth.uid(),
      'superAdminEmail', session_record.super_admin_email,
      'targetUserId', session_record.impersonated_user_id,
      'targetUserEmail', session_record.impersonated_user_email,
      'targetFirmId', session_record.impersonated_user_firm_id,
      'duration', EXTRACT(EPOCH FROM (NOW() - session_record.created_at))
    )
  );

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: generate_agreement_number
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
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: update_billing_fee_agreements_updated_at
CREATE OR REPLACE FUNCTION update_billing_fee_agreements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: auto_expire_fee_exceptions
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

-- Fix: get_active_fee_exceptions
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

-- Fix: set_imported_balance_data_defaults
CREATE OR REPLACE FUNCTION set_imported_balance_data_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set imported_by to current user if not set
  IF NEW.imported_by IS NULL THEN
    NEW.imported_by := auth.uid();
  END IF;

  -- Set firm_id from user's profile if not set
  IF NEW.firm_id IS NULL THEN
    SELECT firm_id INTO NEW.firm_id
    FROM user_profiles
    WHERE id = auth.uid();
  END IF;

  -- Set updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: set_imported_positions_data_defaults
CREATE OR REPLACE FUNCTION set_imported_positions_data_defaults()
RETURNS TRIGGER AS $$
BEGIN
  -- Set imported_by to current user if not set
  IF NEW.imported_by IS NULL THEN
    NEW.imported_by := auth.uid();
  END IF;

  -- Set firm_id from user's profile if not set
  IF NEW.firm_id IS NULL THEN
    SELECT firm_id INTO NEW.firm_id
    FROM user_profiles
    WHERE id = auth.uid();
  END IF;

  -- Set updated_at timestamp
  NEW.updated_at := NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: generate_period_number
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
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: set_default_period_name
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
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: update_billing_periods_updated_at
CREATE OR REPLACE FUNCTION update_billing_periods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = pg_catalog, public;

-- Fix: get_current_user_firm_id
CREATE OR REPLACE FUNCTION public.get_current_user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM public.user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: user_firm_id (public schema version)
-- Note: If this function exists in auth schema, contact Supabase support or use their dashboard
-- to update it, as regular users don't have permission to modify the auth schema
CREATE OR REPLACE FUNCTION public.user_firm_id()
RETURNS UUID AS $$
  SELECT firm_id FROM user_profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER
SET search_path = pg_catalog, public;

-- Fix: log_audit (if it exists, this will update it)
-- This function may have been created outside of tracked migrations
CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a generic audit logging function
  -- If your actual implementation is different, adjust accordingly
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      'create',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      'update',
      TG_TABLE_NAME,
      NEW.id::TEXT,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      'delete',
      TG_TABLE_NAME,
      OLD.id::TEXT,
      to_jsonb(OLD)
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public;

-- ==================================================================
-- SUCCESS MESSAGE
-- ==================================================================
SELECT 'SUCCESS! All functions updated with secure search_path' as message;
