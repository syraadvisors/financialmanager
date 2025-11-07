const fs = require('fs');
const path = require('path');

/**
 * Generate SQL UPDATE statements to update account names from CSV export
 *
 * Usage: node update_account_names_from_csv.js <path-to-csv>
 * Example: node update_account_names_from_csv.js "c:\Users\syrac\Downloads\financial_data_2025-11-05.csv"
 */

const csvPath = process.argv[2];

if (!csvPath) {
  console.error('Error: Please provide path to CSV file');
  console.error('Usage: node update_account_names_from_csv.js <path-to-csv>');
  process.exit(1);
}

if (!fs.existsSync(csvPath)) {
  console.error(`Error: File not found: ${csvPath}`);
  process.exit(1);
}

console.log(`Reading CSV file: ${csvPath}`);

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n');

// Skip comment lines and header
let dataStartIndex = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].startsWith('#') || lines[i].trim() === '') {
    dataStartIndex = i + 1;
  } else if (lines[i].includes('accountNumber')) {
    // This is the header line
    dataStartIndex = i + 1;
    break;
  }
}

console.log(`Data starts at line ${dataStartIndex + 1}`);

// Parse CSV data
const updates = [];
const accountMap = new Map(); // To deduplicate by account number

for (let i = dataStartIndex; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;

  // Parse CSV line (handle quoted values)
  const columns = [];
  let currentColumn = '';
  let inQuotes = false;

  for (let j = 0; j < line.length; j++) {
    const char = line[j];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(currentColumn);
      currentColumn = '';
    } else {
      currentColumn += char;
    }
  }
  columns.push(currentColumn); // Add last column

  // Column indices (0-based)
  // 9 = accountNumber
  // 10 = accountName
  const accountNumber = columns[9]?.trim();
  const accountName = columns[10]?.trim();

  if (accountNumber && accountName) {
    // Store in map to deduplicate (keep most recent)
    accountMap.set(accountNumber, accountName);
  }
}

console.log(`Found ${accountMap.size} unique accounts with names`);

// Generate SQL statements
const sqlStatements = [];

sqlStatements.push('-- ================================================================');
sqlStatements.push('-- UPDATE ACCOUNT NAMES FROM CSV EXPORT');
sqlStatements.push('-- ================================================================');
sqlStatements.push(`-- Generated: ${new Date().toISOString()}`);
sqlStatements.push(`-- Source: ${path.basename(csvPath)}`);
sqlStatements.push(`-- Total Updates: ${accountMap.size}`);
sqlStatements.push('-- ================================================================\n');

sqlStatements.push('BEGIN;\n');

let updateCount = 0;
for (const [accountNumber, accountName] of accountMap.entries()) {
  // Escape single quotes in SQL
  const escapedName = accountName.replace(/'/g, "''");

  sqlStatements.push(`-- Update account ${accountNumber}`);
  sqlStatements.push(`UPDATE accounts`);
  sqlStatements.push(`SET account_name = '${escapedName}',`);
  sqlStatements.push(`    registration_name = '${escapedName}',`);
  sqlStatements.push(`    updated_at = NOW()`);
  sqlStatements.push(`WHERE account_number = '${accountNumber}';`);
  sqlStatements.push('');

  updateCount++;
}

sqlStatements.push('\nCOMMIT;\n');

sqlStatements.push('-- ================================================================');
sqlStatements.push('-- VERIFICATION QUERY');
sqlStatements.push('-- ================================================================');
sqlStatements.push('-- Run this to verify the updates');
sqlStatements.push('SELECT');
sqlStatements.push('  account_number,');
sqlStatements.push('  account_name,');
sqlStatements.push('  registration_name,');
sqlStatements.push('  updated_at');
sqlStatements.push('FROM accounts');
sqlStatements.push('WHERE account_number IN (');

const accountNumbers = Array.from(accountMap.keys());
for (let i = 0; i < Math.min(10, accountNumbers.length); i++) {
  const suffix = i < Math.min(10, accountNumbers.length) - 1 ? ',' : '';
  sqlStatements.push(`  '${accountNumbers[i]}'${suffix}`);
}

sqlStatements.push(')');
sqlStatements.push('ORDER BY account_number;');

// Write to output file
const outputPath = path.join(__dirname, 'generated_update_account_names.sql');
fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');

console.log(`\nGenerated SQL file: ${outputPath}`);
console.log(`Total UPDATE statements: ${updateCount}`);
console.log(`\nTo apply these updates:`);
console.log(`1. Review the generated SQL file`);
console.log(`2. Run it in your Supabase SQL editor or via psql`);
console.log(`3. Run the verification query at the end to confirm updates`);
