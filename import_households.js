const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://vyyxgktycchfebgbevjh.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5eXhna3R5Y2NoZmViZ2JldmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NjQ0NDgsImV4cCI6MjA1MzM0MDQ0OH0.HBEz6wH7pEDQqx0NRXe4a8MqwqYL9I47cTZp8w5EhyE';
const supabase = createClient(supabaseUrl, supabaseKey);

// Firm ID - you'll need to set this
const FIRM_ID = 'fb5368e4-ea10-48cc-becf-62580dca0895';

async function importHouseholds() {
  console.log('Starting household import...');

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

  // Fetch all existing accounts from database
  console.log('\nFetching existing accounts from database...');
  const { data: existingAccounts, error: accountsError } = await supabase
    .from('accounts')
    .select('id, account_number, firm_id')
    .eq('firm_id', FIRM_ID);

  if (accountsError) {
    console.error('Error fetching accounts:', accountsError);
    return;
  }

  console.log(`Found ${existingAccounts.length} accounts in database`);

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
  if (accountsNotInDb.length > 0) {
    console.log('Missing accounts:', accountsNotInDb.slice(0, 20).join(', '),
                accountsNotInDb.length > 20 ? `... and ${accountsNotInDb.length - 20} more` : '');
  }

  // Create households and assign accounts
  console.log('\nCreating households...');
  let processed = 0;

  for (const [householdName, accountNumbers] of householdMap) {
    processed++;

    if (processed % 10 === 0) {
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
        console.log(`  Skipping "${householdName}" - no valid accounts found`);
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
  console.log(`Households skipped: ${stats.householdsSkipped}`);
  console.log(`Accounts assigned: ${stats.accountsAssigned}`);
  console.log(`Accounts not found in database: ${stats.accountsNotFound.length}`);
  console.log(`Errors: ${stats.errors.length}`);

  if (accountsNotInDb.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('ACCOUNTS IN CSV BUT NOT IN DATABASE');
    console.log('='.repeat(60));
    accountsNotInDb.sort((a, b) => a.localeCompare(b));
    accountsNotInDb.forEach(acc => console.log(`  ${acc}`));
  }

  if (stats.errors.length > 0) {
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
