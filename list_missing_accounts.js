const fs = require('fs');

// Read CSV file
const csvPath = 'c:\\Users\\syrac\\Documents\\FeeMGR Testing\\Households.csv';
const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').slice(1); // Skip header

// Extract all unique account numbers
const accountNumbers = new Set();

for (const line of lines) {
  if (!line.trim()) continue;

  // Parse CSV line (handle quoted fields)
  const match = line.match(/^"?([^"]*)"?,(\d+)/);
  if (!match) continue;

  const accountNumber = match[2].trim();
  if (accountNumber) {
    accountNumbers.add(accountNumber);
  }
}

// Sort and display
const sortedAccounts = Array.from(accountNumbers).sort((a, b) => a.localeCompare(b));

console.log('='.repeat(60));
console.log('ACCOUNTS IN CSV FILE BUT NOT IN DATABASE');
console.log('='.repeat(60));
console.log(`Total unique account numbers: ${sortedAccounts.length}`);
console.log('');
console.log('Account Numbers:');
console.log('-'.repeat(60));

sortedAccounts.forEach((acc, index) => {
  console.log(`${(index + 1).toString().padStart(4)}. ${acc}`);
});

console.log('');
console.log('='.repeat(60));
console.log('SUMMARY');
console.log('='.repeat(60));
console.log(`Total unique accounts: ${sortedAccounts.length}`);
console.log(`Total household entries in CSV: ${lines.filter(l => l.trim()).length}`);
console.log('');
console.log('These accounts need to be imported into the database before');
console.log('households can be created and accounts assigned to them.');
