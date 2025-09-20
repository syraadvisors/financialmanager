// Application Configuration Constants

// File Processing Configuration
export const FILE_CONFIG = {
  // Column counts for file type detection
  BALANCE_FILE_COLUMNS: 21,
  POSITIONS_FILE_COLUMNS: 12,

  // Preview and display limits
  PREVIEW_ROWS: 5,
  MAX_ERRORS_DISPLAYED: 10,
  MAX_WARNINGS_DISPLAYED: 10,

  // File upload constraints
  MAX_FILE_SIZE_MB: 100,
  SUPPORTED_FILE_TYPES: ['.csv'] as const,
  MAX_FILES: 1,
} as const;

// Data Validation Configuration
export const VALIDATION_CONFIG = {
  // Account number validation
  ACCOUNT_NUMBER: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 9,
    PATTERN: /^[1-9]\d{7,8}$/,
    ERROR_MESSAGE: 'Account number must be 8-9 digits and cannot start with 0',
  },

  // Expected data volumes for validation warnings
  EXPECTED_COUNTS: {
    BALANCE_ACCOUNTS_MIN: 2000,
    BALANCE_ACCOUNTS_MAX: 2500,
    POSITIONS_MIN: 10000,
  },

  // Date validation
  DATE_FORMATS: [
    'YYYY-MM-DD',
    'MM/DD/YYYY',
    'DD/MM/YYYY',
  ],
} as const;

// Column Mapping Configuration
export const COLUMN_MAPPINGS = {
  // Balance file column positions (0-indexed) - matching actual CSV structure
  BALANCE_FILE: {
    0: 'asOfBusinessDate',     // As Of Business Date
    1: 'accountNumber',        // Account Number
    2: 'accountName',          // Account Name
    3: 'netMarketValue',       // Net Market Value
    4: 'portfolioValue',       // Portfolio Value
    5: 'marketValueShort',     // Market Value Short
    6: 'totalCash',            // Total Cash
    7: 'cashAccountBalanceNetCreditOrDebit',        // Cash Account Balance - Net Credit or Debit
    8: 'cashAccountBalanceNetMarketValue',          // Cash Account Balance - Net Market Value
    9: 'cashAccountBalanceMoneyMarketFunds',        // Cash Account Balance - Money Market Funds
    10: 'equityPercentage',    // Equity Percentage
    11: 'optionRequirements',  // Option Requirements
    12: 'monthEndDivPayout',   // Month-End Div Payout
    13: 'marginAccountBalanceCreditOrDebit',        // Margin Account Balance - Credit or Debit
    14: 'marginAccountBalanceMarketValueLong',      // Margin Account Balance - Market Value Long
    15: 'marginAccountBalanceMarketValueShort',     // Margin Account Balance - Market Value Short
    16: 'marginAccountBalanceEquityIncludingOptions', // Margin Account Balance - Equity Including Options
    17: 'marginAccountBalanceMarginCashAvailable',   // Margin Account Balance - Margin Cash Available
    18: 'marginAccountBalanceEquityExcludingOptions', // Margin Account Balance - Equity Excluding Options
    19: 'marginBuyingPower',   // Margin Buying Power
    20: 'mtdMarginInterest',   // MTD Margin Interest
  },

  // Positions file column positions (0-indexed) - matching actual CSV structure
  POSITIONS_FILE: {
    0: 'asOfBusinessDate',     // As Of Business Date
    1: 'accountNumber',        // Account Number
    2: 'accountName',          // Account Name
    3: 'symbol',               // Symbol
    4: 'securityType',         // Security Type
    5: 'securityDescription',  // Security Description
    6: 'accountingRuleCode',   // Accounting Rule Code
    7: 'numberOfShares',       // Number of Shares
    8: 'longShort',            // Long/Short
    9: 'price',                // Price
    10: 'dateOfPrice',         // Date of Price
    11: 'marketValue',         // Market Value
  },
} as const;

// Field Types Configuration
export const FIELD_TYPES = {
  NUMERIC_FIELDS: {
    BALANCE: [
      'netMarketValue', 'portfolioValue', 'marketValueShort', 'totalCash',
      'cashAccountBalanceNetCreditOrDebit', 'cashAccountBalanceNetMarketValue', 'cashAccountBalanceMoneyMarketFunds',
      'equityPercentage', 'optionRequirements', 'monthEndDivPayout',
      'marginAccountBalanceCreditOrDebit', 'marginAccountBalanceMarketValueLong', 'marginAccountBalanceMarketValueShort',
      'marginAccountBalanceEquityIncludingOptions', 'marginAccountBalanceMarginCashAvailable', 'marginAccountBalanceEquityExcludingOptions',
      'marginBuyingPower', 'mtdMarginInterest'
    ],
    POSITIONS: ['numberOfShares', 'price', 'marketValue'],
  },
  DATE_FIELDS: ['asOfBusinessDate', 'dateOfPrice'],
  TEXT_FIELDS: ['accountNumber', 'accountName', 'symbol', 'securityType', 'securityDescription', 'accountingRuleCode', 'longShort'],
} as const;

// UI Configuration
export const UI_CONFIG = {
  // Color scheme for different states
  COLORS: {
    SUCCESS: '#e8f5e9',
    WARNING: '#fff8e1',
    ERROR: '#ffebee',
    INFO: '#e3f2fd',
    NEUTRAL: '#f5f5f5',
  },

  // Grid and layout
  GRID_COLUMNS: '1fr 1fr',
  MAX_CONTAINER_WIDTH: '1400px',

  // Animation and timing
  DEBOUNCE_MS: 300,
} as const;

// Fee Calculation Configuration (for future implementation)
export const FEE_CONFIG = {
  // Default fee rates by account type
  DEFAULT_RATES: {
    STANDARD: 0.01,        // 1%
    PREMIUM: 0.0075,       // 0.75%
    INSTITUTIONAL: 0.005,  // 0.5%
  },

  // Fee calculation periods
  BILLING_PERIODS: {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    ANNUALLY: 'annually',
  },

  // Minimum fees
  MINIMUM_FEES: {
    ACCOUNT_MIN: 100,
    QUARTERLY_MIN: 250,
  },
} as const;

// Export all configurations as a single object for easier importing
export const APP_CONFIG = {
  FILE: FILE_CONFIG,
  VALIDATION: VALIDATION_CONFIG,
  COLUMNS: COLUMN_MAPPINGS,
  FIELDS: FIELD_TYPES,
  UI: UI_CONFIG,
  FEES: FEE_CONFIG,
} as const;