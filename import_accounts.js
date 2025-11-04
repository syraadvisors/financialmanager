/**
 * Simple script to bulk import accounts from CSV file
 *
 * Usage:
 * Run: node import_accounts.js path/to/your/accounts.csv
 */

const fs = require('fs');

// ====== CONFIGURATION ======
const SUPABASE_URL = 'https://agacsrprmujytxostwmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYWNzcnBybXVqeXR4b3N0d215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODcwMjEsImV4cCI6MjA3NTM2MzAyMX0.wvRI4pQZ_D1MgNEzjE0MCQshlbhQifke7Xadd_pn9lM';
const FIRM_ID = 'dc838876-888c-4cce-b37d-f055f40fcb0c';
// ===========================

async function fetchAllClients() {
  console.log('Fetching all clients...');
  const response = await fetch(`${SUPABASE_URL}/rest/v1/clients?firm_id=eq.${FIRM_ID}&select=id,full_legal_name`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch clients: ${response.status}`);
  }

  const clients = await response.json();
  console.log(`✅ Fetched ${clients.length} clients`);

  // Create a map for quick lookup by name
  const clientMap = new Map();
  clients.forEach(client => {
    clientMap.set(client.full_legal_name.toLowerCase().trim(), client.id);
  });

  return clientMap;
}

async function fetchOrCreateMasterAccounts(masterAccountNumbers) {
  console.log(`\nFetching/creating ${masterAccountNumbers.size} master accounts...`);

  // Fetch existing master accounts
  const numbersArray = Array.from(masterAccountNumbers);
  const response = await fetch(`${SUPABASE_URL}/rest/v1/master_accounts?firm_id=eq.${FIRM_ID}&select=id,master_account_number`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch master accounts: ${response.status}`);
  }

  const existingMasterAccounts = await response.json();
  const masterAccountMap = new Map();

  existingMasterAccounts.forEach(ma => {
    masterAccountMap.set(ma.master_account_number, ma.id);
  });

  // Create missing master accounts
  const missingMasterAccounts = numbersArray.filter(num => !masterAccountMap.has(num));

  if (missingMasterAccounts.length > 0) {
    console.log(`Creating ${missingMasterAccounts.length} new master accounts...`);

    const newMasterAccounts = missingMasterAccounts.map(num => ({
      master_account_number: num,
      master_account_name: `Master Account ${num}`,
      firm_id: FIRM_ID
    }));

    const createResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(newMasterAccounts)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      throw new Error(`Failed to create master accounts: ${createResponse.status} ${error}`);
    }

    const createdMasterAccounts = await createResponse.json();
    createdMasterAccounts.forEach(ma => {
      masterAccountMap.set(ma.master_account_number, ma.id);
    });

    console.log(`✅ Created ${createdMasterAccounts.length} master accounts`);
  } else {
    console.log('✅ All master accounts already exist');
  }

  return masterAccountMap;
}

async function importAccounts(csvFilePath) {
  // Read the CSV file
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.trim().split('\n');

  console.log('Parsing CSV file...');

  // Parse CSV
  const accountsData = [];
  const masterAccountNumbers = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row
    if (i === 0 && line.toLowerCase().includes('account')) {
      console.log('Skipping header row');
      continue;
    }

    // Split by comma
    const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));

    if (columns.length < 4) {
      console.warn(`Skipping line ${i + 1}: Not enough columns`);
      continue;
    }

    const [accountNumber, firstName, lastName, masterAccountNumber] = columns;

    if (!accountNumber || !firstName || !lastName || !masterAccountNumber) {
      console.warn(`Skipping line ${i + 1}: Missing required data`);
      continue;
    }

    const fullName = `${firstName} ${lastName}`;

    accountsData.push({
      accountNumber,
      fullName,
      masterAccountNumber
    });

    masterAccountNumbers.add(masterAccountNumber);
  }

  console.log(`\n✅ Parsed ${accountsData.length} accounts from CSV file`);
  console.log('Sample of first 3 accounts:');
  accountsData.slice(0, 3).forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.accountNumber} - ${a.fullName}`);
  });

  // Fetch all clients
  const clientMap = await fetchAllClients();

  // Fetch or create master accounts
  const masterAccountMap = await fetchOrCreateMasterAccounts(masterAccountNumbers);

  // Build accounts array with IDs
  console.log('\nMatching accounts to clients and master accounts...');
  const accounts = [];
  const unmatchedClients = [];

  for (const accountData of accountsData) {
    const clientId = clientMap.get(accountData.fullName.toLowerCase().trim());

    if (!clientId) {
      unmatchedClients.push(accountData.fullName);
      continue;
    }

    const masterAccountId = masterAccountMap.get(accountData.masterAccountNumber);

    if (!masterAccountId) {
      console.warn(`Warning: Master account ${accountData.masterAccountNumber} not found`);
      continue;
    }

    accounts.push({
      account_number: accountData.accountNumber,
      account_name: accountData.fullName,
      account_type: 'Individual', // Default type
      client_id: clientId,
      master_account_id: masterAccountId,
      firm_id: FIRM_ID
    });
  }

  if (unmatchedClients.length > 0) {
    console.log(`\n⚠️  Warning: ${unmatchedClients.length} accounts could not be matched to clients:`);
    unmatchedClients.slice(0, 10).forEach(name => console.log(`  - ${name}`));
    if (unmatchedClients.length > 10) {
      console.log(`  ... and ${unmatchedClients.length - 10} more`);
    }
  }

  console.log(`\n✅ Successfully matched ${accounts.length} accounts`);

  // Import to Supabase
  if (accounts.length === 0) {
    console.log('\n❌ No accounts to import');
    return;
  }

  // Check for existing accounts (in batches to avoid URL length issues)
  console.log('\nChecking for existing accounts...');
  const accountNumbers = accounts.map(a => a.account_number);
  const existingAccountNumbers = new Set();

  // Check in batches of 100
  const batchSize = 100;
  for (let i = 0; i < accountNumbers.length; i += batchSize) {
    const batch = accountNumbers.slice(i, i + batchSize);
    const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/accounts?firm_id=eq.${FIRM_ID}&account_number=in.(${batch.join(',')})&select=account_number`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });

    if (!existingResponse.ok) {
      throw new Error(`Failed to check existing accounts: ${existingResponse.status}`);
    }

    const existingAccounts = await existingResponse.json();
    existingAccounts.forEach(a => existingAccountNumbers.add(a.account_number));
  }

  // Filter out existing accounts
  const newAccounts = accounts.filter(a => !existingAccountNumbers.has(a.account_number));

  if (existingAccountNumbers.size > 0) {
    console.log(`⚠️  Skipping ${existingAccountNumbers.size} accounts that already exist`);
  }

  if (newAccounts.length === 0) {
    console.log('\n✅ All accounts already exist, nothing to import');
    return;
  }

  console.log(`\nImporting ${newAccounts.length} new accounts to Supabase...`);

  const response = await fetch(`${SUPABASE_URL}/rest/v1/accounts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(newAccounts)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import accounts: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(`\n✅ Successfully imported ${result.length} accounts!`);

  return result;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node import_accounts.js path/to/accounts.csv');
  console.log('\nCSV Format:');
  console.log('  Column 1: Account Number');
  console.log('  Column 2: First Name');
  console.log('  Column 3: Last Name');
  console.log('  Column 4: Master Account Number');
  process.exit(1);
}

const csvFile = args[0];

if (!fs.existsSync(csvFile)) {
  console.error(`Error: File not found: ${csvFile}`);
  process.exit(1);
}

importAccounts(csvFile)
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  });
