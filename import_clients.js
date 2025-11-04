/**
 * Simple script to bulk import clients from Excel/CSV file
 *
 * Usage:
 * 1. Save your Excel file as CSV with columns: LastName, FirstName
 * 2. Update the SUPABASE_URL and SUPABASE_KEY below
 * 3. Run: node import_clients.js path/to/your/clients.csv
 */

const fs = require('fs');
const path = require('path');

// ====== CONFIGURATION ======
const SUPABASE_URL = 'https://agacsrprmujytxostwmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnYWNzcnBybXVqeXR4b3N0d215Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODcwMjEsImV4cCI6MjA3NTM2MzAyMX0.wvRI4pQZ_D1MgNEzjE0MCQshlbhQifke7Xadd_pn9lM';
const FIRM_ID = 'dc838876-888c-4cce-b37d-f055f40fcb0c';
const CLIENT_TYPE = 'individual';
// ===========================

async function importClients(csvFilePath) {
  // Read the CSV file
  const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
  const lines = fileContent.trim().split('\n');

  // Parse CSV (columns: LastName, FirstName)
  const clients = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip header row
    if (i === 0 && (line.toLowerCase().includes('last name') || line.toLowerCase().includes('first name'))) {
      console.log('Skipping header row');
      continue;
    }

    // Split by comma (basic CSV parsing)
    const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));

    if (columns.length < 2) {
      console.warn(`Skipping line ${i + 1}: Not enough columns`);
      continue;
    }

    const [lastName, firstName] = columns;

    if (!lastName || !firstName) {
      console.warn(`Skipping line ${i + 1}: Missing name data`);
      continue;
    }

    clients.push({
      full_legal_name: `${firstName} ${lastName}`,
      entity_type: 'Individual',
      firm_id: FIRM_ID
    });
  }

  console.log(`\nParsed ${clients.length} clients from CSV file`);
  console.log('Sample of first 3 clients:');
  clients.slice(0, 3).forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.full_legal_name}`);
  });

  // Import to Supabase
  console.log('\nImporting to Supabase...');

  const response = await fetch(`${SUPABASE_URL}/rest/v1/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(clients)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to import clients: ${response.status} ${error}`);
  }

  const result = await response.json();
  console.log(`\n✅ Successfully imported ${result.length} clients!`);

  return result;
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node import_clients.js path/to/clients.csv');
  console.log('\nCSV Format:');
  console.log('  Column 1: Last Name');
  console.log('  Column 2: First Name');
  console.log('\nExample CSV content:');
  console.log('  Smith,John');
  console.log('  Doe,Jane');
  console.log('  Johnson,Michael');
  process.exit(1);
}

const csvFile = args[0];

if (!fs.existsSync(csvFile)) {
  console.error(`Error: File not found: ${csvFile}`);
  process.exit(1);
}

// Validate configuration
if (SUPABASE_URL === 'YOUR_SUPABASE_URL_HERE' || SUPABASE_ANON_KEY === 'YOUR_SUPABASE_ANON_KEY_HERE') {
  console.error('Error: Please update SUPABASE_URL and SUPABASE_ANON_KEY in the script');
  process.exit(1);
}

if (FIRM_ID === 'YOUR_FIRM_ID_HERE') {
  console.error('Error: Please update FIRM_ID in the script');
  process.exit(1);
}

importClients(csvFile)
  .then(() => {
    console.log('\n✅ Import completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  });
