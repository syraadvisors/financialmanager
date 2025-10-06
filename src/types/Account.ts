// Account types for the fee management system

export enum AccountStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
  PENDING = 'Pending',
  CLOSED = 'Closed'
}

export enum AccountType {
  INDIVIDUAL = 'Individual',
  JOINT = 'Joint',
  IRA_TRADITIONAL = 'IRA Traditional',
  IRA_ROTH = 'IRA Roth',
  TRUST = 'Trust',
  CORPORATE = 'Corporate',
  PARTNERSHIP = 'Partnership',
  LLC = 'LLC',
  ESTATE = 'Estate',
  CUSTODIAL = 'Custodial',
  OTHER = 'Other'
}

export enum ReconciliationStatus {
  MATCHED = 'Matched',           // Account exists in both custodian data and client profiles
  NEW_ACCOUNT = 'New Account',   // In custodian data but not in any client profile
  DELINKED = 'Delinked',         // In client profile but not in custodian data
  PENDING_LINK = 'Pending Link'  // Manually created, awaiting custodian data
}

export interface Account {
  // System Fields
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Account Identification (from Custodian)
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  accountStatus: AccountStatus;

  // Client Relationship (application-managed)
  clientId?: string;
  clientName?: string;
  householdId?: string;
  householdName?: string;
  masterAccountId?: string;

  // Custodian Data
  custodianAccountId?: string;
  registrationName?: string;
  taxId?: string;
  openDate?: Date;
  closeDate?: Date;

  // Fee Configuration (application-managed)
  feeScheduleId?: string;
  feeScheduleName?: string;
  customFeeRate?: number;
  feeExclusions?: string[]; // List of asset types to exclude from fees
  minimumFee?: number;

  // Financial Data (from Custodian - latest import)
  currentBalance?: number;
  lastImportDate?: Date;
  lastStatementDate?: Date;

  // Reconciliation Status
  reconciliationStatus: ReconciliationStatus;
  lastReconciledDate?: Date;
  reconciliationNotes?: string;

  // Additional Fields
  notes?: string;
  isExcludedFromBilling: boolean;
  billingOverride?: string;
}

export interface AccountFormData extends Omit<Account, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}

export interface AccountMismatch {
  type: 'new_account' | 'delinked';
  accountNumber: string;
  accountName: string;
  clientName?: string;
  currentBalance?: number;
  lastSeen?: Date;
  details: string;
}
