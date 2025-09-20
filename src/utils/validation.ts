import {
  ValidationRules,
  FileType,
  FileColumnCounts,
  BalanceFileColumnPositions,
  PositionsFileColumnPositions
} from '../types/DataTypes';
import { APP_CONFIG } from '../config/constants';

export const validateAccountNumber = (accountNumber: string): { valid: boolean; error?: string } => {
  // Remove any spaces or formatting
  const cleaned = accountNumber.toString().replace(/\s/g, '');
  
  // Check if it's numeric
  if (!/^\d+$/.test(cleaned)) {
    return { valid: false, error: 'Account number must contain only digits' };
  }
  
  // Check length
  if (cleaned.length < ValidationRules.accountNumber.minLength || 
      cleaned.length > ValidationRules.accountNumber.maxLength) {
    return { valid: false, error: `Account number must be ${ValidationRules.accountNumber.minLength}-${ValidationRules.accountNumber.maxLength} digits` };
  }
  
  // Check it doesn't start with 0
  if (cleaned.startsWith('0')) {
    return { valid: false, error: 'Account number cannot start with 0' };
  }
  
  return { valid: true };
};

// Smart file type detection that analyzes both column count and content
export const detectFileTypeByColumnCount = (columnCount: number): FileType => {
  // More flexible detection - allow files with fewer columns than expected
  // Balance files typically have 21 columns, but we only need specific ones
  if (columnCount >= 7 && columnCount <= FileColumnCounts.BALANCE_FILE_COLUMNS) {
    return FileType.ACCOUNT_BALANCE;
  }
  // Positions files typically have 12 columns, but we only need specific ones
  else if (columnCount >= 5 && columnCount <= FileColumnCounts.POSITIONS_FILE_COLUMNS) {
    return FileType.POSITIONS;
  }

  // If ambiguous, try to detect based on common patterns
  // Positions files usually have fewer columns than balance files
  if (columnCount <= 12) {
    return FileType.POSITIONS;
  } else if (columnCount > 12) {
    return FileType.ACCOUNT_BALANCE;
  }

  return FileType.UNKNOWN;
};

// Enhanced detection that looks at actual data content
export const smartDetectFileType = (data: any[]): FileType => {
  if (!data || data.length === 0) {
    return FileType.UNKNOWN;
  }

  const firstRow = data[0];
  const columnCount = firstRow.length;

  // Try column count first
  let detectedType = detectFileTypeByColumnCount(columnCount);

  // If still unknown or ambiguous, analyze content
  if (detectedType === FileType.UNKNOWN ||
      (columnCount >= 5 && columnCount <= 15)) { // Ambiguous range

    // Sample a few rows to analyze content patterns
    const sampleSize = Math.min(10, data.length);
    let positionsIndicators = 0;
    let balanceIndicators = 0;

    for (let i = 0; i < sampleSize; i++) {
      const row = data[i];

      // Look for positions-specific patterns
      // Positions files often have symbols in column 3 or 4
      const possibleSymbol = (row[3] || row[4] || '').toString().trim();
      if (possibleSymbol.length >= 1 && possibleSymbol.length <= 6 &&
          /^[A-Z0-9]+$/.test(possibleSymbol)) {
        positionsIndicators++;
      }

      // Look for balance-specific patterns
      // Balance files often have larger numeric values in later columns
      const laterColumns = row.slice(4).filter((col: any) => {
        const num = parseFloat(col?.toString().replace(/[,$]/g, '') || '0');
        return !isNaN(num) && Math.abs(num) > 1000; // Typical portfolio values
      });
      if (laterColumns.length > 0) {
        balanceIndicators++;
      }
    }

    // Make decision based on content analysis
    if (positionsIndicators > balanceIndicators) {
      return FileType.POSITIONS;
    } else if (balanceIndicators > positionsIndicators) {
      return FileType.ACCOUNT_BALANCE;
    }
  }

  return detectedType;
};

export const extractRequiredColumnsFromArray = (data: any[], fileType: FileType): any[] => {
  if (fileType === FileType.ACCOUNT_BALANCE) {
    // Extract only the columns we need from balance file by position
    return data.map(row => {
      // Safely pad the row if needed, but don't require exact column count
      const safeRow = [...row];

      const extracted: any = {};
      Object.entries(BalanceFileColumnPositions).forEach(([position, fieldName]) => {
        const pos = parseInt(position);
        // Safely access column, even if it doesn't exist
        const value = (safeRow[pos] || '').toString().trim();

        // Convert numeric fields with better error handling
        if (fieldName === 'portfolioValue' || fieldName === 'totalCash') {
          const numericValue = value === '' ? 0 : parseFloat(value.replace(/[,$]/g, ''));
          extracted[fieldName] = isNaN(numericValue) ? 0 : numericValue;
        } else {
          extracted[fieldName] = value;
        }
      });
      return extracted;
    });
  } else if (fileType === FileType.POSITIONS) {
    // Extract all columns from positions file by position
    return data.map(row => {
      // Safely pad the row if needed, but don't require exact column count
      const safeRow = [...row];

      const extracted: any = {};
      Object.entries(PositionsFileColumnPositions).forEach(([position, fieldName]) => {
        const pos = parseInt(position);
        // Safely access column, even if it doesn't exist
        const value = (safeRow[pos] || '').toString().trim();

        // Convert numeric fields with better error handling
        if (['numberOfShares', 'price', 'marketValue'].includes(fieldName)) {
          const numericValue = value === '' ? 0 : parseFloat(value.replace(/[,$]/g, ''));
          extracted[fieldName] = isNaN(numericValue) ? 0 : numericValue;
        } else {
          extracted[fieldName] = value;
        }
      });
      return extracted;
    });
  }

  return data;
};

export const validateFileData = (data: any[], fileType: FileType): { 
  valid: boolean; 
  errors: string[]; 
  warnings: string[];
  validRowCount: number;
  summary: {
    totalRows: number;
    uniqueAccounts: number;
    dateRange?: string;
  };
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  let validRowCount = 0;
  const uniqueAccounts = new Set<string>();
  const dates = new Set<string>();
  
  // Check if we have data
  if (!data || data.length === 0) {
    errors.push('No data found in file');
    return { 
      valid: false, 
      errors, 
      warnings, 
      validRowCount: 0,
      summary: { totalRows: 0, uniqueAccounts: 0 }
    };
  }
  
  // Validate each row
  data.forEach((row, index) => {
    const rowNum = index + 1;
    
    // Ensure row has enough columns - pad with empty strings if needed
    const expectedColumns = fileType === FileType.ACCOUNT_BALANCE ?
      APP_CONFIG.FILE.BALANCE_FILE_COLUMNS : APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS;
    while (row.length < expectedColumns) {
      row.push('');
    }
    
    // Get account number (position 1, index 1)
    // Handle empty or undefined values
    const accountNumber = (row[1] || '').toString().trim();
    
    if (!accountNumber) {
      warnings.push(`Row ${rowNum}: Empty account number`);
      return;
    }
    
    // Validate account number
    const validation = validateAccountNumber(accountNumber);
    if (!validation.valid) {
      if (errors.length < APP_CONFIG.FILE.MAX_ERRORS_DISPLAYED) {
        errors.push(`Row ${rowNum}: ${validation.error} (${accountNumber})`);
      }
      return;
    }
    
    uniqueAccounts.add(accountNumber);
    
    // Collect dates (position 0) - handle empty values
    const dateValue = (row[0] || '').toString().trim();
    if (dateValue) {
      dates.add(dateValue);
    }
    
    // Type-specific validation with null/empty handling
    if (fileType === FileType.ACCOUNT_BALANCE) {
      // Portfolio Value is at position 4 (column 5)
      const portfolioValueStr = (row[4] || '0').toString().trim();
      const portfolioValue = portfolioValueStr === '' ? 0 : parseFloat(portfolioValueStr);
      
      // Total Cash at position 6 (column 7)
      const totalCashStr = (row[6] || '0').toString().trim();
      const totalCash = totalCashStr === '' ? 0 : parseFloat(totalCashStr);
      
      // Only warn if both are invalid or missing
      if (isNaN(portfolioValue) && isNaN(totalCash)) {
        if (warnings.length < APP_CONFIG.FILE.MAX_WARNINGS_DISPLAYED) {
          warnings.push(`Row ${rowNum}: No valid balance values found`);
        }
        return;
      }
    } else if (fileType === FileType.POSITIONS) {
      // Number of Shares at position 7
      const sharesStr = (row[7] || '0').toString().trim();
      const shares = sharesStr === '' ? 0 : parseFloat(sharesStr);
      
      // Price at position 9 (not used in validation but kept for future use)
      // const priceStr = (row[9] || '0').toString().trim();
      // const price = priceStr === '' ? 0 : parseFloat(priceStr);
      
      // Market Value at position 11
      const marketValueStr = (row[11] || '0').toString().trim();
      const marketValue = marketValueStr === '' ? 0 : parseFloat(marketValueStr);
      
      // Only need valid shares OR valid market value
      if (isNaN(shares) && isNaN(marketValue)) {
        if (warnings.length < APP_CONFIG.FILE.MAX_WARNINGS_DISPLAYED) {
          warnings.push(`Row ${rowNum}: Invalid position data`);
        }
        return;
      }
    }
    
    validRowCount++;
  });
  
  // Check expected counts
  const accountCount = uniqueAccounts.size;
  
  if (fileType === FileType.ACCOUNT_BALANCE) {
    if (accountCount < ValidationRules.expectedAccountCount.min || 
        accountCount > ValidationRules.expectedAccountCount.max) {
      warnings.push(`Unusual account count: ${accountCount} (expected ${ValidationRules.expectedAccountCount.min}-${ValidationRules.expectedAccountCount.max})`);
    }
  } else if (fileType === FileType.POSITIONS) {
    if (validRowCount < ValidationRules.expectedPositionsMin) {
      warnings.push(`Unusual positions count: ${validRowCount} (expected ${ValidationRules.expectedPositionsMin}+)`);
    }
  }
  
  // Create date range string
  const dateArray = Array.from(dates).sort();
  const dateRange = dateArray.length > 0 ? 
    (dateArray.length === 1 ? dateArray[0] : `${dateArray[0]} to ${dateArray[dateArray.length - 1]}`) : 
    undefined;
  
  return {
    valid: errors.length === 0,
    errors: errors.slice(0, APP_CONFIG.FILE.MAX_ERRORS_DISPLAYED),
    warnings: warnings.slice(0, APP_CONFIG.FILE.MAX_WARNINGS_DISPLAYED),
    validRowCount,
    summary: {
      totalRows: data.length,
      uniqueAccounts: accountCount,
      dateRange
    }
  };
};

// Keep old functions for backward compatibility but they won't be used
export const detectFileType = (headers: string[]): FileType => {
  // This won't be used anymore but keeping for compatibility
  return FileType.UNKNOWN;
};

export const extractRequiredColumns = (data: any[], fileType: FileType): any[] => {
  // This won't be used anymore but keeping for compatibility
  return data;
};