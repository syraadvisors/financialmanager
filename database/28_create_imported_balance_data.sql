-- ==================================================================
-- CREATE IMPORTED BALANCE DATA TABLE
-- ==================================================================
-- This table stores raw balance data imported from CSV files
-- Includes multi-tenant support via firm_id
-- ==================================================================

-- Create imported_balance_data table
CREATE TABLE imported_balance_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Multi-tenant support
  firm_id UUID REFERENCES firms(id) ON DELETE CASCADE,
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Import metadata
  import_batch_id UUID NOT NULL, -- Groups records from same import
  import_filename TEXT,
  import_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Balance data fields (matching AccountBalance interface)
  as_of_business_date DATE NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT,
  net_market_value DECIMAL(15,2),
  portfolio_value DECIMAL(15,2),
  market_value_short DECIMAL(15,2),
  total_cash DECIMAL(15,2),
  cash_account_balance_net_credit_or_debit DECIMAL(15,2),
  cash_account_balance_net_market_value DECIMAL(15,2),
  cash_account_balance_money_market_funds DECIMAL(15,2),
  equity_percentage DECIMAL(5,2),
  option_requirements DECIMAL(15,2),
  month_end_div_payout DECIMAL(15,2),
  margin_account_balance_credit_or_debit DECIMAL(15,2),
  margin_account_balance_market_value_long DECIMAL(15,2),
  margin_account_balance_market_value_short DECIMAL(15,2),
  margin_account_balance_equity_including_options DECIMAL(15,2),
  margin_account_balance_margin_cash_available DECIMAL(15,2),
  margin_account_balance_equity_excluding_options DECIMAL(15,2),
  margin_buying_power DECIMAL(15,2)
);

-- Create indexes for performance
CREATE INDEX idx_imported_balance_data_firm_id ON imported_balance_data(firm_id);
CREATE INDEX idx_imported_balance_data_import_batch_id ON imported_balance_data(import_batch_id);
CREATE INDEX idx_imported_balance_data_account_number ON imported_balance_data(account_number);
CREATE INDEX idx_imported_balance_data_as_of_date ON imported_balance_data(as_of_business_date);
CREATE INDEX idx_imported_balance_data_firm_date ON imported_balance_data(firm_id, as_of_business_date);
CREATE INDEX idx_imported_balance_data_firm_account ON imported_balance_data(firm_id, account_number);

-- Add comments
COMMENT ON TABLE imported_balance_data IS 'Raw balance data imported from CSV files with multi-tenant support';
COMMENT ON COLUMN imported_balance_data.import_batch_id IS 'UUID grouping all records from the same CSV import';
COMMENT ON COLUMN imported_balance_data.firm_id IS 'Links to firm for multi-tenant data isolation';
COMMENT ON COLUMN imported_balance_data.imported_by IS 'User who performed the import';

-- Enable Row Level Security
ALTER TABLE imported_balance_data ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see data for their firm
CREATE POLICY "Users can view their firm's imported balance data"
  ON imported_balance_data
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.firm_id = imported_balance_data.firm_id
        OR user_profiles.role = 'super_admin'
      )
    )
  );

-- RLS Policy: Users can insert data for their firm
CREATE POLICY "Users can insert imported balance data for their firm"
  ON imported_balance_data
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.firm_id = imported_balance_data.firm_id
    )
  );

-- RLS Policy: Users can update data for their firm
CREATE POLICY "Users can update their firm's imported balance data"
  ON imported_balance_data
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.firm_id = imported_balance_data.firm_id
        OR user_profiles.role = 'super_admin'
      )
    )
  );

-- RLS Policy: Users can delete data for their firm
CREATE POLICY "Users can delete their firm's imported balance data"
  ON imported_balance_data
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND (
        user_profiles.firm_id = imported_balance_data.firm_id
        OR user_profiles.role = 'super_admin'
      )
    )
  );

-- Create function to automatically set firm_id and imported_by
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function
CREATE TRIGGER set_imported_balance_data_defaults_trigger
  BEFORE INSERT OR UPDATE ON imported_balance_data
  FOR EACH ROW
  EXECUTE FUNCTION set_imported_balance_data_defaults();

-- Success message
SELECT 'SUCCESS! imported_balance_data table created with RLS policies and triggers' as message;
