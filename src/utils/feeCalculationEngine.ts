// Fee Calculation Engine
// Implements marginal fee calculation with day-based proration, fund exclusions, and adjustments

import { AccountBalance, AccountPosition } from '../types/DataTypes';
import {
  FeeSchedule,
  BillingPeriod,
  AccountFeeCalculation,
  ClientFeeCalculation,
  FeeCalculationResult,
  FeeCalculationSummary,
  FeeCalculationError,
  ExcludedPosition,
  TierCalculation,
  AppliedAdjustment,
  Client,
  FEE_CONSTANTS
} from '../types/FeeTypes';

export class FeeCalculationEngine {
  private feeSchedules: Map<string, FeeSchedule> = new Map();
  private clients: Map<string, Client> = new Map();

  constructor() {
    this.initializeDefaultFeeSchedules();
  }

  // Initialize with fee schedules based on your provided data
  private initializeDefaultFeeSchedules(): void {
    // Add some example fee schedules based on your data
    this.addFeeSchedule(this.createFlatPercentFeeSchedule('0', 0.0025, 'Standard 0.25%'));
    this.addFeeSchedule(this.createFlatPercentFeeSchedule('1', 0.005, 'Standard 0.50%'));
    this.addFeeSchedule(this.createTieredFeeSchedule('5', 'Premium Tiered', [
      { percentage: 0.01, limit: 249999.99, maxAmount: 2500 },
      { percentage: 0.008, limit: 499999.99, maxAmount: 2000 },
      { percentage: 0.005, limit: 999999.99, maxAmount: 2500 },
      { percentage: 0.0025, limit: Infinity, maxAmount: 0 }
    ]));
  }

  // Fee Schedule Management
  public addFeeSchedule(feeSchedule: FeeSchedule): void {
    this.feeSchedules.set(feeSchedule.id, feeSchedule);
  }

  public getFeeSchedule(id: string): FeeSchedule | undefined {
    return this.feeSchedules.get(id);
  }

  public getAllFeeSchedules(): FeeSchedule[] {
    return Array.from(this.feeSchedules.values());
  }

  // Client Management
  public addClient(client: Client): void {
    this.clients.set(client.id, client);
  }

  public getClient(id: string): Client | undefined {
    return this.clients.get(id);
  }

  // Main fee calculation method
  public calculateFeesForPeriod(
    balanceData: AccountBalance[],
    positionsData: AccountPosition[],
    billingPeriod: BillingPeriod,
    clientId?: string
  ): FeeCalculationResult {
    const startTime = Date.now();
    const errors: FeeCalculationError[] = [];
    const warnings: FeeCalculationError[] = [];
    const clientCalculations: ClientFeeCalculation[] = [];

    try {
      // Group accounts by client (for now, assume one client if not specified)
      const accountGroups = this.groupAccountsByClient(balanceData, clientId);

      for (const [currentClientId, accounts] of Array.from(accountGroups.entries())) {
        const client = this.getClient(currentClientId);
        if (!client) {
          errors.push({
            type: 'validation',
            code: 'CLIENT_NOT_FOUND',
            message: `Client ${currentClientId} not found`,
            clientId: currentClientId,
            severity: 'error'
          });
          continue;
        }

        const clientCalculation = this.calculateFeesForClient(
          client,
          accounts,
          positionsData,
          billingPeriod,
          errors,
          warnings
        );

        clientCalculations.push(clientCalculation);
      }

      const summary = this.generateSummary(clientCalculations, billingPeriod);
      const processingTime = Date.now() - startTime;

      return {
        success: errors.length === 0,
        clientCalculations,
        summary,
        errors,
        warnings,
        processingTime
      };

    } catch (error: any) {
      errors.push({
        type: 'calculation',
        code: 'CALCULATION_ERROR',
        message: `Unexpected error: ${error.message}`,
        severity: 'error'
      });

      return {
        success: false,
        clientCalculations: [],
        summary: this.getEmptySummary(billingPeriod),
        errors,
        warnings,
        processingTime: Date.now() - startTime
      };
    }
  }

  // Calculate fees for a single client
  private calculateFeesForClient(
    client: Client,
    accounts: AccountBalance[],
    positionsData: AccountPosition[],
    billingPeriod: BillingPeriod,
    errors: FeeCalculationError[],
    warnings: FeeCalculationError[]
  ): ClientFeeCalculation {
    const accountCalculations: AccountFeeCalculation[] = [];
    let totalPortfolioValue = 0;
    let totalExcludedValue = 0;
    let totalBillableValue = 0;
    let totalCalculatedFees = 0;
    let totalAdjustments = 0;
    let totalFinalFees = 0;

    for (const account of accounts) {
      try {
        const accountCalculation = this.calculateFeesForAccount(
          client,
          account,
          positionsData,
          billingPeriod,
          errors,
          warnings
        );

        accountCalculations.push(accountCalculation);

        totalPortfolioValue += accountCalculation.totalPortfolioValue;
        totalExcludedValue += accountCalculation.excludedValue;
        totalBillableValue += accountCalculation.billableValue;
        totalCalculatedFees += accountCalculation.calculatedFee;
        totalAdjustments += accountCalculation.totalAdjustments;
        totalFinalFees += accountCalculation.finalFee;

      } catch (error: any) {
        errors.push({
          type: 'calculation',
          code: 'ACCOUNT_CALCULATION_ERROR',
          message: `Error calculating fees for account ${account.accountNumber}: ${error.message}`,
          accountNumber: account.accountNumber,
          clientId: client.id,
          severity: 'error'
        });
      }
    }

    return {
      clientId: client.id,
      clientName: client.name,
      billingPeriod,
      totalAccounts: accounts.length,
      totalPortfolioValue,
      totalExcludedValue,
      totalBillableValue,
      totalCalculatedFees,
      totalAdjustments,
      totalFinalFees,
      accountCalculations,
      clientAdjustments: [], // Client-level adjustments can be added later
      calculationDate: new Date(),
      status: 'calculated'
    };
  }

  // Calculate fees for a single account
  private calculateFeesForAccount(
    client: Client,
    account: AccountBalance,
    positionsData: AccountPosition[],
    billingPeriod: BillingPeriod,
    errors: FeeCalculationError[],
    warnings: FeeCalculationError[]
  ): AccountFeeCalculation {
    // Get the fee schedule for this account
    const feeScheduleId = this.getFeeScheduleForAccount(client, account.accountNumber);
    const feeSchedule = this.getFeeSchedule(feeScheduleId);

    if (!feeSchedule) {
      throw new Error(`Fee schedule ${feeScheduleId} not found for account ${account.accountNumber}`);
    }

    // Get positions for this account
    const accountPositions = positionsData.filter(p => p.accountNumber === account.accountNumber);

    // Calculate portfolio values with exclusions
    const portfolioAnalysis = this.analyzePortfolioValues(account, accountPositions, feeSchedule);

    // Calculate the base fee
    const feeCalculation = this.calculateBaseFee(portfolioAnalysis.billableValue, feeSchedule, billingPeriod);

    // Apply adjustments
    const adjustments = this.applyAdjustments(
      feeCalculation.calculatedFee,
      portfolioAnalysis.billableValue,
      portfolioAnalysis.totalPortfolioValue,
      feeSchedule,
      account
    );

    const totalAdjustments = adjustments.reduce((sum, adj) => sum + adj.appliedAmount, 0);
    let finalFee = feeCalculation.calculatedFee + totalAdjustments;

    // Apply minimum/maximum fee limits
    let minimumFeeApplied = false;
    let maximumFeeApplied = false;

    if (feeSchedule.minimumFee && finalFee < feeSchedule.minimumFee) {
      finalFee = feeSchedule.minimumFee;
      minimumFeeApplied = true;
    }

    if (feeSchedule.maximumFee && finalFee > feeSchedule.maximumFee) {
      finalFee = feeSchedule.maximumFee;
      maximumFeeApplied = true;
    }

    return {
      accountNumber: account.accountNumber,
      accountName: account.accountName,
      clientId: client.id,
      totalPortfolioValue: portfolioAnalysis.totalPortfolioValue,
      excludedValue: portfolioAnalysis.excludedValue,
      billableValue: portfolioAnalysis.billableValue,
      excludedPositions: portfolioAnalysis.excludedPositions,
      feeScheduleId: feeSchedule.id,
      feeScheduleName: feeSchedule.name,
      tierBreakdown: feeCalculation.tierBreakdown,
      annualFeeAmount: feeCalculation.annualFeeAmount,
      prorationFactor: feeCalculation.prorationFactor,
      calculatedFee: feeCalculation.calculatedFee,
      adjustmentDetails: adjustments,
      totalAdjustments,
      finalFee,
      minimumFeeApplied,
      maximumFeeApplied,
      calculationDate: new Date(),
      billingPeriod
    };
  }

  // Analyze portfolio values and apply fund exclusions
  private analyzePortfolioValues(
    account: AccountBalance,
    positions: AccountPosition[],
    feeSchedule: FeeSchedule
  ): {
    totalPortfolioValue: number;
    excludedValue: number;
    billableValue: number;
    excludedPositions: ExcludedPosition[];
  } {
    const totalPortfolioValue = account.portfolioValue;
    let excludedValue = 0;
    const excludedPositions: ExcludedPosition[] = [];

    // Apply fund exclusions
    for (const position of positions) {
      for (const exclusion of feeSchedule.fundExclusions) {
        if (!exclusion.isActive) continue;

        let shouldExclude = false;
        let matchValue = '';

        switch (exclusion.type) {
          case 'symbol':
            matchValue = position.symbol;
            break;
          case 'security_type':
            matchValue = position.securityType;
            break;
          case 'security_description':
            matchValue = position.securityDescription;
            break;
        }

        // Apply matching logic
        switch (exclusion.matchType) {
          case 'exact':
            shouldExclude = matchValue.toUpperCase() === exclusion.value.toUpperCase();
            break;
          case 'contains':
            shouldExclude = matchValue.toUpperCase().includes(exclusion.value.toUpperCase());
            break;
          case 'starts_with':
            shouldExclude = matchValue.toUpperCase().startsWith(exclusion.value.toUpperCase());
            break;
          case 'ends_with':
            shouldExclude = matchValue.toUpperCase().endsWith(exclusion.value.toUpperCase());
            break;
        }

        if (shouldExclude) {
          excludedValue += position.marketValue;
          excludedPositions.push({
            symbol: position.symbol,
            securityDescription: position.securityDescription,
            marketValue: position.marketValue,
            exclusionReason: `Excluded by rule: ${exclusion.value} (${exclusion.type})`,
            numberOfShares: position.numberOfShares
          });
          break; // Don't double-exclude the same position
        }
      }
    }

    const billableValue = totalPortfolioValue - excludedValue;

    return {
      totalPortfolioValue,
      excludedValue,
      billableValue: Math.max(0, billableValue), // Ensure non-negative
      excludedPositions
    };
  }

  // Calculate base fee using marginal calculation method
  private calculateBaseFee(
    billableValue: number,
    feeSchedule: FeeSchedule,
    billingPeriod: BillingPeriod
  ): {
    annualFeeAmount: number;
    prorationFactor: number;
    calculatedFee: number;
    tierBreakdown: TierCalculation[];
  } {
    let annualFeeAmount = 0;
    const tierBreakdown: TierCalculation[] = [];
    const prorationFactor = billingPeriod.daysInPeriod / billingPeriod.daysInYear;

    if (feeSchedule.feeType === 'no_fee') {
      return {
        annualFeeAmount: 0,
        prorationFactor,
        calculatedFee: 0,
        tierBreakdown: []
      };
    }

    if (feeSchedule.feeType === 'flat_percent' && feeSchedule.flatPercent) {
      annualFeeAmount = billableValue * feeSchedule.flatPercent;
    } else if (feeSchedule.feeType === 'flat_amount' && feeSchedule.flatAmount) {
      annualFeeAmount = feeSchedule.flatAmount;
    } else if (feeSchedule.feeType === 'tiered') {
      // Marginal calculation - each tier applies only to the amount within that range
      let remainingValue = billableValue;
      let currentTierStart = 0;

      for (let i = 0; i < feeSchedule.tiers.length && remainingValue > 0; i++) {
        const tier = feeSchedule.tiers[i];
        const tierEnd = tier.limit === Infinity ? Infinity : tier.limit;
        const tierRange = tierEnd - currentTierStart;
        const applicableValue = Math.min(remainingValue, tierRange);

        if (applicableValue > 0) {
          const annualFeeForTier = applicableValue * tier.percentage;
          const proRatedFeeForTier = annualFeeForTier * prorationFactor;

          tierBreakdown.push({
            tierNumber: i + 1,
            tierRate: tier.percentage,
            tierLimit: tier.limit,
            applicableValue,
            annualFeeForTier,
            proRatedFeeForTier
          });

          annualFeeAmount += annualFeeForTier;
          remainingValue -= applicableValue;
          currentTierStart = tierEnd;
        }
      }
    }

    const calculatedFee = annualFeeAmount * prorationFactor;

    return {
      annualFeeAmount,
      prorationFactor,
      calculatedFee,
      tierBreakdown
    };
  }

  // Apply fee adjustments (credits and debits)
  private applyAdjustments(
    calculatedFee: number,
    billableValue: number,
    totalPortfolioValue: number,
    feeSchedule: FeeSchedule,
    account: AccountBalance
  ): AppliedAdjustment[] {
    const appliedAdjustments: AppliedAdjustment[] = [];

    for (const adjustment of feeSchedule.adjustments) {
      if (!adjustment.isActive) continue;

      // Check if adjustment conditions are met
      if (adjustment.conditions && !this.evaluateAdjustmentConditions(adjustment.conditions, {
        portfolio_value: totalPortfolioValue,
        calculated_fee: calculatedFee,
        billable_value: billableValue
      })) {
        continue;
      }

      let appliedAmount = 0;

      if (adjustment.adjustmentMethod === 'fixed_amount') {
        appliedAmount = adjustment.value;
      } else if (adjustment.adjustmentMethod === 'percentage') {
        let baseAmount = 0;
        switch (adjustment.applyTo) {
          case 'calculated_fee':
            baseAmount = calculatedFee;
            break;
          case 'billable_value':
            baseAmount = billableValue;
            break;
          case 'total_portfolio_value':
            baseAmount = totalPortfolioValue;
            break;
        }
        appliedAmount = baseAmount * adjustment.value;
      }

      // Apply sign based on credit/debit
      if (adjustment.type === 'credit') {
        appliedAmount = -Math.abs(appliedAmount); // Credits are negative
      } else {
        appliedAmount = Math.abs(appliedAmount);  // Debits are positive
      }

      appliedAdjustments.push({
        adjustmentId: adjustment.id,
        adjustmentName: adjustment.name,
        type: adjustment.type,
        method: adjustment.adjustmentMethod,
        value: adjustment.value,
        appliedAmount,
        description: adjustment.description
      });
    }

    return appliedAdjustments;
  }

  // Utility methods
  private getFeeScheduleForAccount(client: Client, accountNumber: string): string {
    // Check for account-specific overrides
    const override = client.accountFeeScheduleOverrides.find(
      o => o.accountNumber === accountNumber &&
           new Date() >= o.effectiveDate &&
           (!o.endDate || new Date() <= o.endDate)
    );

    return override ? override.feeScheduleId : client.feeScheduleId;
  }

  private groupAccountsByClient(accounts: AccountBalance[], clientId?: string): Map<string, AccountBalance[]> {
    const groups = new Map<string, AccountBalance[]>();
    const defaultClientId = clientId || 'default-client';

    for (const account of accounts) {
      // For now, assign all accounts to the specified client or default
      // In production, you'd have logic to determine client from account data
      const accountClientId = defaultClientId;

      if (!groups.has(accountClientId)) {
        groups.set(accountClientId, []);
      }
      groups.get(accountClientId)!.push(account);
    }

    return groups;
  }

  private evaluateAdjustmentConditions(conditions: any[], values: Record<string, number>): boolean {
    return conditions.every(condition => {
      const fieldValue = values[condition.field];
      if (fieldValue === undefined) return false;

      switch (condition.operator) {
        case 'gt': return fieldValue > condition.value;
        case 'gte': return fieldValue >= condition.value;
        case 'lt': return fieldValue < condition.value;
        case 'lte': return fieldValue <= condition.value;
        case 'eq': return fieldValue === condition.value;
        case 'between':
          return condition.secondValue !== undefined &&
                 fieldValue >= condition.value &&
                 fieldValue <= condition.secondValue;
        default: return false;
      }
    });
  }

  private generateSummary(clientCalculations: ClientFeeCalculation[], billingPeriod: BillingPeriod): FeeCalculationSummary {
    const totalClients = clientCalculations.length;
    const totalAccounts = clientCalculations.reduce((sum, c) => sum + c.totalAccounts, 0);
    const totalPortfolioValue = clientCalculations.reduce((sum, c) => sum + c.totalPortfolioValue, 0);
    const totalBillableValue = clientCalculations.reduce((sum, c) => sum + c.totalBillableValue, 0);
    const totalExcludedValue = clientCalculations.reduce((sum, c) => sum + c.totalExcludedValue, 0);
    const totalFees = clientCalculations.reduce((sum, c) => sum + c.totalFinalFees, 0);
    const averageFeeRate = totalBillableValue > 0 ? totalFees / totalBillableValue : 0;

    // Generate fee schedule breakdown
    const feeScheduleMap = new Map<string, {
      feeScheduleName: string;
      accountCount: number;
      totalBillableValue: number;
      totalFees: number;
    }>();

    for (const client of clientCalculations) {
      for (const account of client.accountCalculations) {
        const key = account.feeScheduleId;
        if (!feeScheduleMap.has(key)) {
          feeScheduleMap.set(key, {
            feeScheduleName: account.feeScheduleName,
            accountCount: 0,
            totalBillableValue: 0,
            totalFees: 0
          });
        }

        const breakdown = feeScheduleMap.get(key)!;
        breakdown.accountCount++;
        breakdown.totalBillableValue += account.billableValue;
        breakdown.totalFees += account.finalFee;
      }
    }

    const feeScheduleBreakdown = Array.from(feeScheduleMap.entries()).map(([feeScheduleId, data]) => ({
      feeScheduleId,
      feeScheduleName: data.feeScheduleName,
      accountCount: data.accountCount,
      totalBillableValue: data.totalBillableValue,
      totalFees: data.totalFees,
      averageRate: data.totalBillableValue > 0 ? data.totalFees / data.totalBillableValue : 0
    }));

    return {
      totalClients,
      totalAccounts,
      totalPortfolioValue,
      totalBillableValue,
      totalExcludedValue,
      totalFees,
      averageFeeRate,
      feeScheduleBreakdown,
      billingPeriod,
      calculationDate: new Date()
    };
  }

  private getEmptySummary(billingPeriod: BillingPeriod): FeeCalculationSummary {
    return {
      totalClients: 0,
      totalAccounts: 0,
      totalPortfolioValue: 0,
      totalBillableValue: 0,
      totalExcludedValue: 0,
      totalFees: 0,
      averageFeeRate: 0,
      feeScheduleBreakdown: [],
      billingPeriod,
      calculationDate: new Date()
    };
  }

  // Helper methods to create fee schedules based on your data
  private createFlatPercentFeeSchedule(feeCode: string, percentage: number, name: string): FeeSchedule {
    return {
      id: `fee-schedule-${feeCode}`,
      feeCode,
      name,
      feeType: 'flat_percent',
      flatPercent: percentage,
      tiers: [],
      fundExclusions: [],
      adjustments: [],
      effectiveDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private createTieredFeeSchedule(feeCode: string, name: string, tiers: { percentage: number; limit: number; maxAmount: number }[]): FeeSchedule {
    return {
      id: `fee-schedule-${feeCode}`,
      feeCode,
      name,
      feeType: 'tiered',
      tiers: tiers.map(tier => ({
        percentage: tier.percentage,
        limit: tier.limit,
        maxAmount: tier.maxAmount
      })),
      fundExclusions: [],
      adjustments: [],
      effectiveDate: new Date(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}