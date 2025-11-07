const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

// USE THE CORRECT FIRM ID (the one that has accounts)
const FIRM_ID = 'dc838876-888c-4cce-b37d-f055f40fcb0c';

async function importHouseholds() {
  console.log('Starting household import...');
  console.log(`Using firm ID: ${FIRM_ID}\n`);

  // Read CSV file
  const csvPath = 'c:\\Users\\syrac\\Documents\\FeeMGR Testing\\Households.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header

  // Parse CSV and group accounts by household
  const householdMap = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;

    // Parse CSV line (handle quoted fields)
    const match = line.match(/^"?([^"]*)"?,(\d+)/);
    if (!match) continue;

    const householdName = match[1].trim();
    const accountNumber = match[2].trim();

    if (!householdName || !accountNumber) continue;

    if (!householdMap.has(householdName)) {
      householdMap.set(householdName, []);
    }
    householdMap.get(householdName).push(accountNumber);
  }

  console.log(`Found ${householdMap.size} unique households`);
  console.log(`Total account entries: ${lines.filter(l => l.trim()).length}`);

  // Fetch all existing accounts from database (paginated to get ALL accounts)
  console.log('\nFetching existing accounts from database...');
  let existingAccounts = [];
  let page = 0;
  const pageSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, account_number, firm_id')
      .eq('firm_id', FIRM_ID)
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error fetching accounts:', error);
      return;
    }

    if (data && data.length > 0) {
      existingAccounts = existingAccounts.concat(data);
      console.log(`  Page ${page + 1}: ${data.length} accounts (total: ${existingAccounts.length})`);
      page++;
      hasMore = data.length === pageSize;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${existingAccounts.length} total accounts in database for this firm`);

  // Create a map of account numbers to account IDs
  const accountNumberToId = new Map();
  existingAccounts.forEach(acc => {
    accountNumberToId.set(acc.account_number.toString(), acc.id);
  });

  // Track statistics
  const stats = {
    householdsCreated: 0,
    householdsSkipped: 0,
    accountsAssigned: 0,
    accountsNotFound: [],
    errors: []
  };

  // Get all account numbers from CSV
  const allCsvAccountNumbers = new Set();
  for (const [householdName, accountNumbers] of householdMap) {
    accountNumbers.forEach(num => allCsvAccountNumbers.add(num));
  }

  // Find accounts in CSV but not in database
  const accountsNotInDb = [];
  for (const accountNumber of allCsvAccountNumbers) {
    if (!accountNumberToId.has(accountNumber)) {
      accountsNotInDb.push(accountNumber);
    }
  }

  console.log(`\nAccounts in CSV but not in database: ${accountsNotInDb.length}`);
  if (accountsNotInDb.length > 0 && accountsNotInDb.length <= 50) {
    console.log('Missing accounts:', accountsNotInDb.join(', '));
  }

  // Create households and assign accounts
  console.log('\nCreating households...');
  let processed = 0;

  for (const [householdName, accountNumbers] of householdMap) {
    processed++;

    if (processed % 50 === 0) {
      console.log(`Progress: ${processed}/${householdMap.size} households`);
    }

    try {
      // Get account IDs that exist in database
      const accountIds = [];
      const missingAccounts = [];

      for (const accountNumber of accountNumbers) {
        const accountId = accountNumberToId.get(accountNumber);
        if (accountId) {
          accountIds.push(accountId);
        } else {
          missingAccounts.push(accountNumber);
        }
      }

      if (missingAccounts.length > 0) {
        stats.accountsNotFound.push(...missingAccounts);
      }

      // Skip households with no valid accounts
      if (accountIds.length === 0) {
        stats.householdsSkipped++;
        continue;
      }

      // Create household
      const { data: household, error: householdError } = await supabase
        .from('households')
        .insert({
          firm_id: FIRM_ID,
          household_name: householdName,
          household_status: 'Active',
          billing_aggregation_level: 'Household'
        })
        .select()
        .single();

      if (householdError) {
        console.error(`  Error creating household "${householdName}":`, householdError.message);
        stats.errors.push({ household: householdName, error: householdError.message });
        continue;
      }

      stats.householdsCreated++;

      // Assign accounts to household
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ household_id: household.id })
        .in('id', accountIds);

      if (updateError) {
        console.error(`  Error assigning accounts to "${householdName}":`, updateError.message);
        stats.errors.push({ household: householdName, error: updateError.message });
      } else {
        stats.accountsAssigned += accountIds.length;
      }

    } catch (error) {
      console.error(`  Unexpected error for "${householdName}":`, error.message);
      stats.errors.push({ household: householdName, error: error.message });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(60));
  console.log(`Households created: ${stats.householdsCreated}`);
  console.log(`Households skipped (no valid accounts): ${stats.householdsSkipped}`);
  console.log(`Accounts assigned to households: ${stats.accountsAssigned}`);
  console.log(`Unique accounts not found in database: ${new Set(stats.accountsNotFound).size}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (accountsNotInDb.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ACCOUNTS IN CSV BUT NOT IN DATABASE');
    console.log('='.repeat(60));
    console.log(`Total: ${accountsNotInDb.length} accounts`);
    if (accountsNotInDb.length <= 100) {
      accountsNotInDb.sort((a, b) => a.localeCompare(b));
      accountsNotInDb.forEach(acc => console.log(`  ${acc}`));
    } else {
      console.log('(Too many to display - more than 100)');
      console.log('First 20:', accountsNotInDb.slice(0, 20).join(', '));
    }
  }

  if (stats.errors.length > 0 && stats.errors.length <= 20) {
    console.log('\n' + '='.repeat(60));
    console.log('ERRORS');
    console.log('='.repeat(60));
    stats.errors.forEach(err => {
      console.log(`  ${err.household}: ${err.error}`);
    });
  }

  console.log('\nImport complete!');
}

// Run the import
importHouseholds().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
