const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function getAllAccounts() {
  console.log('Fetching ALL accounts from database (no limit)...\n');

  let allAccounts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_number, firm_id')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching accounts:', error);
      break;
    }

    if (data && data.length > 0) {
      allAccounts = allAccounts.concat(data);
      console.log(`Fetched page ${page + 1}: ${data.length} accounts (total so far: ${allAccounts.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`\nTotal accounts fetched: ${allAccounts.length}`);

  // Group by firm
  const firmCounts = {};
  allAccounts.forEach(acc => {
    const firmId = acc.firm_id;
    if (!firmCounts[firmId]) {
      firmCounts[firmId] = 0;
    }
    firmCounts[firmId]++;
  });

  console.log('\nAccounts by firm:');
  Object.entries(firmCounts).forEach(([firmId, count]) => {
    console.log(`  ${firmId}: ${count} accounts`);
  });

  return allAccounts;
}

getAllAccounts();
