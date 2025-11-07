const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAccounts() {
  console.log('Fetching ALL accounts from database...\n');

  // Fetch ALL accounts without firm filter
  const { data: allAccounts, error } = await supabase
    .from('accounts')
    .select('id, account_number, account_name, firm_id, household_id')
    .order('account_number');

  if (error) {
    console.error('Error fetching accounts:', error);
    return;
  }

  console.log(`Total accounts in database: ${allAccounts.length}\n`);

  // Check for some specific account numbers from the CSV
  const csvAccountNumbers = ['84581316', '39980644', '77286692', '98488362', '60723398'];

  console.log('Checking for specific accounts from CSV:');
  csvAccountNumbers.forEach(num => {
    const found = allAccounts.find(a => a.account_number === num || a.account_number === parseInt(num));
    if (found) {
      console.log(`  ✓ Found ${num} - Firm: ${found.firm_id?.substring(0, 8)}... Household: ${found.household_id || 'none'}`);
    } else {
      console.log(`  ✗ NOT FOUND: ${num}`);
    }
  });

  // Show account number types
  console.log(`\nFirst 20 account numbers in database:`);
  allAccounts.slice(0, 20).forEach((acc, i) => {
    console.log(`${i + 1}. ${acc.account_number} (type: ${typeof acc.account_number}) - Firm: ${acc.firm_id?.substring(0, 8)}...`);
  });

  // Group by firm
  const firmGroups = {};
  allAccounts.forEach(acc => {
    const firmId = acc.firm_id;
    if (!firmGroups[firmId]) {
      firmGroups[firmId] = 0;
    }
    firmGroups[firmId]++;
  });

  console.log(`\nAccounts by firm:`);
  Object.entries(firmGroups).forEach(([firmId, count]) => {
    console.log(`  ${firmId?.substring(0, 8)}...: ${count} accounts`);
  });
}

checkAccounts();
