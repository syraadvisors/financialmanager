import { APP_CONFIG } from '../config/constants';

// Account Balance file structure - matching your actual CSV
export interface AccountBalance {
  asOfBusinessDate: string;
  accountNumber: string;
  accountName: string;
  netMarketValue: number;
  portfolioValue: number;
  marketValueShort: number;
  totalCash: number;
  cashAccountBalanceNetCreditOrDebit: number;
  cashAccountBalanceNetMarketValue: number;
  cashAccountBalanceMoneyMarketFunds: number;
  equityPercentage: number;
  optionRequirements: number;
  monthEndDivPayout: number;
  marginAccountBalanceCreditOrDebit: number;
  marginAccountBalanceMarketValueLong: number;
  marginAccountBalanceMarketValueShort: number;
  marginAccountBalanceEquityIncludingOptions: number;
  marginAccountBalanceMarginCashAvailable: number;
  marginAccountBalanceEquityExcludingOptions: number;
  marginBuyingPower: number;
  mtdMarginInterest: number;
}

// Positions file structure - matching your actual CSV
export interface AccountPosition {
  asOfBusinessDate: string;
  accountNumber: string;
  accountName: string;
  symbol: string;
  securityType: string;
  securityDescription: string;
  accountingRuleCode: string;
  numberOfShares: number;
  longShort: string;
  price: number;
  dateOfPrice: string;
  marketValue: number;
}

// File type detection
export enum FileType {
  ACCOUNT_BALANCE = 'ACCOUNT_BALANCE',
  POSITIONS = 'POSITIONS',
  UNKNOWN = 'UNKNOWN'
}

// Re-export column mappings from config for backward compatibility
export const BalanceFileColumnPositions = APP_CONFIG.COLUMNS.BALANCE_FILE;
export const PositionsFileColumnPositions = APP_CONFIG.COLUMNS.POSITIONS_FILE;

// Re-export from config for backward compatibility

export const FileColumnCounts = {
  BALANCE_FILE_COLUMNS: APP_CONFIG.FILE.BALANCE_FILE_COLUMNS,
  POSITIONS_FILE_COLUMNS: APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS,
};

export const ValidationRules = {
  accountNumber: {
    minLength: APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.MIN_LENGTH,
    maxLength: APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.MAX_LENGTH,
    pattern: APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.PATTERN,
    message: APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.ERROR_MESSAGE,
  },
  expectedAccountCount: {
    min: APP_CONFIG.VALIDATION.EXPECTED_COUNTS.BALANCE_ACCOUNTS_MIN,
    max: APP_CONFIG.VALIDATION.EXPECTED_COUNTS.BALANCE_ACCOUNTS_MAX,
  },
  expectedPositionsMin: APP_CONFIG.VALIDATION.EXPECTED_COUNTS.POSITIONS_MIN,
};