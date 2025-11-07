const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

const FIRM_ID = 'fb5368e4-ea10-48cc-becf-62580dca0895';

async function checkAccounts() {
  console.log('Checking accounts table...\n');

  const { data: accounts, error } = await supabase
    .from('accounts')
    .select('id, account_number, account_name, firm_id, household_id')
    .eq('firm_id', FIRM_ID);

  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }

  console.log(`Total accounts in database: ${accounts.length}`);
  console.log(`\nFirst 10 accounts:`);
  accounts.slice(0, 10).forEach((acc, i) => {
    console.log(`${i + 1}. Account #${acc.account_number} - ${acc.account_name || 'N/A'} (household_id: ${acc.household_id || 'none'})`);
  });

  // Check how many have household assignments
  const withHousehold = accounts.filter(a => a.household_id).length;
  console.log(`\nAccounts with household assignment: ${withHousehold}`);
  console.log(`Accounts without household: ${accounts.length - withHousehold}`);
}

checkAccounts();
