const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listMissingAccounts() {
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

  console.log(`CSV has ${csvAccountNumbers.size} unique account numbers`);

  // Fetch ALL accounts from database (paginated)
  console.log('Fetching all accounts from database...');
  let allAccounts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('accounts')
      .select('account_number')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      allAccounts = allAccounts.concat(data);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Database has ${allAccounts.length} total accounts\n`);

  // Create set of database account numbers
  const dbAccountNumbers = new Set(allAccounts.map(a => a.account_number));

  // Find accounts NOT in database
  const notFoundAccounts = [];
  for (const csvNum of csvAccountNumbers) {
    if (!dbAccountNumbers.has(csvNum)) {
      notFoundAccounts.push(csvNum);
    }
  }

  // Sort numerically
  notFoundAccounts.sort((a, b) => parseInt(a) - parseInt(b));

  console.log('='.repeat(70));
  console.log('ACCOUNTS IN HOUSEHOLDS.CSV BUT NOT IN DATABASE');
  console.log('='.repeat(70));
  console.log(`Total: ${notFoundAccounts.length} accounts`);
  console.log('='.repeat(70));
  console.log('');

  notFoundAccounts.forEach((acc, index) => {
    console.log(`${(index + 1).toString().padStart(4)}. ${acc}`);
  });

  console.log('');
  console.log('='.repeat(70));

  // Also save to a text file
  const outputPath = 'S:\\Software Development\\financial_manager\\missing_accounts.txt';
  const outputContent = [
    '='.repeat(70),
    'ACCOUNTS IN HOUSEHOLDS.CSV BUT NOT IN DATABASE',
    '='.repeat(70),
    `Total: ${notFoundAccounts.length} accounts`,
    `Generated: ${new Date().toLocaleString()}`,
    '='.repeat(70),
    '',
    ...notFoundAccounts.map((acc, index) => `${(index + 1).toString().padStart(4)}. ${acc}`),
    '',
    '='.repeat(70)
  ].join('\n');

  fs.writeFileSync(outputPath, outputContent);
  console.log(`\nList also saved to: ${outputPath}`);
}

listMissingAccounts();
