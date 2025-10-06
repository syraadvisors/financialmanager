export type FeeScheduleStatus = 'active' | 'inactive';

export type FeeStructureType = 'tiered' | 'flat_rate' | 'flat_fee';

export type FeeScheduleTag = 'tiered' | 'flat' | 'custom' | 'direct_bill' | 'minimum_fee';

export interface FeeTier {
  minAmount: number;
  maxAmount: number | null; // null means "and up"
  rate: number; // stored as decimal (e.g., 1.25% = 0.0125)
}

export interface FeeScheduleCategory {
  id: string;
  name: string;
  status: FeeScheduleStatus;
  description?: string;
  color?: string;
  displayOrder: number;
  createdDate: string;
}

export interface FeeSchedule {
  id: string;
  code: string;
  name: string;
  status: FeeScheduleStatus;
  categoryId?: string; // Link to custom category
  structureType: FeeStructureType;
  tags: FeeScheduleTag[]; // Multiple tags for classification
  tiers?: FeeTier[]; // For tiered fee structures
  flatRate?: number; // For flat percentage rates
  flatFeePerQuarter?: number; // For flat dollar fees
  minimumFeePerYear?: number;
  hasMinimumFee: boolean;
  description: string;
  createdDate: string;
  lastModifiedDate: string;
  isDirectBill?: boolean;
}
