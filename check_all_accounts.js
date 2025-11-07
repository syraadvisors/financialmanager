const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

const FIRM_ID = 'fb5368e4-ea10-48cc-becf-62580dca0895';

async function checkAllData() {
  console.log('Checking all accounts (no firm filter)...\n');

  const { data: allAccounts, error: allError } = await supabase
    .from('accounts')
    .select('id, account_number, account_name, firm_id, household_id')
    .limit(10);

  if (allError) {
    console.error('Error fetching all accounts:', allError);
  } else {
    console.log(`Sample of accounts (any firm): ${allAccounts.length}`);
    allAccounts.forEach((acc, i) => {
      console.log(`${i + 1}. Account #${acc.account_number} - Firm: ${acc.firm_id?.substring(0, 8)}...`);
    });
  }

  console.log('\n\nChecking imported_balance_data...\n');

  const { data: balanceData, error: balanceError, count } = await supabase
    .from('imported_balance_data')
    .select('account_number, as_of_business_date, firm_id', { count: 'exact' })
    .eq('firm_id', FIRM_ID)
    .limit(10);

  if (balanceError) {
    console.error('Error fetching balance data:', balanceError);
  } else {
    console.log(`Total balance records for firm: ${count}`);
    console.log(`Sample balance data:`);
    balanceData.forEach((rec, i) => {
      console.log(`${i + 1}. Account #${rec.account_number} - Date: ${rec.as_of_business_date}`);
    });
  }
}

checkAllData();
