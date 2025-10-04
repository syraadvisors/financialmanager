// Client types for the fee management system

export enum TaxIdType {
  SSN = 'SSN',
  EIN = 'EIN',
  TRUST_ID = 'Trust ID',
  ITIN = 'ITIN',
  OTHER = 'Other'
}

export enum EntityType {
  INDIVIDUAL = 'Individual',
  JOINT = 'Joint',
  TRUST = 'Trust',
  LLC = 'LLC',
  CORPORATION = 'Corporation',
  PARTNERSHIP = 'Partnership',
  ESTATE = 'Estate',
  NON_PROFIT = 'Non-Profit',
  OTHER = 'Other'
}

export enum ClientStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PROSPECTIVE = 'Prospective',
  FORMER = 'Former'
}

export enum BillingFrequency {
  QUARTERLY = 'Quarterly',
  SEMI_ANNUAL = 'Semi-Annual',
  ANNUAL = 'Annual',
  MONTHLY = 'Monthly'
}

export enum BillingMethod {
  DEBIT_FROM_ACCOUNT = 'Debit from Account',
  INVOICE = 'Invoice',
  WIRE_TRANSFER = 'Wire Transfer',
  CHECK = 'Check'
}

export enum PreferredContactMethod {
  EMAIL = 'Email',
  PHONE = 'Phone',
  TEXT = 'Text',
  MAIL = 'Mail',
  IN_PERSON = 'In Person'
}

export enum RiskTolerance {
  CONSERVATIVE = 'Conservative',
  MODERATELY_CONSERVATIVE = 'Moderately Conservative',
  MODERATE = 'Moderate',
  MODERATELY_AGGRESSIVE = 'Moderately Aggressive',
  AGGRESSIVE = 'Aggressive'
}

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
}

export interface Client {
  // System Fields
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Basic Information (from Custodian)
  fullLegalName: string;
  taxIdType: TaxIdType;
  taxIdNumber: string;
  dateOfBirth?: Date;
  entityType: EntityType;

  // Contact Information (application-managed)
  primaryEmail?: string;
  secondaryEmail?: string;
  mobilePhone?: string;
  homePhone?: string;
  officePhone?: string;
  mailingAddress?: Address;
  physicalAddress?: Address;

  // Billing & Fee Information
  defaultFeeScheduleId?: string;
  billingFrequency: BillingFrequency;
  billingMethod: BillingMethod;
  feePaymentAccountId?: string;
  customFeeAdjustment?: number; // percentage adjustment (e.g., -10 for 10% discount)
  feeScheduleOverride?: string; // JSON string for complex overrides

  // Relationship Information
  primaryAdvisor?: string;
  clientStatus: ClientStatus;
  relationshipManager?: string;
  serviceTeam?: string;
  clientSinceDate?: Date;
  lastReviewDate?: Date;
  nextReviewDate?: Date;

  // Additional Details
  notes?: string;
  riskTolerance?: RiskTolerance;
  investmentObjectives?: string;
  reportingPreferences?: string;
  specialInstructions?: string;
  preferredContactMethod?: PreferredContactMethod;
  doNotContact: boolean;
  doNotEmail: boolean;
  doNotCall: boolean;

  // Calculated/Display Fields (computed, not stored)
  totalAUM?: number;
  numberOfAccounts?: number;
  numberOfHouseholds?: number;
  totalAnnualFees?: number;
  lastStatementDate?: Date;
  lastContactDate?: Date;
}

export interface ClientFormData extends Omit<Client, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}
