// Fee Calculation System Types
// Based on the existing fee schedule structure with marginal calculation method

export interface FeeTier {
  percentage: number;      // Annual percentage rate (e.g., 0.01 = 1%)
  limit: number;          // Upper limit for this tier (e.g., 249999.99)
  maxAmount: number;      // Maximum fee amount for this tier
}

export interface FeeSchedule {
  id: string;
  feeCode: string;        // Matches your fee_code system (0, 1, 2, etc.)
  name: string;           // Descriptive name for the fee schedule
  feeType: 'flat_percent' | 'flat_amount' | 'tiered' | 'no_fee';

  // For flat percentage fees
  flatPercent?: number;   // Annual percentage rate

  // For flat amount fees
  flatAmount?: number;    // Fixed annual fee amount

  // For tiered fees (up to 5 tiers matching your current system)
  tiers: FeeTier[];       // Array of fee tiers (marginal calculation)

  // Fee limits
  minimumFee?: number;    // Minimum quarterly/annual fee
  maximumFee?: number;    // Maximum quarterly/annual fee

  // Fund exclusions
  fundExclusions: FundExclusion[];

  // Adjustments (credits and debits)
  adjustments: FeeAdjustment[];

  // Metadata
  effectiveDate: Date;
  endDate?: Date;
  isActive: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundExclusion {
  id: string;
  type: 'symbol' | 'security_type' | 'security_description' | 'custom';
  value: string;          // The symbol/type/description to match (e.g., "CASH", "SWVXX")
  matchType: 'exact' | 'contains' | 'starts_with' | 'ends_with';
  isActive: boolean;
  description?: string;
}

export interface FeeAdjustment {
  id: string;
  name: string;
  type: 'credit' | 'debit';
  adjustmentMethod: 'fixed_amount' | 'percentage';
  value: number;          // Dollar amount or percentage (e.g., 0.001 = 0.1%)
  applyTo: 'calculated_fee' | 'billable_value' | 'total_portfolio_value';
  conditions?: AdjustmentCondition[];
  isActive: boolean;
  description?: string;
}

export interface AdjustmentCondition {
  field: 'portfolio_value' | 'calculated_fee' | 'account_count' | 'client_type';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'between';
  value: number | string;
  secondValue?: number;   // For 'between' operator
}

export interface BillingPeriod {
  id: string;
  name: string;           // e.g., "Q1 2024", "January 2024"
  startDate: Date;
  endDate: Date;
  daysInPeriod: number;   // Actual days in this billing period
  daysInYear: number;     // Days in the year (365 or 366)
  billingFrequency: 'monthly' | 'quarterly' | 'annually';
  asOfDate: Date;         // Date for portfolio valuation
}

export interface AccountFeeCalculation {
  accountNumber: string;
  accountName: string;
  clientId: string;

  // Portfolio values
  totalPortfolioValue: number;     // Total value including all positions
  excludedValue: number;           // Value of excluded funds
  billableValue: number;           // Value used for fee calculation

  // Excluded positions detail
  excludedPositions: ExcludedPosition[];

  // Fee calculation breakdown
  feeScheduleId: string;
  feeScheduleName: string;

  // Tier-by-tier breakdown (for tiered fees)
  tierBreakdown: TierCalculation[];

  // Base fee calculation
  annualFeeAmount: number;         // Before proration
  prorationFactor: number;         // (days in period / days in year)
  calculatedFee: number;           // After proration

  // Adjustments
  adjustmentDetails: AppliedAdjustment[];
  totalAdjustments: number;        // Net adjustments (credits are negative)

  // Final amounts
  finalFee: number;                // After all adjustments
  minimumFeeApplied: boolean;
  maximumFeeApplied: boolean;

  // Metadata
  calculationDate: Date;
  billingPeriod: BillingPeriod;
  notes?: string;
}

export interface ExcludedPosition {
  symbol: string;
  securityDescription: string;
  marketValue: number;
  exclusionReason: string;         // Which exclusion rule matched
  numberOfShares: number;
}

export interface TierCalculation {
  tierNumber: number;
  tierRate: number;                // Annual percentage rate
  tierLimit: number;               // Upper limit for this tier
  applicableValue: number;         // Amount of portfolio value in this tier
  annualFeeForTier: number;       // Fee for this tier before proration
  proRatedFeeForTier: number;     // Fee for this tier after proration
}

export interface AppliedAdjustment {
  adjustmentId: string;
  adjustmentName: string;
  type: 'credit' | 'debit';
  method: 'fixed_amount' | 'percentage';
  value: number;                   // Original adjustment value
  appliedAmount: number;           // Actual dollar amount applied
  description?: string;
}

export interface ClientFeeCalculation {
  clientId: string;
  clientName: string;
  billingPeriod: BillingPeriod;

  // Summary totals
  totalAccounts: number;
  totalPortfolioValue: number;
  totalExcludedValue: number;
  totalBillableValue: number;
  totalCalculatedFees: number;
  totalAdjustments: number;
  totalFinalFees: number;

  // Account-level details
  accountCalculations: AccountFeeCalculation[];

  // Client-level adjustments (if any)
  clientAdjustments: AppliedAdjustment[];

  // Metadata
  calculationDate: Date;
  calculatedBy?: string;
  status: 'draft' | 'calculated' | 'reviewed' | 'approved' | 'billed';
  notes?: string;
}

export interface FeeCalculationSummary {
  totalClients: number;
  totalAccounts: number;
  totalPortfolioValue: number;
  totalBillableValue: number;
  totalExcludedValue: number;
  totalFees: number;
  averageFeeRate: number;          // Total fees / total billable value

  // Breakdown by fee schedule
  feeScheduleBreakdown: {
    feeScheduleId: string;
    feeScheduleName: string;
    accountCount: number;
    totalBillableValue: number;
    totalFees: number;
    averageRate: number;
  }[];

  billingPeriod: BillingPeriod;
  calculationDate: Date;
}

// Client and Fee Schedule Assignment
export interface Client {
  id: string;
  name: string;
  clientCode?: string;             // Optional client identifier
  feeScheduleId: string;           // Default fee schedule
  billingFrequency: 'monthly' | 'quarterly' | 'annually';

  // Account-specific fee schedule overrides
  accountFeeScheduleOverrides: {
    accountNumber: string;
    feeScheduleId: string;
    effectiveDate: Date;
    endDate?: Date;
  }[];

  // Client-specific adjustments
  clientAdjustments: FeeAdjustment[];

  // Metadata
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  notes?: string;
}

// Validation and error handling
export interface FeeCalculationError {
  type: 'validation' | 'calculation' | 'data';
  code: string;
  message: string;
  accountNumber?: string;
  clientId?: string;
  field?: string;
  severity: 'error' | 'warning' | 'info';
}

export interface FeeCalculationResult {
  success: boolean;
  clientCalculations: ClientFeeCalculation[];
  summary: FeeCalculationSummary;
  errors: FeeCalculationError[];
  warnings: FeeCalculationError[];
  processingTime: number;          // Milliseconds
}

// Utility types for the UI
export type FeeScheduleFormData = Omit<FeeSchedule, 'id' | 'createdAt' | 'updatedAt'>;
export type ClientFormData = Omit<Client, 'id' | 'createdAt' | 'updatedAt'>;

// Constants for validation and calculations
export const FEE_CONSTANTS = {
  MAX_TIERS: 5,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 0.05,            // 5% maximum
  MIN_FEE_AMOUNT: 0,
  MAX_FEE_AMOUNT: 1000000,         // $1M maximum
  DAYS_IN_STANDARD_YEAR: 365,
  DAYS_IN_LEAP_YEAR: 366,
} as const;

export const DEFAULT_FEE_SCHEDULE: Partial<FeeSchedule> = {
  feeType: 'no_fee',
  tiers: [],
  fundExclusions: [],
  adjustments: [],
  isActive: true,
};