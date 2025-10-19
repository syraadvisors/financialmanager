/**
 * Fee Exception Types
 * Used to define exceptions and adjustments to standard fee calculations
 * within a Billing Fee Agreement
 */

export enum FeeExceptionType {
  MINIMUM_FEE = 'Minimum Fee',
  MAXIMUM_FEE = 'Maximum Fee',
  DEBIT_AMOUNT = 'Debit Amount',
  CREDIT_AMOUNT = 'Credit Amount',
  PREMIUM_PERCENTAGE = 'Premium Percentage',
  DISCOUNT_PERCENTAGE = 'Discount Percentage',
  FUND_EXCLUSION = 'Fund Exclusion',
  DOLLAR_AMOUNT_EXCLUSION = 'Dollar Amount Exclusion'
}

export enum FeeExceptionStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  EXPIRED = 'Expired'
}

export interface FeeException {
  id: string;
  firmId: string;
  createdAt: Date;
  updatedAt: Date;

  // Parent billing fee agreement
  billingFeeAgreementId: string;
  agreementNumber?: string; // For display purposes

  // Exception details
  exceptionType: FeeExceptionType;
  status: FeeExceptionStatus;

  // Scope - which accounts does this exception apply to?
  // Empty array means applies to all accounts in the agreement
  accountIds: string[];
  accountNumbers?: string[]; // For display purposes
  accountNames?: string[]; // For display purposes

  // Minimum/Maximum Fee
  minimumFeeAmount?: number;
  maximumFeeAmount?: number;

  // Debit/Credit adjustments
  debitAmount?: number;
  creditAmount?: number;

  // Premium/Discount percentages
  premiumPercentage?: number; // e.g., 10 means +10% fee
  discountPercentage?: number; // e.g., 15 means -15% fee

  // Fund exclusions - specific securities to exclude from billable value
  // Array of ticker symbols (e.g., ['VFIAX', 'FXAIX'])
  excludedFundTickers?: string[];

  // Dollar amount exclusions - specific dollar amounts to hold out
  excludedDollarAmount?: number;

  // Effective dates
  effectiveDate: Date;
  expirationDate?: Date;

  // Notes and documentation
  description?: string;
  notes?: string;
  internalNotes?: string;

  // Metadata
  createdByUserId?: string;
  createdByUserName?: string;
  lastModifiedByUserId?: string;
  lastModifiedByUserName?: string;
}

export interface FeeExceptionFormData {
  exceptionType: FeeExceptionType;
  status: FeeExceptionStatus;
  accountIds: string[];
  minimumFeeAmount?: number;
  maximumFeeAmount?: number;
  debitAmount?: number;
  creditAmount?: number;
  premiumPercentage?: number;
  discountPercentage?: number;
  excludedFundTickers?: string[];
  excludedDollarAmount?: number;
  effectiveDate: Date;
  expirationDate?: Date;
  description?: string;
  notes?: string;
  internalNotes?: string;
}

export interface FeeExceptionSummary {
  id: string;
  billingFeeAgreementId: string;
  agreementNumber: string;
  exceptionType: FeeExceptionType;
  status: FeeExceptionStatus;
  accountCount: number;
  effectiveDate: Date;
  expirationDate?: Date;
  description?: string;
}
