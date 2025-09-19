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
  // Balance file column positions (0-indexed)
  BALANCE_FILE: {
    0: 'asOfBusinessDate',   // Column 1
    1: 'accountNumber',      // Column 2
    2: 'accountName',        // Column 3
    4: 'portfolioValue',     // Column 5
    6: 'totalCash',          // Column 7
  },

  // Positions file column positions (0-indexed)
  POSITIONS_FILE: {
    0: 'asOfBusinessDate',
    1: 'accountNumber',
    2: 'accountName',
    3: 'symbol',
    4: 'securityType',
    5: 'securityDescription',
    6: 'accountingRuleCode',
    7: 'numberOfShares',
    8: 'longShort',
    9: 'price',
    10: 'dateOfPrice',
    11: 'marketValue',
  },
} as const;

// Field Types Configuration
export const FIELD_TYPES = {
  NUMERIC_FIELDS: {
    BALANCE: ['portfolioValue', 'totalCash'],
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