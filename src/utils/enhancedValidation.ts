import { FileType, AccountBalance, AccountPosition } from '../types/DataTypes';
import { APP_CONFIG } from '../config/constants';

// Enhanced validation result interface
export interface EnhancedValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  criticalErrors: ValidationError[];
  recoverable: boolean;
  validRowCount: number;
  corruptedRowCount: number;
  summary: {
    totalRows: number;
    uniqueAccounts: number;
    dateRange?: string;
    encoding?: string;
    fileSize?: number;
    processingTime?: number;
  };
  dataQualityScore: number; // 0-100
  recommendations: string[];
}

export interface ValidationError {
  type: 'critical' | 'data' | 'format' | 'encoding';
  row?: number;
  column?: string;
  message: string;
  value?: any;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'data_quality' | 'performance' | 'compatibility';
  row?: number;
  column?: string;
  message: string;
  impact: 'low' | 'medium' | 'high';
}

// Enhanced file validation
export class EnhancedFileValidator {
  private startTime: number = 0;
  private encodingDetected: string = 'unknown';

  public async validateFile(file: File): Promise<{ valid: boolean; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];

    // File size validation
    const maxSizeBytes = APP_CONFIG.FILE.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      errors.push({
        type: 'critical',
        message: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds limit of ${APP_CONFIG.FILE.MAX_FILE_SIZE_MB}MB`,
        suggestion: 'Split the file into smaller chunks or compress the data'
      });
    }

    // File type validation
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!APP_CONFIG.FILE.SUPPORTED_FILE_TYPES.includes(fileExtension as any)) {
      errors.push({
        type: 'critical',
        message: `Unsupported file type: ${fileExtension}`,
        suggestion: `Convert to one of: ${APP_CONFIG.FILE.SUPPORTED_FILE_TYPES.join(', ')}`
      });
    }

    // File name validation
    if (file.name.includes(' ')) {
      errors.push({
        type: 'format',
        message: 'File name contains spaces which may cause processing issues',
        suggestion: 'Consider renaming file without spaces'
      });
    }

    // Check for suspicious file characteristics
    if (file.size === 0) {
      errors.push({
        type: 'critical',
        message: 'File is empty',
        suggestion: 'Ensure the file contains data before uploading'
      });
    }

    // Basic encoding detection
    try {
      const buffer = await file.slice(0, 1024).arrayBuffer();
      const bytes = new Uint8Array(buffer);
      this.encodingDetected = this.detectEncoding(bytes);

      if (this.encodingDetected === 'unknown') {
        errors.push({
          type: 'encoding',
          message: 'Could not detect file encoding, may cause character issues',
          suggestion: 'Ensure file is saved as UTF-8 or ASCII'
        });
      }
    } catch (error) {
      errors.push({
        type: 'critical',
        message: 'Could not read file contents',
        suggestion: 'File may be corrupted or in use by another application'
      });
    }

    return {
      valid: errors.filter(e => e.type === 'critical').length === 0,
      errors
    };
  }

  public validateCsvData(data: any[], fileType: FileType): EnhancedValidationResult {
    this.startTime = Date.now();

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const criticalErrors: ValidationError[] = [];
    let validRowCount = 0;
    let corruptedRowCount = 0;

    // Data structure validation
    if (!data || !Array.isArray(data)) {
      criticalErrors.push({
        type: 'critical',
        message: 'Invalid data structure - not an array',
        suggestion: 'Ensure CSV is properly parsed'
      });
      return this.createFailureResult(criticalErrors);
    }

    if (data.length === 0) {
      criticalErrors.push({
        type: 'critical',
        message: 'No data rows found',
        suggestion: 'Ensure CSV file contains data rows'
      });
      return this.createFailureResult(criticalErrors);
    }

    // Column count validation
    const expectedColumns = fileType === FileType.ACCOUNT_BALANCE
      ? APP_CONFIG.FILE.BALANCE_FILE_COLUMNS
      : APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS;

    const columnCountIssues = this.validateColumnCounts(data, expectedColumns);
    if (columnCountIssues.critical.length > 0) {
      criticalErrors.push(...columnCountIssues.critical);
    }
    warnings.push(...columnCountIssues.warnings);

    // Row-by-row validation
    const uniqueAccounts = new Set<string>();
    const dates = new Set<string>();
    const rowValidationResults = this.validateRows(data, fileType, uniqueAccounts, dates);

    validRowCount = rowValidationResults.validRows;
    corruptedRowCount = rowValidationResults.corruptedRows;
    errors.push(...rowValidationResults.errors);
    warnings.push(...rowValidationResults.warnings);

    // Data consistency checks
    const consistencyChecks = this.performConsistencyChecks(data, fileType, uniqueAccounts);
    warnings.push(...consistencyChecks.warnings);
    errors.push(...consistencyChecks.errors);

    // Calculate data quality score
    const dataQualityScore = this.calculateDataQualityScore(
      data.length,
      validRowCount,
      corruptedRowCount,
      errors,
      warnings
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(errors, warnings, dataQualityScore);

    const processingTime = Date.now() - this.startTime;

    return {
      valid: criticalErrors.length === 0 && errors.filter(e => e.type === 'critical').length === 0,
      errors,
      warnings,
      criticalErrors,
      recoverable: corruptedRowCount < data.length * 0.5, // Recoverable if less than 50% corrupted
      validRowCount,
      corruptedRowCount,
      summary: {
        totalRows: data.length,
        uniqueAccounts: uniqueAccounts.size,
        dateRange: this.createDateRange(Array.from(dates)),
        encoding: this.encodingDetected,
        processingTime
      },
      dataQualityScore,
      recommendations
    };
  }

  private detectEncoding(bytes: Uint8Array): string {
    // Simple encoding detection
    let hasHighAscii = false;
    let hasBOM = false;

    // Check for UTF-8 BOM
    if (bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF) {
      hasBOM = true;
    }

    // Check for high ASCII characters
    for (let i = 0; i < Math.min(bytes.length, 1000); i++) {
      if (bytes[i] > 127) {
        hasHighAscii = true;
        break;
      }
    }

    if (hasBOM) return 'utf-8-bom';
    if (hasHighAscii) return 'utf-8';
    return 'ascii';
  }

  private validateColumnCounts(data: any[], expectedColumns: number): {
    critical: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const critical: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const columnCounts = new Map<number, number>();

    data.forEach((row, index) => {
      const colCount = Array.isArray(row) ? row.length : 0;
      columnCounts.set(colCount, (columnCounts.get(colCount) || 0) + 1);

      if (colCount !== expectedColumns && colCount > 0) {
        if (Math.abs(colCount - expectedColumns) > 2) {
          critical.push({
            type: 'critical',
            row: index + 1,
            message: `Row has ${colCount} columns, expected ${expectedColumns}`,
            suggestion: 'Check CSV format and column alignment'
          });
        } else {
          warnings.push({
            type: 'data_quality',
            row: index + 1,
            message: `Row has ${colCount} columns, expected ${expectedColumns}`,
            impact: 'medium'
          });
        }
      }
    });

    // Check for consistent column counts
    if (columnCounts.size > 3) {
      warnings.push({
        type: 'data_quality',
        message: `Inconsistent column counts found: ${Array.from(columnCounts.keys()).join(', ')}`,
        impact: 'high'
      });
    }

    return { critical, warnings };
  }

  private validateRows(
    data: any[],
    fileType: FileType,
    uniqueAccounts: Set<string>,
    dates: Set<string>
  ): {
    validRows: number;
    corruptedRows: number;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let validRows = 0;
    let corruptedRows = 0;

    const suspiciousPatterns = {
      repeatingData: new Map<string, number>(),
      nullValues: 0,
      invalidDates: 0,
      negativeValues: 0
    };

    data.forEach((row, index) => {
      const rowNum = index + 1;
      let rowValid = true;
      let rowCorrupted = false;

      if (!Array.isArray(row)) {
        errors.push({
          type: 'data',
          row: rowNum,
          message: 'Row is not an array',
          suggestion: 'Check CSV parsing'
        });
        corruptedRows++;
        return;
      }

      // Pad row if needed
      while (row.length < (fileType === FileType.ACCOUNT_BALANCE ? APP_CONFIG.FILE.BALANCE_FILE_COLUMNS : APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS)) {
        row.push('');
      }

      // Account number validation with enhanced checks
      const accountNumber = (row[1] || '').toString().trim();
      if (!accountNumber) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          message: 'Empty account number',
          impact: 'high'
        });
        rowValid = false;
      } else {
        const accountValidation = this.validateAccountNumberEnhanced(accountNumber, rowNum);
        if (accountValidation.errors.length > 0) {
          errors.push(...accountValidation.errors);
          rowValid = false;
        }
        if (accountValidation.warnings.length > 0) {
          warnings.push(...accountValidation.warnings);
        }
        uniqueAccounts.add(accountNumber);
      }

      // Date validation with format detection
      const dateValue = (row[0] || '').toString().trim();
      if (dateValue) {
        const dateValidation = this.validateDateEnhanced(dateValue, rowNum);
        if (dateValidation.valid) {
          dates.add(dateValue);
        } else {
          errors.push(...dateValidation.errors);
          suspiciousPatterns.invalidDates++;
          rowValid = false;
        }
      }

      // Type-specific validation
      if (fileType === FileType.ACCOUNT_BALANCE) {
        const balanceValidation = this.validateBalanceRow(row, rowNum);
        if (!balanceValidation.valid) {
          errors.push(...balanceValidation.errors);
          warnings.push(...balanceValidation.warnings);
          if (balanceValidation.corrupted) rowCorrupted = true;
          rowValid = false;
        }
      } else if (fileType === FileType.POSITIONS) {
        const positionValidation = this.validatePositionRow(row, rowNum);
        if (!positionValidation.valid) {
          errors.push(...positionValidation.errors);
          warnings.push(...positionValidation.warnings);
          if (positionValidation.corrupted) rowCorrupted = true;
          rowValid = false;
        }
      }

      // Check for suspicious patterns
      const rowString = row.join(',');
      suspiciousPatterns.repeatingData.set(rowString, (suspiciousPatterns.repeatingData.get(rowString) || 0) + 1);

      if (rowValid) {
        validRows++;
      } else if (rowCorrupted) {
        corruptedRows++;
      }
    });

    // Analyze suspicious patterns
    const patternWarnings = this.analyzeSuspiciousPatterns(suspiciousPatterns, data.length);
    warnings.push(...patternWarnings);

    return { validRows, corruptedRows, errors, warnings };
  }

  private validateAccountNumberEnhanced(accountNumber: string, rowNum: number): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Remove formatting
    const cleaned = accountNumber.replace(/[\s-_]/g, '');

    // Check if numeric
    if (!/^\d+$/.test(cleaned)) {
      if (/^[A-Za-z0-9]+$/.test(cleaned)) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          column: 'accountNumber',
          message: `Account number contains letters: ${accountNumber}`,
          impact: 'medium'
        });
      } else {
        errors.push({
          type: 'data',
          row: rowNum,
          column: 'accountNumber',
          message: `Invalid characters in account number: ${accountNumber}`,
          value: accountNumber,
          suggestion: 'Account numbers should contain only digits'
        });
      }
    }

    // Length validation
    const rules = APP_CONFIG.VALIDATION.ACCOUNT_NUMBER;
    if (cleaned.length < rules.MIN_LENGTH || cleaned.length > rules.MAX_LENGTH) {
      errors.push({
        type: 'data',
        row: rowNum,
        column: 'accountNumber',
        message: `Account number length ${cleaned.length} outside valid range ${rules.MIN_LENGTH}-${rules.MAX_LENGTH}`,
        value: accountNumber,
        suggestion: `Account numbers must be ${rules.MIN_LENGTH}-${rules.MAX_LENGTH} digits`
      });
    }

    // Leading zero check
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      warnings.push({
        type: 'data_quality',
        row: rowNum,
        column: 'accountNumber',
        message: `Account number starts with zero: ${accountNumber}`,
        impact: 'low'
      });
    }

    // Pattern validation
    if (cleaned === cleaned[0].repeat(cleaned.length)) {
      warnings.push({
        type: 'data_quality',
        row: rowNum,
        column: 'accountNumber',
        message: `Suspicious repeating digits: ${accountNumber}`,
        impact: 'medium'
      });
    }

    return { errors, warnings };
  }

  private validateDateEnhanced(dateValue: string, rowNum: number): {
    valid: boolean;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // Try to parse common date formats
    const dateFormats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{8}$/, // YYYYMMDD
    ];

    const matchesFormat = dateFormats.some(format => format.test(dateValue));
    if (!matchesFormat) {
      errors.push({
        type: 'data',
        row: rowNum,
        column: 'date',
        message: `Invalid date format: ${dateValue}`,
        value: dateValue,
        suggestion: 'Use format: YYYY-MM-DD, MM/DD/YYYY, or YYYYMMDD'
      });
      return { valid: false, errors };
    }

    // Try to create a Date object
    let parsedDate: Date | null = null;

    if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      parsedDate = new Date(dateValue);
    } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateValue)) {
      parsedDate = new Date(dateValue);
    } else if (/^\d{8}$/.test(dateValue)) {
      const year = dateValue.substring(0, 4);
      const month = dateValue.substring(4, 6);
      const day = dateValue.substring(6, 8);
      parsedDate = new Date(`${year}-${month}-${day}`);
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
      errors.push({
        type: 'data',
        row: rowNum,
        column: 'date',
        message: `Invalid date value: ${dateValue}`,
        value: dateValue,
        suggestion: 'Ensure date values are valid calendar dates'
      });
      return { valid: false, errors };
    }

    // Range validation
    const now = new Date();
    const minDate = new Date(1990, 0, 1);
    const maxDate = new Date(now.getFullYear() + 1, 11, 31);

    if (parsedDate < minDate || parsedDate > maxDate) {
      errors.push({
        type: 'data',
        row: rowNum,
        column: 'date',
        message: `Date outside valid range (1990-${now.getFullYear() + 1}): ${dateValue}`,
        value: dateValue,
        suggestion: 'Check date values for typos'
      });
      return { valid: false, errors };
    }

    return { valid: true, errors: [] };
  }

  private validateBalanceRow(row: any[], rowNum: number): {
    valid: boolean;
    corrupted: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let valid = true;
    let corrupted = false;

    // Portfolio Value validation
    const portfolioValueStr = (row[4] || '0').toString().trim();
    const portfolioValue = parseFloat(portfolioValueStr.replace(/[,$]/g, ''));

    if (isNaN(portfolioValue)) {
      if (portfolioValueStr && portfolioValueStr !== '0') {
        errors.push({
          type: 'data',
          row: rowNum,
          column: 'portfolioValue',
          message: `Invalid portfolio value: ${portfolioValueStr}`,
          value: portfolioValueStr,
          suggestion: 'Portfolio values should be numeric'
        });
        corrupted = true;
      }
      valid = false;
    } else {
      if (portfolioValue < 0) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          column: 'portfolioValue',
          message: `Negative portfolio value: ${portfolioValue}`,
          impact: 'high'
        });
      }
      if (portfolioValue > 100000000) { // $100M
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          column: 'portfolioValue',
          message: `Unusually large portfolio value: ${portfolioValue}`,
          impact: 'medium'
        });
      }
    }

    // Total Cash validation
    const totalCashStr = (row[6] || '0').toString().trim();
    const totalCash = parseFloat(totalCashStr.replace(/[,$]/g, ''));

    if (isNaN(totalCash)) {
      if (totalCashStr && totalCashStr !== '0') {
        errors.push({
          type: 'data',
          row: rowNum,
          column: 'totalCash',
          message: `Invalid cash value: ${totalCashStr}`,
          value: totalCashStr,
          suggestion: 'Cash values should be numeric'
        });
        corrupted = true;
      }
      valid = false;
    } else {
      if (totalCash < 0) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          column: 'totalCash',
          message: `Negative cash value: ${totalCash}`,
          impact: 'medium'
        });
      }
      if (!isNaN(portfolioValue) && totalCash > portfolioValue * 1.1) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          message: `Cash exceeds portfolio value: cash=${totalCash}, portfolio=${portfolioValue}`,
          impact: 'high'
        });
      }
    }

    return { valid, corrupted, errors, warnings };
  }

  private validatePositionRow(row: any[], rowNum: number): {
    valid: boolean;
    corrupted: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let valid = true;
    let corrupted = false;

    // Symbol validation
    const symbol = (row[3] || '').toString().trim();
    if (!symbol) {
      warnings.push({
        type: 'data_quality',
        row: rowNum,
        column: 'symbol',
        message: 'Empty symbol',
        impact: 'high'
      });
      valid = false;
    } else if (!/^[A-Z0-9.-]+$/.test(symbol)) {
      warnings.push({
        type: 'data_quality',
        row: rowNum,
        column: 'symbol',
        message: `Unusual symbol format: ${symbol}`,
        impact: 'low'
      });
    }

    // Shares validation
    const sharesStr = (row[7] || '0').toString().trim();
    const shares = parseFloat(sharesStr.replace(/[,]/g, ''));

    if (isNaN(shares)) {
      if (sharesStr && sharesStr !== '0') {
        errors.push({
          type: 'data',
          row: rowNum,
          column: 'numberOfShares',
          message: `Invalid shares value: ${sharesStr}`,
          value: sharesStr,
          suggestion: 'Share quantities should be numeric'
        });
        corrupted = true;
      }
      valid = false;
    }

    // Market Value validation
    const marketValueStr = (row[11] || '0').toString().trim();
    const marketValue = parseFloat(marketValueStr.replace(/[,$]/g, ''));

    if (isNaN(marketValue)) {
      if (marketValueStr && marketValueStr !== '0') {
        errors.push({
          type: 'data',
          row: rowNum,
          column: 'marketValue',
          message: `Invalid market value: ${marketValueStr}`,
          value: marketValueStr,
          suggestion: 'Market values should be numeric'
        });
        corrupted = true;
      }
      valid = false;
    }

    // Cross-field validation
    if (!isNaN(shares) && !isNaN(marketValue) && shares !== 0 && marketValue !== 0) {
      const impliedPrice = marketValue / shares;
      if (impliedPrice < 0.01 || impliedPrice > 10000) {
        warnings.push({
          type: 'data_quality',
          row: rowNum,
          message: `Unusual implied price: $${impliedPrice.toFixed(2)} (${shares} shares × price = $${marketValue})`,
          impact: 'medium'
        });
      }
    }

    return { valid, corrupted, errors, warnings };
  }

  private performConsistencyChecks(
    data: any[],
    fileType: FileType,
    uniqueAccounts: Set<string>
  ): {
    errors: ValidationError[];
    warnings: ValidationWarning[];
  } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Account count validation
    const expectedCounts = APP_CONFIG.VALIDATION.EXPECTED_COUNTS;
    const accountCount = uniqueAccounts.size;

    if (fileType === FileType.ACCOUNT_BALANCE) {
      if (accountCount < expectedCounts.BALANCE_ACCOUNTS_MIN) {
        warnings.push({
          type: 'data_quality',
          message: `Low account count: ${accountCount} (expected ${expectedCounts.BALANCE_ACCOUNTS_MIN}+)`,
          impact: 'medium'
        });
      } else if (accountCount > expectedCounts.BALANCE_ACCOUNTS_MAX) {
        warnings.push({
          type: 'data_quality',
          message: `High account count: ${accountCount} (expected <${expectedCounts.BALANCE_ACCOUNTS_MAX})`,
          impact: 'low'
        });
      }
    } else if (fileType === FileType.POSITIONS) {
      if (data.length < expectedCounts.POSITIONS_MIN) {
        warnings.push({
          type: 'data_quality',
          message: `Low positions count: ${data.length} (expected ${expectedCounts.POSITIONS_MIN}+)`,
          impact: 'medium'
        });
      }
    }

    return { errors, warnings };
  }

  private analyzeSuspiciousPatterns(patterns: any, totalRows: number): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for too many duplicate rows
    for (const [rowData, count] of patterns.repeatingData) {
      if (count > Math.max(5, totalRows * 0.05)) {
        warnings.push({
          type: 'data_quality',
          message: `${count} identical rows found - possible data duplication`,
          impact: 'high'
        });
      }
    }

    // Check for high invalid date ratio
    if (patterns.invalidDates > totalRows * 0.1) {
      warnings.push({
        type: 'data_quality',
        message: `High invalid date ratio: ${((patterns.invalidDates / totalRows) * 100).toFixed(1)}%`,
        impact: 'high'
      });
    }

    return warnings;
  }

  private calculateDataQualityScore(
    totalRows: number,
    validRows: number,
    corruptedRows: number,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): number {
    let score = 100;

    // Deduct for invalid rows
    if (totalRows > 0) {
      const validRatio = validRows / totalRows;
      const corruptedRatio = corruptedRows / totalRows;

      score = Math.max(0, score * validRatio - (corruptedRatio * 50));
    }

    // Deduct for errors
    score -= errors.length * 2;

    // Deduct for warnings based on impact
    warnings.forEach(warning => {
      const deduction = warning.impact === 'high' ? 3 : warning.impact === 'medium' ? 1 : 0.5;
      score -= deduction;
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  private generateRecommendations(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    dataQualityScore: number
  ): string[] {
    const recommendations: string[] = [];

    if (dataQualityScore < 50) {
      recommendations.push('Consider reviewing and cleaning the data before proceeding');
    }

    if (errors.some(e => e.type === 'encoding')) {
      recommendations.push('Save the CSV file with UTF-8 encoding to prevent character issues');
    }

    if (warnings.some(w => w.type === 'data_quality' && w.impact === 'high')) {
      recommendations.push('Review high-impact data quality issues before analysis');
    }

    const formatErrors = errors.filter(e => e.type === 'format');
    if (formatErrors.length > 0) {
      recommendations.push('Check CSV formatting - ensure proper delimiters and escaping');
    }

    if (warnings.some(w => w.message.includes('duplicate'))) {
      recommendations.push('Remove duplicate records to improve data accuracy');
    }

    if (recommendations.length === 0 && dataQualityScore > 85) {
      recommendations.push('Data quality is excellent - ready for analysis');
    }

    return recommendations;
  }

  private createDateRange(dates: string[]): string | undefined {
    if (dates.length === 0) return undefined;

    const sortedDates = dates.sort();
    return sortedDates.length === 1
      ? sortedDates[0]
      : `${sortedDates[0]} to ${sortedDates[sortedDates.length - 1]}`;
  }

  private createFailureResult(criticalErrors: ValidationError[]): EnhancedValidationResult {
    return {
      valid: false,
      errors: criticalErrors,
      warnings: [],
      criticalErrors,
      recoverable: false,
      validRowCount: 0,
      corruptedRowCount: 0,
      summary: {
        totalRows: 0,
        uniqueAccounts: 0,
        processingTime: Date.now() - this.startTime
      },
      dataQualityScore: 0,
      recommendations: ['Fix critical errors before proceeding']
    };
  }
}