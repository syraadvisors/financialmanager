// Fee Schedule Management Utilities
// Helper functions for creating, validating, and managing fee schedules

import {
  FeeSchedule,
  FeeTier,
  FundExclusion,
  FeeAdjustment,
  BillingPeriod,
  Client,
  FEE_CONSTANTS,
  FeeScheduleFormData
} from '../types/FeeTypes';

export class FeeScheduleManager {

  // Create fee schedule from your existing data format
  public static createFromLegacyData(data: {
    fee_code: string;
    flat_percent?: number;
    flat_amount?: number;
    tier1_percent?: number;
    tier1_limit?: number;
    tier1_amount?: number;
    tier2_percent?: number;
    tier2_limit?: number;
    tier2_amount?: number;
    tier3_percent?: number;
    tier3_limit?: number;
    tier3_amount?: number;
    tier4_percent?: number;
    tier4_limit?: number;
    tier4_amount?: number;
    tier5_percent?: number;
    tier5_limit?: number;
    tier5_amount?: number;
  }): FeeSchedule {
    const id = `fee-schedule-${data.fee_code}`;
    const feeCode = data.fee_code.toString();

    // Determine fee type
    let feeType: FeeSchedule['feeType'] = 'no_fee';
    if (data.flat_percent && data.flat_percent > 0) {
      feeType = 'flat_percent';
    } else if (data.flat_amount && data.flat_amount > 0) {
      feeType = 'flat_amount';
    } else if (data.tier1_percent && data.tier1_percent > 0) {
      feeType = 'tiered';
    }

    // Build tiers array
    const tiers: FeeTier[] = [];

    if (feeType === 'tiered') {
      // Add tiers in order, stopping when we hit zero percentages
      const tierData = [
        { percentage: data.tier1_percent, limit: data.tier1_limit, maxAmount: data.tier1_amount },
        { percentage: data.tier2_percent, limit: data.tier2_limit, maxAmount: data.tier2_amount },
        { percentage: data.tier3_percent, limit: data.tier3_limit, maxAmount: data.tier3_amount },
        { percentage: data.tier4_percent, limit: data.tier4_limit, maxAmount: data.tier4_amount },
        { percentage: data.tier5_percent, limit: data.tier5_limit, maxAmount: data.tier5_amount },
      ];

      for (const tier of tierData) {
        if (tier.percentage && tier.percentage > 0) {
          tiers.push({
            percentage: tier.percentage,
            limit: tier.limit || Infinity,
            maxAmount: tier.maxAmount || 0
          });
        } else {
          break; // Stop at first zero/undefined percentage
        }
      }
    }

    return {
      id,
      feeCode,
      name: `Fee Schedule ${feeCode}`,
      feeType,
      flatPercent: feeType === 'flat_percent' ? data.flat_percent : undefined,
      flatAmount: feeType === 'flat_amount' ? data.flat_amount : undefined,
      tiers,
      fundExclusions: [],
      adjustments: [],
      effectiveDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Validate fee schedule
  public static validateFeeSchedule(feeSchedule: FeeScheduleFormData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!feeSchedule.feeCode?.trim()) {
      errors.push('Fee code is required');
    }

    if (!feeSchedule.name?.trim()) {
      errors.push('Fee schedule name is required');
    }

    // Fee type specific validation
    switch (feeSchedule.feeType) {
      case 'flat_percent':
        if (!feeSchedule.flatPercent || feeSchedule.flatPercent < 0) {
          errors.push('Flat percentage must be greater than 0');
        } else if (feeSchedule.flatPercent > FEE_CONSTANTS.MAX_PERCENTAGE) {
          errors.push(`Flat percentage cannot exceed ${FEE_CONSTANTS.MAX_PERCENTAGE * 100}%`);
        }
        break;

      case 'flat_amount':
        if (!feeSchedule.flatAmount || feeSchedule.flatAmount < 0) {
          errors.push('Flat amount must be greater than 0');
        } else if (feeSchedule.flatAmount > FEE_CONSTANTS.MAX_FEE_AMOUNT) {
          errors.push(`Flat amount cannot exceed $${FEE_CONSTANTS.MAX_FEE_AMOUNT.toLocaleString()}`);
        }
        break;

      case 'tiered':
        if (!feeSchedule.tiers || feeSchedule.tiers.length === 0) {
          errors.push('Tiered fee schedule must have at least one tier');
        } else {
          this.validateTiers(feeSchedule.tiers, errors, warnings);
        }
        break;
    }

    // Validate minimum/maximum fees
    if (feeSchedule.minimumFee !== undefined && feeSchedule.minimumFee < 0) {
      errors.push('Minimum fee cannot be negative');
    }

    if (feeSchedule.maximumFee !== undefined && feeSchedule.maximumFee < 0) {
      errors.push('Maximum fee cannot be negative');
    }

    if (feeSchedule.minimumFee !== undefined &&
        feeSchedule.maximumFee !== undefined &&
        feeSchedule.minimumFee > feeSchedule.maximumFee) {
      errors.push('Minimum fee cannot be greater than maximum fee');
    }

    // Validate effective date
    if (feeSchedule.effectiveDate && feeSchedule.endDate &&
        feeSchedule.effectiveDate > feeSchedule.endDate) {
      errors.push('Effective date cannot be after end date');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Validate tier structure
  private static validateTiers(tiers: FeeTier[], errors: string[], warnings: string[]): void {
    if (tiers.length > FEE_CONSTANTS.MAX_TIERS) {
      errors.push(`Cannot have more than ${FEE_CONSTANTS.MAX_TIERS} tiers`);
    }

    let previousLimit = 0;

    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      const tierNumber = i + 1;

      // Validate percentage
      if (tier.percentage < FEE_CONSTANTS.MIN_PERCENTAGE) {
        errors.push(`Tier ${tierNumber} percentage cannot be negative`);
      }

      if (tier.percentage > FEE_CONSTANTS.MAX_PERCENTAGE) {
        errors.push(`Tier ${tierNumber} percentage cannot exceed ${FEE_CONSTANTS.MAX_PERCENTAGE * 100}%`);
      }

      // Validate limit progression
      if (tier.limit !== Infinity && tier.limit <= previousLimit) {
        errors.push(`Tier ${tierNumber} limit must be greater than previous tier limit`);
      }

      // Validate max amount
      if (tier.maxAmount < 0) {
        errors.push(`Tier ${tierNumber} max amount cannot be negative`);
      }

      previousLimit = tier.limit;

      // Warnings for potential issues
      if (i > 0 && tier.percentage > tiers[i - 1].percentage) {
        warnings.push(`Tier ${tierNumber} has higher percentage than previous tier - this is unusual`);
      }
    }

    // Check that final tier has no limit (or very high limit)
    const finalTier = tiers[tiers.length - 1];
    if (finalTier && finalTier.limit !== Infinity && finalTier.limit < 10000000) {
      warnings.push('Final tier should typically have no limit (infinity) to handle all portfolio sizes');
    }
  }

  // Create standard fund exclusions
  public static createStandardExclusions(): FundExclusion[] {
    return [
      {
        id: 'exclude-cash',
        type: 'symbol',
        value: 'CASH',
        matchType: 'exact',
        isActive: true,
        description: 'Exclude cash positions from fee calculation'
      },
      {
        id: 'exclude-swvxx',
        type: 'symbol',
        value: 'SWVXX',
        matchType: 'exact',
        isActive: true,
        description: 'Exclude Schwab money market fund'
      },
      {
        id: 'exclude-money-market',
        type: 'security_type',
        value: 'MONEY MARKET',
        matchType: 'contains',
        isActive: false,
        description: 'Exclude all money market funds'
      }
    ];
  }

  // Create common fee adjustments
  public static createStandardAdjustments(): FeeAdjustment[] {
    return [
      {
        id: 'family-discount',
        name: 'Family Account Discount',
        type: 'credit',
        adjustmentMethod: 'percentage',
        value: 0.1, // 10% discount
        applyTo: 'calculated_fee',
        isActive: false,
        description: '10% discount for family accounts'
      },
      {
        id: 'small-account-credit',
        name: 'Small Account Credit',
        type: 'credit',
        adjustmentMethod: 'fixed_amount',
        value: 100, // $100 credit
        applyTo: 'calculated_fee',
        conditions: [{
          field: 'portfolio_value',
          operator: 'lt',
          value: 50000
        }],
        isActive: false,
        description: '$100 credit for accounts under $50,000'
      }
    ];
  }

  // Calculate theoretical fee for testing
  public static calculateTheoreticalFee(
    portfolioValue: number,
    feeSchedule: FeeSchedule,
    daysInPeriod: number = 91,
    daysInYear: number = 365
  ): {
    annualFee: number;
    proRatedFee: number;
    effectiveRate: number;
    tierBreakdown?: { tier: number; amount: number; rate: number; fee: number }[];
  } {
    let annualFee = 0;
    let tierBreakdown: { tier: number; amount: number; rate: number; fee: number }[] = [];

    if (feeSchedule.feeType === 'no_fee') {
      return { annualFee: 0, proRatedFee: 0, effectiveRate: 0 };
    }

    if (feeSchedule.feeType === 'flat_percent' && feeSchedule.flatPercent) {
      annualFee = portfolioValue * feeSchedule.flatPercent;
    } else if (feeSchedule.feeType === 'flat_amount' && feeSchedule.flatAmount) {
      annualFee = feeSchedule.flatAmount;
    } else if (feeSchedule.feeType === 'tiered') {
      let remainingValue = portfolioValue;
      let currentTierStart = 0;

      for (let i = 0; i < feeSchedule.tiers.length && remainingValue > 0; i++) {
        const tier = feeSchedule.tiers[i];
        const tierEnd = tier.limit === Infinity ? Infinity : tier.limit;
        const tierRange = tierEnd - currentTierStart;
        const applicableValue = Math.min(remainingValue, tierRange);

        if (applicableValue > 0) {
          const tierFee = applicableValue * tier.percentage;
          annualFee += tierFee;

          tierBreakdown.push({
            tier: i + 1,
            amount: applicableValue,
            rate: tier.percentage,
            fee: tierFee
          });

          remainingValue -= applicableValue;
          currentTierStart = tierEnd;
        }
      }
    }

    const proRationFactor = daysInPeriod / daysInYear;
    const proRatedFee = annualFee * proRationFactor;
    const effectiveRate = portfolioValue > 0 ? annualFee / portfolioValue : 0;

    return {
      annualFee,
      proRatedFee,
      effectiveRate,
      tierBreakdown: tierBreakdown.length > 0 ? tierBreakdown : undefined
    };
  }
}

// Billing Period Management
export class BillingPeriodManager {

  // Create quarterly billing periods for a year
  public static createQuarterlyPeriods(year: number): BillingPeriod[] {
    const periods: BillingPeriod[] = [];
    const daysInYear = this.isLeapYear(year) ? 366 : 365;

    const quarters = [
      { name: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31) },
      { name: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30) },
      { name: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30) },
      { name: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31) }
    ];

    for (const quarter of quarters) {
      const daysInPeriod = this.calculateDaysBetween(quarter.start, quarter.end) + 1; // Include both start and end dates

      periods.push({
        id: `${year}-${quarter.name}`,
        name: `${quarter.name} ${year}`,
        startDate: quarter.start,
        endDate: quarter.end,
        daysInPeriod,
        daysInYear,
        billingFrequency: 'quarterly',
        asOfDate: quarter.end // Use end date as valuation date
      });
    }

    return periods;
  }

  // Create monthly billing periods for a year
  public static createMonthlyPeriods(year: number): BillingPeriod[] {
    const periods: BillingPeriod[] = [];
    const daysInYear = this.isLeapYear(year) ? 366 : 365;

    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0); // Last day of month
      const daysInPeriod = end.getDate();

      periods.push({
        id: `${year}-${String(month + 1).padStart(2, '0')}`,
        name: `${start.toLocaleDateString('en-US', { month: 'long' })} ${year}`,
        startDate: start,
        endDate: end,
        daysInPeriod,
        daysInYear,
        billingFrequency: 'monthly',
        asOfDate: end
      });
    }

    return periods;
  }

  // Create custom billing period
  public static createCustomPeriod(
    name: string,
    startDate: Date,
    endDate: Date,
    billingFrequency: 'monthly' | 'quarterly' | 'annually',
    asOfDate?: Date
  ): BillingPeriod {
    const year = endDate.getFullYear();
    const daysInYear = this.isLeapYear(year) ? 366 : 365;
    const daysInPeriod = this.calculateDaysBetween(startDate, endDate) + 1;

    return {
      id: `custom-${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`,
      name,
      startDate,
      endDate,
      daysInPeriod,
      daysInYear,
      billingFrequency,
      asOfDate: asOfDate || endDate
    };
  }

  // Utility methods
  private static isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }

  private static calculateDaysBetween(start: Date, end: Date): number {
    const timeDifference = end.getTime() - start.getTime();
    return Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  }

  // Get current quarter
  public static getCurrentQuarter(date: Date = new Date()): BillingPeriod {
    const year = date.getFullYear();
    const month = date.getMonth();
    const quarters = this.createQuarterlyPeriods(year);

    return quarters.find(q =>
      date >= q.startDate && date <= q.endDate
    ) || quarters[Math.floor(month / 3)];
  }

  // Get previous quarter
  public static getPreviousQuarter(date: Date = new Date()): BillingPeriod {
    const currentQuarter = this.getCurrentQuarter(date);
    const year = currentQuarter.startDate.getFullYear();
    const quarterNumber = parseInt(currentQuarter.name.charAt(1));

    if (quarterNumber === 1) {
      // Previous year Q4
      const previousYearQuarters = this.createQuarterlyPeriods(year - 1);
      return previousYearQuarters[3]; // Q4
    } else {
      // Same year, previous quarter
      const currentYearQuarters = this.createQuarterlyPeriods(year);
      return currentYearQuarters[quarterNumber - 2];
    }
  }
}

// Default client for testing
export const createDefaultClient = (): Client => ({
  id: 'default-client',
  name: 'Default Client',
  feeScheduleId: 'fee-schedule-0', // 0.25% flat
  billingFrequency: 'quarterly',
  accountFeeScheduleOverrides: [],
  clientAdjustments: [],
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});