// Billing Fee Agreement types for the fee management system
// These agreements determine how fees are calculated and applied to accounts

export enum BillingFeeAgreementStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  TERMINATED = 'Terminated'
}

export enum BillingFrequency {
  QUARTERLY = 'Quarterly',
  SEMI_ANNUAL = 'Semi-Annual',
  ANNUAL = 'Annual',
  MONTHLY = 'Monthly'
}

export enum BillingMethod {
  ARREARS = 'Arrears',         // Bill after the period
  ADVANCE = 'Advance'          // Bill before the period
}

export interface BillingFeeAgreement {
  // System Fields
  id: string;
  firmId: string;
  createdAt: Date;
  updatedAt: Date;

  // Basic Information
  agreementNumber: string;  // Auto-generated (e.g., BFA-0001)
  status: BillingFeeAgreementStatus;

  // Fee Schedule
  feeScheduleId: string;
  feeScheduleCode?: string;  // Computed for display
  feeScheduleName?: string;  // Computed for display

  // Billing Configuration
  billingFrequency: BillingFrequency;
  billingMethod: BillingMethod;
  billingDay?: number;  // Day of month for billing (1-31)

  // Scope - What this agreement covers
  relationshipId?: string;
  relationshipName?: string;

  householdIds: string[];
  householdNames?: string[];  // Computed for display

  accountIds: string[];
  accountNumbers?: string[];  // Computed for display
  accountNames?: string[];    // Computed for display

  // Primary Contact
  primaryContactClientId?: string;
  primaryContactClientName?: string;

  // Fee Adjustments
  customFeeAdjustment?: number;      // Percentage adjustment (e.g., -10 for 10% discount)
  customFeeAdjustmentNotes?: string;

  // Agreement Dates
  effectiveDate: Date;
  terminationDate?: Date;
  nextBillingDate?: Date;
  lastBillingDate?: Date;

  // Metadata
  notes?: string;
  internalNotes?: string;

  // Calculated/Display Fields (computed, not stored)
  numberOfHouseholds?: number;
  numberOfAccounts?: number;
  totalAUM?: number;
  estimatedAnnualFees?: number;
  estimatedQuarterlyFees?: number;
}

export interface BillingFeeAgreementFormData extends Omit<BillingFeeAgreement, 'id' | 'firmId' | 'createdAt' | 'updatedAt'> {
  id?: string;
  firmId?: string;
}

// Summary view for listing
export interface BillingFeeAgreementSummary {
  id: string;
  agreementNumber: string;
  status: BillingFeeAgreementStatus;
  feeScheduleCode: string;
  feeScheduleName: string;
  relationshipName?: string;
  numberOfHouseholds: number;
  numberOfAccounts: number;
  totalAUM: number;
  estimatedAnnualFees: number;
  effectiveDate: Date;
  nextBillingDate?: Date;
}
