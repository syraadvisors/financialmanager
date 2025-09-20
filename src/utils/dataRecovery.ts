import { FileType, AccountBalance, AccountPosition } from '../types/DataTypes';
import { EnhancedValidationResult, ValidationError } from './enhancedValidation';

export interface RecoveryResult<T> {
  success: boolean;
  recoveredData: T[];
  discardedRows: number;
  recoveryActions: RecoveryAction[];
  qualityScore: number;
  warnings: string[];
}

export interface RecoveryAction {
  type: 'fix' | 'discard' | 'interpolate' | 'substitute';
  row: number;
  column?: string;
  originalValue: any;
  newValue: any;
  description: string;
}

export interface PartialLoadOptions {
  allowPartialData: boolean;
  minValidRowsPercent: number; // 0-100
  maxErrorsPercent: number; // 0-100
  autoFix: boolean;
  preserveStructure: boolean;
}

export class DataRecoveryEngine {
  private readonly defaultOptions: PartialLoadOptions = {
    allowPartialData: true,
    minValidRowsPercent: 60,
    maxErrorsPercent: 25,
    autoFix: true,
    preserveStructure: true
  };

  public async attemptRecovery<T extends AccountBalance | AccountPosition>(
    data: any[],
    fileType: FileType,
    validationResult: EnhancedValidationResult,
    options?: Partial<PartialLoadOptions>
  ): Promise<RecoveryResult<T>> {
    const config = { ...this.defaultOptions, ...options };
    const recoveryActions: RecoveryAction[] = [];
    const warnings: string[] = [];
    let recoveredData: T[] = [];
    let discardedRows = 0;

    // Check if recovery is possible
    if (!this.isRecoveryFeasible(validationResult, config)) {
      return {
        success: false,
        recoveredData: [],
        discardedRows: data.length,
        recoveryActions: [],
        qualityScore: 0,
        warnings: ['Data quality too poor for recovery - please review and reprocess']
      };
    }

    // Process each row with recovery attempts
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowResult = await this.processRowWithRecovery(
        row,
        i + 1,
        fileType,
        validationResult.errors.filter(e => e.row === i + 1),
        config
      );

      if (rowResult.success) {
        recoveredData.push(rowResult.data as T);
        recoveryActions.push(...rowResult.actions);
      } else {
        discardedRows++;
        warnings.push(`Row ${i + 1}: ${rowResult.reason}`);
      }
    }

    // Perform data consistency repairs
    const consistencyResult = this.repairDataConsistency(recoveredData, fileType, config);
    recoveredData = consistencyResult.data as T[];
    recoveryActions.push(...consistencyResult.actions);
    warnings.push(...consistencyResult.warnings);

    // Calculate final quality score
    const qualityScore = this.calculateRecoveryQuality(
      recoveredData.length,
      discardedRows,
      recoveryActions,
      validationResult.dataQualityScore
    );

    return {
      success: recoveredData.length > 0,
      recoveredData,
      discardedRows,
      recoveryActions,
      qualityScore,
      warnings
    };
  }

  private isRecoveryFeasible(result: EnhancedValidationResult, config: PartialLoadOptions): boolean {
    if (!config.allowPartialData) return result.valid;

    const validPercent = (result.validRowCount / result.summary.totalRows) * 100;
    const errorPercent = (result.errors.length / result.summary.totalRows) * 100;

    return validPercent >= config.minValidRowsPercent &&
           errorPercent <= config.maxErrorsPercent &&
           result.criticalErrors.length === 0;
  }

  private async processRowWithRecovery(
    row: any[],
    rowNum: number,
    fileType: FileType,
    errors: ValidationError[],
    config: PartialLoadOptions
  ): Promise<{
    success: boolean;
    data?: any;
    actions: RecoveryAction[];
    reason?: string;
  }> {
    const actions: RecoveryAction[] = [];
    let processedRow = [...row];

    // If no errors, process normally
    if (errors.length === 0) {
      const extracted = this.extractRequiredColumns(processedRow, fileType);
      return {
        success: true,
        data: extracted,
        actions: []
      };
    }

    // Attempt to fix each error
    for (const error of errors) {
      const fixResult = this.attemptErrorFix(processedRow, error, rowNum, fileType, config);

      if (fixResult.success && fixResult.action) {
        processedRow = fixResult.row;
        actions.push(fixResult.action);
      } else if (fixResult.critical) {
        return {
          success: false,
          actions,
          reason: `Critical error in ${error.column}: ${error.message}`
        };
      }
    }

    // Final validation of the fixed row
    const extracted = this.extractRequiredColumns(processedRow, fileType);
    const isValid = this.validateExtractedRow(extracted, fileType);

    if (isValid) {
      return {
        success: true,
        data: extracted,
        actions
      };
    } else {
      return {
        success: false,
        actions,
        reason: 'Row could not be sufficiently repaired'
      };
    }
  }

  private attemptErrorFix(
    row: any[],
    error: ValidationError,
    rowNum: number,
    fileType: FileType,
    config: PartialLoadOptions
  ): {
    success: boolean;
    row: any[];
    action?: RecoveryAction;
    critical?: boolean;
  } {
    if (!config.autoFix) {
      return { success: false, row, critical: error.type === 'critical' };
    }

    const newRow = [...row];
    let fixed = false;
    let action: RecoveryAction | undefined;

    switch (error.column) {
      case 'accountNumber':
        const fixedAccountResult = this.fixAccountNumber(error.value, rowNum);
        if (fixedAccountResult.success) {
          newRow[1] = fixedAccountResult.value;
          action = {
            type: 'fix',
            row: rowNum,
            column: 'accountNumber',
            originalValue: error.value,
            newValue: fixedAccountResult.value,
            description: 'Cleaned account number format'
          };
          fixed = true;
        }
        break;

      case 'date':
        const fixedDateResult = this.fixDateValue(error.value, rowNum);
        if (fixedDateResult.success) {
          newRow[0] = fixedDateResult.value;
          action = {
            type: 'fix',
            row: rowNum,
            column: 'date',
            originalValue: error.value,
            newValue: fixedDateResult.value,
            description: 'Standardized date format'
          };
          fixed = true;
        }
        break;

      case 'portfolioValue':
      case 'totalCash':
      case 'marketValue':
      case 'price':
      case 'numberOfShares':
        const fixedNumericResult = this.fixNumericValue(error.value, error.column);
        if (fixedNumericResult.success) {
          const columnIndex = this.getColumnIndex(error.column, fileType);
          if (columnIndex !== -1) {
            newRow[columnIndex] = fixedNumericResult.value;
            action = {
              type: 'fix',
              row: rowNum,
              column: error.column,
              originalValue: error.value,
              newValue: fixedNumericResult.value,
              description: 'Cleaned numeric value'
            };
            fixed = true;
          }
        } else {
          // Try substituting with zero
          const columnIndex = this.getColumnIndex(error.column, fileType);
          if (columnIndex !== -1) {
            newRow[columnIndex] = '0';
            action = {
              type: 'substitute',
              row: rowNum,
              column: error.column,
              originalValue: error.value,
              newValue: '0',
              description: 'Substituted invalid value with zero'
            };
            fixed = true;
          }
        }
        break;

      default:
        // For unknown columns, try basic cleanup
        if (error.value && typeof error.value === 'string') {
          const cleaned = error.value.trim().replace(/[^\w\s.-]/g, '');
          if (cleaned !== error.value && cleaned.length > 0) {
            // Find the column index and fix
            // This is a generic fix attempt
            action = {
              type: 'fix',
              row: rowNum,
              column: error.column || 'unknown',
              originalValue: error.value,
              newValue: cleaned,
              description: 'Cleaned special characters'
            };
            fixed = true;
          }
        }
    }

    return {
      success: fixed,
      row: newRow,
      action,
      critical: error.type === 'critical' && !fixed
    };
  }

  private fixAccountNumber(value: any, rowNum: number): { success: boolean; value?: string } {
    if (!value) return { success: false };

    let cleaned = value.toString().trim();

    // Remove common formatting
    cleaned = cleaned.replace(/[\s-_()]/g, '');

    // Check if it's now valid
    if (/^\d{8,9}$/.test(cleaned) && !cleaned.startsWith('0')) {
      return { success: true, value: cleaned };
    }

    // Try to extract digits only
    const digitsOnly = cleaned.replace(/\D/g, '');
    if (digitsOnly.length >= 8 && digitsOnly.length <= 9 && !digitsOnly.startsWith('0')) {
      return { success: true, value: digitsOnly };
    }

    return { success: false };
  }

  private fixDateValue(value: any, rowNum: number): { success: boolean; value?: string } {
    if (!value) return { success: false };

    const dateStr = value.toString().trim();

    // Try various date parsing strategies
    const patterns = [
      // MM/DD/YYYY to YYYY-MM-DD
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` },
      // MM-DD-YYYY to YYYY-MM-DD
      { regex: /^(\d{1,2})-(\d{1,2})-(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` },
      // YYYYMMDD to YYYY-MM-DD
      { regex: /^(\d{4})(\d{2})(\d{2})$/, format: (m: RegExpMatchArray) => `${m[1]}-${m[2]}-${m[3]}` },
      // DD/MM/YYYY to YYYY-MM-DD (European format)
      { regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, format: (m: RegExpMatchArray) => `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` }
    ];

    for (const pattern of patterns) {
      const match = dateStr.match(pattern.regex);
      if (match) {
        const formatted = pattern.format(match);
        // Validate the date
        const testDate = new Date(formatted);
        if (!isNaN(testDate.getTime())) {
          return { success: true, value: formatted };
        }
      }
    }

    return { success: false };
  }

  private fixNumericValue(value: any, column: string): { success: boolean; value?: string } {
    if (value === null || value === undefined) return { success: false };

    let cleaned = value.toString().trim();

    // Remove common formatting
    cleaned = cleaned.replace(/[$,\s()]/g, '');

    // Handle parentheses as negative (accounting format)
    const isNegative = value.toString().includes('(') && value.toString().includes(')');
    if (isNegative) {
      cleaned = '-' + cleaned.replace(/[()]/g, '');
    }

    // Try to parse as number
    const num = parseFloat(cleaned);
    if (!isNaN(num) && isFinite(num)) {
      return { success: true, value: num.toString() };
    }

    // Try to extract just the numeric parts
    const numericOnly = cleaned.match(/^-?\d*\.?\d+/);
    if (numericOnly) {
      const extractedNum = parseFloat(numericOnly[0]);
      if (!isNaN(extractedNum) && isFinite(extractedNum)) {
        return { success: true, value: extractedNum.toString() };
      }
    }

    return { success: false };
  }

  private getColumnIndex(columnName: string, fileType: FileType): number {
    const mappings = fileType === FileType.ACCOUNT_BALANCE
      ? {
          'portfolioValue': 4,
          'totalCash': 6
        }
      : {
          'numberOfShares': 7,
          'price': 9,
          'marketValue': 11
        };

    return mappings[columnName as keyof typeof mappings] || -1;
  }

  private repairDataConsistency<T extends AccountBalance | AccountPosition>(
    data: T[],
    fileType: FileType,
    config: PartialLoadOptions
  ): {
    data: T[];
    actions: RecoveryAction[];
    warnings: string[];
  } {
    const actions: RecoveryAction[] = [];
    const warnings: string[] = [];
    const repairedData = [...data];

    if (fileType === FileType.ACCOUNT_BALANCE) {
      return this.repairBalanceConsistency(repairedData as AccountBalance[], actions, warnings) as any;
    } else {
      return this.repairPositionsConsistency(repairedData as AccountPosition[], actions, warnings) as any;
    }
  }

  private repairBalanceConsistency(
    data: AccountBalance[],
    actions: RecoveryAction[],
    warnings: string[]
  ): {
    data: AccountBalance[];
    actions: RecoveryAction[];
    warnings: string[];
  } {
    // Remove duplicates
    const seen = new Set<string>();
    const uniqueData = data.filter((item, index) => {
      const key = `${item.accountNumber}-${item.asOfBusinessDate}`;
      if (seen.has(key)) {
        actions.push({
          type: 'discard',
          row: index + 1,
          originalValue: item,
          newValue: null,
          description: 'Removed duplicate account-date combination'
        });
        return false;
      }
      seen.add(key);
      return true;
    });

    // Fix negative portfolio values that might be data entry errors
    uniqueData.forEach((item, index) => {
      if (item.portfolioValue < 0 && item.totalCash > 0) {
        // Might be a sign error
        const originalValue = item.portfolioValue;
        item.portfolioValue = Math.abs(item.portfolioValue);
        actions.push({
          type: 'fix',
          row: index + 1,
          column: 'portfolioValue',
          originalValue,
          newValue: item.portfolioValue,
          description: 'Corrected negative portfolio value (likely sign error)'
        });
      }
    });

    if (data.length !== uniqueData.length) {
      warnings.push(`Removed ${data.length - uniqueData.length} duplicate records`);
    }

    return { data: uniqueData, actions, warnings };
  }

  private repairPositionsConsistency(
    data: AccountPosition[],
    actions: RecoveryAction[],
    warnings: string[]
  ): {
    data: AccountPosition[];
    actions: RecoveryAction[];
    warnings: string[];
  } {
    // Remove duplicates
    const seen = new Set<string>();
    const uniqueData = data.filter((item, index) => {
      const key = `${item.accountNumber}-${item.symbol}-${item.asOfBusinessDate}`;
      if (seen.has(key)) {
        actions.push({
          type: 'discard',
          row: index + 1,
          originalValue: item,
          newValue: null,
          description: 'Removed duplicate position'
        });
        return false;
      }
      seen.add(key);
      return true;
    });

    // Fix obvious calculation errors
    uniqueData.forEach((item, index) => {
      if (item.numberOfShares && item.price && item.marketValue) {
        const calculatedValue = item.numberOfShares * item.price;
        const difference = Math.abs(calculatedValue - item.marketValue);
        const percentDiff = difference / Math.max(calculatedValue, item.marketValue);

        // If the difference is more than 5% and shares*price makes more sense
        if (percentDiff > 0.05 && calculatedValue > 0) {
          const originalValue = item.marketValue;
          item.marketValue = calculatedValue;
          actions.push({
            type: 'fix',
            row: index + 1,
            column: 'marketValue',
            originalValue,
            newValue: calculatedValue,
            description: 'Recalculated market value from shares × price'
          });
        }
      }
    });

    if (data.length !== uniqueData.length) {
      warnings.push(`Removed ${data.length - uniqueData.length} duplicate positions`);
    }

    return { data: uniqueData, actions, warnings };
  }

  private extractRequiredColumns(row: any[], fileType: FileType): any {
    // Use the existing column extraction logic
    if (fileType === FileType.ACCOUNT_BALANCE) {
      return {
        asOfBusinessDate: (row[0] || '').toString().trim(),
        accountNumber: (row[1] || '').toString().trim(),
        accountName: (row[2] || '').toString().trim(),
        portfolioValue: parseFloat((row[4] || '0').toString().replace(/[,$]/g, '')) || 0,
        totalCash: parseFloat((row[6] || '0').toString().replace(/[,$]/g, '')) || 0,
      };
    } else {
      return {
        asOfBusinessDate: (row[0] || '').toString().trim(),
        accountNumber: (row[1] || '').toString().trim(),
        accountName: (row[2] || '').toString().trim(),
        symbol: (row[3] || '').toString().trim(),
        securityType: (row[4] || '').toString().trim(),
        securityDescription: (row[5] || '').toString().trim(),
        accountingRuleCode: (row[6] || '').toString().trim(),
        numberOfShares: parseFloat((row[7] || '0').toString().replace(/[,]/g, '')) || 0,
        longShort: (row[8] || '').toString().trim(),
        price: parseFloat((row[9] || '0').toString().replace(/[,$]/g, '')) || 0,
        dateOfPrice: (row[10] || '').toString().trim(),
        marketValue: parseFloat((row[11] || '0').toString().replace(/[,$]/g, '')) || 0,
      };
    }
  }

  private validateExtractedRow(extracted: any, fileType: FileType): boolean {
    if (fileType === FileType.ACCOUNT_BALANCE) {
      return extracted.accountNumber &&
             extracted.accountNumber.length >= 8 &&
             (extracted.portfolioValue > 0 || extracted.totalCash > 0);
    } else {
      return extracted.accountNumber &&
             extracted.accountNumber.length >= 8 &&
             extracted.symbol &&
             (extracted.numberOfShares !== 0 || extracted.marketValue !== 0);
    }
  }

  private calculateRecoveryQuality(
    recoveredRows: number,
    discardedRows: number,
    actions: RecoveryAction[],
    originalQuality: number
  ): number {
    if (recoveredRows === 0) return 0;

    const totalRows = recoveredRows + discardedRows;
    const recoveryRate = recoveredRows / totalRows;

    // Base score on recovery rate
    let score = recoveryRate * originalQuality;

    // Adjust based on types of fixes made
    const fixCount = actions.filter(a => a.type === 'fix').length;
    const substituteCount = actions.filter(a => a.type === 'substitute').length;
    const discardCount = actions.filter(a => a.type === 'discard').length;

    // Deduct for substitutions (less reliable than fixes)
    score -= (substituteCount / totalRows) * 15;

    // Small deduction for fixes (but they're better than substitutions)
    score -= (fixCount / totalRows) * 5;

    // Deduct for discarded rows
    score -= (discardCount / totalRows) * 10;

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}