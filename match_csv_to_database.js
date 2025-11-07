const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function matchAccounts() {
  console.log('Reading CSV file...');

  // Read CSV and extract account numbers
  const csvPath = 'c:\\Users\\syrac\\Documents\\FeeMGR Testing\\Households.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  const csvAccountNumbers = new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    const match = line.match(/^"?([^"]*)"?,(\d+)/);
    if (!match) continue;
    const accountNumber = match[2].trim();
    if (accountNumber) {
      csvAccountNumbers.add(accountNumber);
    }
  }

  console.log(`CSV has ${csvAccountNumbers.size} unique account numbers\n`);

  // Fetch ALL accounts from database (paginated)
  console.log('Fetching all accounts from database...');
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
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allAccounts = allAccounts.concat(data);
      console.log(`  Page ${page + 1}: ${data.length} accounts (total: ${allAccounts.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Database has ${allAccounts.length} total accounts\n`);

  // Create set of database account numbers
  const dbAccountNumbers = new Set(allAccounts.map(a => a.account_number));

  // Find matches
  const matchedAccounts = [];
  const notFoundAccounts = [];

  for (const csvNum of csvAccountNumbers) {
    if (dbAccountNumbers.has(csvNum)) {
      matchedAccounts.push(csvNum);
    } else {
      notFoundAccounts.push(csvNum);
    }
  }

  console.log('='.repeat(60));
  console.log('MATCH RESULTS');
  console.log('='.repeat(60));
  console.log(`Accounts found in database: ${matchedAccounts.length}`);
  console.log(`Accounts NOT in database: ${notFoundAccounts.length}`);
  console.log(`Match rate: ${((matchedAccounts.length / csvAccountNumbers.size) * 100).toFixed(1)}%`);

  if (notFoundAccounts.length > 0 && notFoundAccounts.length <= 100) {
    console.log('\n' + '='.repeat(60));
    console.log('ACCOUNTS NOT FOUND IN DATABASE');
    console.log('='.repeat(60));
    notFoundAccounts.sort().forEach(acc => console.log(`  ${acc}`));
  } else if (notFoundAccounts.length > 100) {
    console.log('\n' + '='.repeat(60));
    console.log('SAMPLE OF ACCOUNTS NOT FOUND (first 50)');
    console.log('='.repeat(60));
    notFoundAccounts.sort().slice(0, 50).forEach(acc => console.log(`  ${acc}`));
  }

  // Now let's get the firm_id for matched accounts
  const firmCounts = {};
  for (const csvNum of matchedAccounts) {
    const dbAccount = allAccounts.find(a => a.account_number === csvNum);
    if (dbAccount) {
      const firmId = dbAccount.firm_id;
      if (!firmCounts[firmId]) {
        firmCounts[firmId] = 0;
      }
      firmCounts[firmId]++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('MATCHED ACCOUNTS BY FIRM');
  console.log('='.repeat(60));
  Object.entries(firmCounts).forEach(([firmId, count]) => {
    console.log(`  Firm ${firmId}: ${count} accounts`);
  });
}

matchAccounts();
