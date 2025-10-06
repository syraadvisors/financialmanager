// Relationship types for the fee management system

export enum RelationshipStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive'
}

export interface Relationship {
  // System Fields
  id: string;
  createdAt: Date;
  updatedAt: Date;

  // Basic Information
  relationshipName: string;
  relationshipStatus: RelationshipStatus;

  // Members (households that belong to this relationship)
  memberHouseholdIds: string[];
  memberHouseholdNames?: string[]; // Computed for display

  // Primary Contact
  primaryContactClientId?: string;
  primaryContactClientName?: string;

  // Fee Configuration
  feeScheduleId?: string;
  feeScheduleName?: string;
  customFeeAdjustment?: number; // percentage adjustment

  // Metadata
  notes?: string;
  establishedDate?: Date;
  lastReviewDate?: Date;

  // Calculated/Display Fields (computed, not stored)
  numberOfHouseholds?: number;
  numberOfAccounts?: number;
  totalAUM?: number;
  totalAnnualFees?: number;
  numberOfClients?: number;
}

export interface RelationshipFormData extends Omit<Relationship, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}
