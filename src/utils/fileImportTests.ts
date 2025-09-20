// Test file to demonstrate improved file import handling
// This shows how the system now handles files with missing columns and blank cells

import { smartDetectFileType, extractRequiredColumnsFromArray, validateFileData } from './validation';
import { FileType } from '../types/DataTypes';

export const testFlexibleImport = () => {
  console.log('=== Testing Flexible File Import ===');

  // Test 1: Balance file with missing columns (only 10 columns instead of 21)
  const incompleteBalanceData = [
    ['2024-01-01', '12345678', 'Test Account', '', '150000.00', '', '5000.00'], // Missing columns 7-21
    ['2024-01-01', '87654321', 'Another Account', '', '250000.00', '', '10000.00'],
  ];

  console.log('\nTest 1: Balance file with only 7 columns');
  console.log('Columns:', incompleteBalanceData[0].length);

  const balanceType = smartDetectFileType(incompleteBalanceData);
  console.log('Detected type:', balanceType);

  if (balanceType !== FileType.UNKNOWN) {
    const extractedBalance = extractRequiredColumnsFromArray(incompleteBalanceData, balanceType);
    console.log('Extracted data:', extractedBalance);

    const validation = validateFileData(extractedBalance, balanceType);
    console.log('Validation result:', validation.valid ? 'PASSED' : 'FAILED');
    console.log('Valid rows:', validation.validRowCount);
  }

  // Test 2: Positions file with missing columns and blank cells
  const incompletePositionsData = [
    ['2024-01-01', '12345678', 'Test Account', 'AAPL', 'EQUITY', 'Apple Inc', '', '100', 'LONG'], // Missing columns 9-12
    ['2024-01-01', '12345678', 'Test Account', 'MSFT', 'EQUITY', '', '', '50', 'LONG'], // Blank description and accounting rule
    ['2024-01-01', '87654321', 'Another Account', 'GOOGL', '', 'Alphabet Inc', '', ''], // Missing type and shares
  ];

  console.log('\nTest 2: Positions file with only 9 columns and blank cells');
  console.log('Columns:', incompletePositionsData[0].length);

  const positionsType = smartDetectFileType(incompletePositionsData);
  console.log('Detected type:', positionsType);

  if (positionsType !== FileType.UNKNOWN) {
    const extractedPositions = extractRequiredColumnsFromArray(incompletePositionsData, positionsType);
    console.log('Extracted data:', extractedPositions);

    const validation = validateFileData(extractedPositions, positionsType);
    console.log('Validation result:', validation.valid ? 'PASSED' : 'FAILED');
    console.log('Valid rows:', validation.validRowCount);
    console.log('Errors:', validation.errors);
    console.log('Warnings:', validation.warnings);
  }

  // Test 3: Very minimal file (edge case)
  const minimalData = [
    ['2024-01-01', '12345678', 'Test Account', 'AAPL', 'EQUITY'], // Only 5 columns
    ['2024-01-01', '87654321', '', 'MSFT', ''], // Blank account name and type
  ];

  console.log('\nTest 3: Minimal file with only 5 columns');
  console.log('Columns:', minimalData[0].length);

  const minimalType = smartDetectFileType(minimalData);
  console.log('Detected type:', minimalType);

  if (minimalType !== FileType.UNKNOWN) {
    const extractedMinimal = extractRequiredColumnsFromArray(minimalData, minimalType);
    console.log('Extracted data:', extractedMinimal);

    const validation = validateFileData(extractedMinimal, minimalType);
    console.log('Validation result:', validation.valid ? 'PASSED' : 'FAILED');
    console.log('Valid rows:', validation.validRowCount);
  }

  console.log('\n=== Test Complete ===');
};

// Export for use in development console
if (typeof window !== 'undefined') {
  (window as any).testFlexibleImport = testFlexibleImport;
}