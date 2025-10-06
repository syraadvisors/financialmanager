// Household types for the fee management system

export enum HouseholdStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export enum BillingAggregationLevel {
  ACCOUNT = 'Account',           // Bill each account separately
  HOUSEHOLD = 'Household',        // Aggregate all household accounts
  RELATIONSHIP = 'Relationship'   // Aggregate at relationship level
}

export interface Household {
  // System Fields
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Basic Information
  householdName: string;
  householdStatus: HouseholdStatus;

  // Relationship Assignment
  relationshipId?: string;
  relationshipName?: string;

  // Members (accounts that belong to this household)
  memberAccountIds: string[];
  memberAccountNames?: string[]; // Computed for display

  // Primary Contact (which client is the primary contact for this household)
  primaryClientId?: string;
  primaryClientName?: string;

  // Client associations (derived from member accounts)
  associatedClientIds?: string[]; // Computed from accounts
  associatedClientNames?: string[]; // Computed for display

  // Fee Configuration
  feeScheduleId?: string;
  feeScheduleName?: string;
  billingAggregationLevel: BillingAggregationLevel;
  customFeeAdjustment?: number; // percentage adjustment

  // Address Information
  mailingAddress?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Metadata
  notes?: string;
  establishedDate?: Date;
  lastReviewDate?: Date;

  // Calculated/Display Fields (computed, not stored)
  numberOfAccounts?: number;
  totalAUM?: number;
  totalAnnualFees?: number;
  numberOfClients?: number;
}

export interface HouseholdFormData extends Omit<Household, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}
