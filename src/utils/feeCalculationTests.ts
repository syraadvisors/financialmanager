// Fee Calculation Engine Tests
// Comprehensive test suite to validate fee calculations match your existing system

import { FeeCalculationEngine } from './feeCalculationEngine';
import { FeeScheduleManager, BillingPeriodManager, createDefaultClient } from './feeScheduleManager';
import { AccountBalance, AccountPosition } from '../types/DataTypes';
import { FeeSchedule, BillingPeriod, Client } from '../types/FeeTypes';

export class FeeCalculationTester {
  private engine: FeeCalculationEngine;

  constructor() {
    this.engine = new FeeCalculationEngine();
    this.setupTestData();
  }

  // Setup test data based on your fee schedule structure
  private setupTestData(): void {
    // Add your actual fee schedules
    const legacyFeeSchedules = [
      // Fee code 0: 0.25% flat
      { fee_code: '0', flat_percent: 0.0025 },

      // Fee code 1: 0.50% flat
      { fee_code: '1', flat_percent: 0.005 },

      // Fee code 5: Complex tiered structure
      {
        fee_code: '5',
        tier1_percent: 0.01, tier1_limit: 249999.99, tier1_amount: 2500,
        tier2_percent: 0.008, tier2_limit: 499999.99, tier2_amount: 2000,
        tier3_percent: 0.005, tier3_limit: 999999.99, tier3_amount: 2500,
        tier4_percent: 0.0025, tier4_limit: Infinity, tier4_amount: 0
      },

      // Fee code 17: 5-tier structure
      {
        fee_code: '17',
        tier1_percent: 0.0125, tier1_limit: 99999.99, tier1_amount: 1250,
        tier2_percent: 0.01, tier2_limit: 499999.99, tier2_amount: 4000,
        tier3_percent: 0.0075, tier3_limit: 999999.99, tier3_amount: 3750,
        tier4_percent: 0.005, tier4_limit: Infinity, tier4_amount: 0
      }
    ];

    // Convert to our fee schedule format
    for (const legacy of legacyFeeSchedules) {
      const feeSchedule = FeeScheduleManager.createFromLegacyData(legacy);
      this.engine.addFeeSchedule(feeSchedule);
    }

    // Add test client
    const testClient = createDefaultClient();
    this.engine.addClient(testClient);
  }

  // Run all tests
  public runAllTests(): {
    passed: number;
    failed: number;
    results: TestResult[];
  } {
    const tests = [
      () => this.testFlatPercentageCalculation(),
      () => this.testTieredCalculation(),
      () => this.testProrationCalculation(),
      () => this.testFundExclusions(),
      () => this.testMinMaxFees(),
      () => this.testComplexScenarios(),
      () => this.testEdgeCases(),
    ];

    const results: TestResult[] = [];
    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        const result = test();
        results.push(result);
        if (result.passed) {
          passed++;
        } else {
          failed++;
        }
      } catch (error: any) {
        results.push({
          testName: 'Unknown Test',
          passed: false,
          message: `Test threw exception: ${error.message}`,
          expected: 'No exception',
          actual: error.message
        });
        failed++;
      }
    }

    return { passed, failed, results };
  }

  // Test 1: Flat percentage calculation (fee codes 0, 1)
  private testFlatPercentageCalculation(): TestResult {
    const testName = 'Flat Percentage Calculation';

    // Create test data
    const account: AccountBalance = this.createTestAccount('12345678', 1000000); // $1M account
    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0]; // Q1 2024 (91 days)

    // Test 0.25% flat fee
    const client = createDefaultClient();
    client.feeScheduleId = 'fee-schedule-0';
    this.engine.addClient(client);

    const result = this.engine.calculateFeesForPeriod([account], [], billingPeriod, client.id);

    if (!result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculation',
        actual: result.errors.map(e => e.message).join(', ')
      };
    }

    // Expected: $1M * 0.25% * (91/365) = $621.92
    const expectedAnnualFee = 1000000 * 0.0025; // $2,500
    const expectedQuarterlyFee = expectedAnnualFee * (91 / 365); // $621.92
    const actualFee = result.clientCalculations[0].accountCalculations[0].finalFee;
    const tolerance = 0.01; // $0.01 tolerance

    const passed = Math.abs(actualFee - expectedQuarterlyFee) < tolerance;

    return {
      testName,
      passed,
      message: passed ? 'Flat percentage calculation correct' : 'Flat percentage calculation incorrect',
      expected: expectedQuarterlyFee.toFixed(2),
      actual: actualFee.toFixed(2)
    };
  }

  // Test 2: Tiered calculation (fee code 5)
  private testTieredCalculation(): TestResult {
    const testName = 'Tiered Fee Calculation';

    // Create test data - $1.5M account to test multiple tiers
    const account: AccountBalance = this.createTestAccount('12345679', 1500000);
    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0]; // Q1 2024 (91 days)

    const client = createDefaultClient();
    client.feeScheduleId = 'fee-schedule-5';
    this.engine.addClient(client);

    const result = this.engine.calculateFeesForPeriod([account], [], billingPeriod, client.id);

    if (!result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculation',
        actual: result.errors.map(e => e.message).join(', ')
      };
    }

    // Expected marginal calculation:
    // Tier 1: $250K * 1.0% = $2,500
    // Tier 2: $250K * 0.8% = $2,000
    // Tier 3: $500K * 0.5% = $2,500
    // Tier 4: $500K * 0.25% = $1,250
    // Total annual: $8,250
    // Quarterly: $8,250 * (91/365) = $2,057.53

    const expectedAnnualFee = 2500 + 2000 + 2500 + 1250; // $8,250
    const expectedQuarterlyFee = expectedAnnualFee * (91 / 365); // $2,057.53
    const actualFee = result.clientCalculations[0].accountCalculations[0].finalFee;
    const tolerance = 0.01;

    const passed = Math.abs(actualFee - expectedQuarterlyFee) < tolerance;

    return {
      testName,
      passed,
      message: passed ? 'Tiered calculation correct' : 'Tiered calculation incorrect',
      expected: expectedQuarterlyFee.toFixed(2),
      actual: actualFee.toFixed(2),
      details: result.clientCalculations[0].accountCalculations[0].tierBreakdown
    };
  }

  // Test 3: Proration calculation with different periods
  private testProrationCalculation(): TestResult {
    const testName = 'Proration Calculation';

    const account: AccountBalance = this.createTestAccount('12345680', 1000000);

    // Test different quarterly periods
    const q1Period = BillingPeriodManager.createQuarterlyPeriods(2024)[0]; // 91 days
    const q2Period = BillingPeriodManager.createQuarterlyPeriods(2024)[1]; // 91 days
    const q4Period = BillingPeriodManager.createQuarterlyPeriods(2024)[3]; // 92 days (leap year)

    const client = createDefaultClient();
    client.feeScheduleId = 'fee-schedule-0'; // 0.25% flat
    this.engine.addClient(client);

    const q1Result = this.engine.calculateFeesForPeriod([account], [], q1Period, client.id);
    const q4Result = this.engine.calculateFeesForPeriod([account], [], q4Period, client.id);

    if (!q1Result.success || !q4Result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculations',
        actual: 'One or more calculations failed'
      };
    }

    const q1Fee = q1Result.clientCalculations[0].accountCalculations[0].finalFee;
    const q4Fee = q4Result.clientCalculations[0].accountCalculations[0].finalFee;

    // Q4 should be slightly higher due to one extra day (92 vs 91 days)
    // Expected difference: $2,500 * (1/365) = $6.85
    const expectedDifference = 2500 * (1 / 366); // 2024 is leap year
    const actualDifference = q4Fee - q1Fee;
    const tolerance = 0.01;

    const passed = Math.abs(actualDifference - expectedDifference) < tolerance;

    return {
      testName,
      passed,
      message: passed ? 'Proration calculation correct' : 'Proration calculation incorrect',
      expected: expectedDifference.toFixed(2),
      actual: actualDifference.toFixed(2)
    };
  }

  // Test 4: Fund exclusions
  private testFundExclusions(): TestResult {
    const testName = 'Fund Exclusions';

    const account: AccountBalance = this.createTestAccount('12345681', 1000000);

    // Create positions with some that should be excluded
    const positions: AccountPosition[] = [
      this.createTestPosition('12345681', 'AAPL', 'Apple Inc', 500000),
      this.createTestPosition('12345681', 'CASH', 'Cash', 300000), // Should be excluded
      this.createTestPosition('12345681', 'SWVXX', 'Schwab Money Market', 200000) // Should be excluded
    ];

    // Create fee schedule with exclusions
    const feeSchedule = FeeScheduleManager.createFromLegacyData({ fee_code: '0', flat_percent: 0.0025 });
    feeSchedule.fundExclusions = FeeScheduleManager.createStandardExclusions();
    this.engine.addFeeSchedule(feeSchedule);

    const client = createDefaultClient();
    client.feeScheduleId = feeSchedule.id;
    this.engine.addClient(client);

    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0];
    const result = this.engine.calculateFeesForPeriod([account], positions, billingPeriod, client.id);

    if (!result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculation',
        actual: result.errors.map(e => e.message).join(', ')
      };
    }

    const calculation = result.clientCalculations[0].accountCalculations[0];

    // Should exclude $500K (CASH + SWVXX), leaving $500K billable
    const expectedBillableValue = 500000;
    const actualBillableValue = calculation.billableValue;
    const expectedExcludedValue = 500000;
    const actualExcludedValue = calculation.excludedValue;

    const billableCorrect = Math.abs(actualBillableValue - expectedBillableValue) < 0.01;
    const excludedCorrect = Math.abs(actualExcludedValue - expectedExcludedValue) < 0.01;
    const passed = billableCorrect && excludedCorrect;

    return {
      testName,
      passed,
      message: passed ? 'Fund exclusions working correctly' : 'Fund exclusions incorrect',
      expected: `Billable: ${expectedBillableValue}, Excluded: ${expectedExcludedValue}`,
      actual: `Billable: ${actualBillableValue}, Excluded: ${actualExcludedValue}`,
      details: calculation.excludedPositions
    };
  }

  // Test 5: Minimum and maximum fees
  private testMinMaxFees(): TestResult {
    const testName = 'Minimum/Maximum Fees';

    // Test minimum fee with small account
    const smallAccount: AccountBalance = this.createTestAccount('12345682', 10000); // $10K account

    // Create fee schedule with minimum fee
    const feeSchedule = FeeScheduleManager.createFromLegacyData({ fee_code: '0', flat_percent: 0.0025 });
    feeSchedule.minimumFee = 500; // $500 minimum quarterly fee
    this.engine.addFeeSchedule(feeSchedule);

    const client = createDefaultClient();
    client.feeScheduleId = feeSchedule.id;
    this.engine.addClient(client);

    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0];
    const result = this.engine.calculateFeesForPeriod([smallAccount], [], billingPeriod, client.id);

    if (!result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculation',
        actual: result.errors.map(e => e.message).join(', ')
      };
    }

    const calculation = result.clientCalculations[0].accountCalculations[0];

    // Calculated fee would be $10K * 0.25% * (91/365) = $6.22
    // But minimum is $500, so should use minimum
    const expectedFee = 500;
    const actualFee = calculation.finalFee;
    const passed = Math.abs(actualFee - expectedFee) < 0.01 && calculation.minimumFeeApplied;

    return {
      testName,
      passed,
      message: passed ? 'Minimum fee correctly applied' : 'Minimum fee not applied correctly',
      expected: expectedFee.toString(),
      actual: actualFee.toFixed(2)
    };
  }

  // Test 6: Complex scenarios
  private testComplexScenarios(): TestResult {
    const testName = 'Complex Multi-Account Scenario';

    // Multiple accounts with different sizes
    const accounts: AccountBalance[] = [
      this.createTestAccount('12345683', 500000),  // $500K
      this.createTestAccount('12345684', 1500000), // $1.5M
      this.createTestAccount('12345685', 100000),  // $100K
    ];

    const client = createDefaultClient();
    client.feeScheduleId = 'fee-schedule-5'; // Tiered schedule
    this.engine.addClient(client);

    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0];
    const result = this.engine.calculateFeesForPeriod(accounts, [], billingPeriod, client.id);

    if (!result.success) {
      return {
        testName,
        passed: false,
        message: 'Calculation failed',
        expected: 'Successful calculation',
        actual: result.errors.map(e => e.message).join(', ')
      };
    }

    const clientCalculation = result.clientCalculations[0];

    // Verify totals match sum of individual calculations
    const expectedTotalPortfolioValue = 2100000; // Sum of all accounts
    const actualTotalPortfolioValue = clientCalculation.totalPortfolioValue;

    const calculatedIndividualSum = clientCalculation.accountCalculations.reduce(
      (sum, calc) => sum + calc.finalFee, 0
    );
    const reportedTotal = clientCalculation.totalFinalFees;

    const portfolioCorrect = Math.abs(actualTotalPortfolioValue - expectedTotalPortfolioValue) < 0.01;
    const totalsCorrect = Math.abs(calculatedIndividualSum - reportedTotal) < 0.01;
    const passed = portfolioCorrect && totalsCorrect;

    return {
      testName,
      passed,
      message: passed ? 'Complex scenario calculated correctly' : 'Complex scenario has errors',
      expected: `Portfolio: ${expectedTotalPortfolioValue}, Individual sum should equal total`,
      actual: `Portfolio: ${actualTotalPortfolioValue}, Individual sum: ${calculatedIndividualSum}, Total: ${reportedTotal}`
    };
  }

  // Test 7: Edge cases
  private testEdgeCases(): TestResult {
    const testName = 'Edge Cases';

    // Test zero-value account
    const zeroAccount: AccountBalance = this.createTestAccount('12345686', 0);

    const client = createDefaultClient();
    this.engine.addClient(client);

    const billingPeriod = BillingPeriodManager.createQuarterlyPeriods(2024)[0];
    const result = this.engine.calculateFeesForPeriod([zeroAccount], [], billingPeriod, client.id);

    const zeroValueHandled = result.success && result.clientCalculations[0].accountCalculations[0].finalFee === 0;

    // Test no-fee schedule
    const noFeeSchedule = FeeScheduleManager.createFromLegacyData({ fee_code: 'NF' });
    this.engine.addFeeSchedule(noFeeSchedule);

    const normalAccount = this.createTestAccount('12345687', 1000000);
    client.feeScheduleId = noFeeSchedule.id;

    const noFeeResult = this.engine.calculateFeesForPeriod([normalAccount], [], billingPeriod, client.id);
    const noFeeHandled = noFeeResult.success && noFeeResult.clientCalculations[0].accountCalculations[0].finalFee === 0;

    const passed = zeroValueHandled && noFeeHandled;

    return {
      testName,
      passed,
      message: passed ? 'Edge cases handled correctly' : 'Edge cases not handled properly',
      expected: 'Zero fees for both cases',
      actual: `Zero account fee: ${result.success ? result.clientCalculations[0].accountCalculations[0].finalFee : 'failed'}, No fee schedule: ${noFeeResult.success ? noFeeResult.clientCalculations[0].accountCalculations[0].finalFee : 'failed'}`
    };
  }

  // Helper methods to create test data
  private createTestAccount(accountNumber: string, portfolioValue: number): AccountBalance {
    return {
      asOfBusinessDate: '2024-03-31',
      accountNumber,
      accountName: `Test Account ${accountNumber}`,
      netMarketValue: portfolioValue,
      portfolioValue,
      marketValueShort: 0,
      totalCash: portfolioValue * 0.1, // 10% cash
      cashAccountBalanceNetCreditOrDebit: 0,
      cashAccountBalanceNetMarketValue: 0,
      cashAccountBalanceMoneyMarketFunds: 0,
      equityPercentage: 90,
      optionRequirements: 0,
      monthEndDivPayout: 0,
      marginAccountBalanceCreditOrDebit: 0,
      marginAccountBalanceMarketValueLong: 0,
      marginAccountBalanceMarketValueShort: 0,
      marginAccountBalanceEquityIncludingOptions: 0,
      marginAccountBalanceMarginCashAvailable: 0,
      marginAccountBalanceEquityExcludingOptions: 0,
      marginBuyingPower: 0,
      mtdMarginInterest: 0
    };
  }

  private createTestPosition(
    accountNumber: string,
    symbol: string,
    description: string,
    marketValue: number
  ): AccountPosition {
    return {
      asOfBusinessDate: '2024-03-31',
      accountNumber,
      accountName: `Test Account ${accountNumber}`,
      symbol,
      securityType: 'Stock',
      securityDescription: description,
      accountingRuleCode: 'LONG',
      numberOfShares: marketValue / 100, // Assume $100 per share
      longShort: 'Long',
      price: 100,
      dateOfPrice: '2024-03-31',
      marketValue
    };
  }
}

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  expected: string;
  actual: string;
  details?: any;
}

// Export function to run tests
export const runFeeCalculationTests = (): {
  passed: number;
  failed: number;
  results: TestResult[];
} => {
  const tester = new FeeCalculationTester();
  return tester.runAllTests();
};