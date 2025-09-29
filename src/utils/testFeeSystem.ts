// Direct test of the fee calculation system
import { FeeCalculationEngine } from './feeCalculationEngine';
import { FeeScheduleManager, BillingPeriodManager } from './feeScheduleManager';
import { AccountBalance, AccountPosition } from '../types/DataTypes';

export const testFeeCalculationSystem = () => {
  console.log('🚀 Testing Fee Calculation System...\n');

  try {
    // Create fee calculation engine
    const engine = new FeeCalculationEngine();
    console.log('✅ Fee calculation engine created');

    // Create test fee schedules
    const flatFeeSchedule = FeeScheduleManager.createFromLegacyData({
      fee_code: '1',
      flat_percent: 0.0025 // 0.25%
    });

    const tieredFeeSchedule = FeeScheduleManager.createFromLegacyData({
      fee_code: '5',
      tier1_percent: 0.012,
      tier1_limit: 250000,
      tier2_percent: 0.010,
      tier2_limit: 500000,
      tier3_percent: 0.008,
      tier3_limit: 1000000,
      tier4_percent: 0.006,
      tier4_limit: 2500000,
      tier5_percent: 0.005
    });

    engine.addFeeSchedule(flatFeeSchedule);
    engine.addFeeSchedule(tieredFeeSchedule);
    console.log('✅ Fee schedules created and added');

    // Create test data
    const balanceData: AccountBalance[] = [
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '123456789',
        accountName: 'John Doe IRA',
        netMarketValue: 150000,
        portfolioValue: 150000,
        marketValueShort: 0,
        totalCash: 5000,
        cashAccountBalanceNetCreditOrDebit: 5000,
        cashAccountBalanceNetMarketValue: 5000,
        cashAccountBalanceMoneyMarketFunds: 0,
        equityPercentage: 96.7,
        optionRequirements: 0,
        monthEndDivPayout: 2500,
        marginAccountBalanceCreditOrDebit: 0,
        marginAccountBalanceMarketValueLong: 145000,
        marginAccountBalanceMarketValueShort: 0,
        marginAccountBalanceEquityIncludingOptions: 145000,
        marginAccountBalanceMarginCashAvailable: 0,
        marginAccountBalanceEquityExcludingOptions: 145000,
        marginBuyingPower: 0,
        mtdMarginInterest: 0
      },
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '987654321',
        accountName: 'Jane Smith Taxable',
        netMarketValue: 750000,
        portfolioValue: 750000,
        marketValueShort: 0,
        totalCash: 25000,
        cashAccountBalanceNetCreditOrDebit: 25000,
        cashAccountBalanceNetMarketValue: 25000,
        cashAccountBalanceMoneyMarketFunds: 25000,
        equityPercentage: 96.7,
        optionRequirements: 0,
        monthEndDivPayout: 15000,
        marginAccountBalanceCreditOrDebit: 0,
        marginAccountBalanceMarketValueLong: 725000,
        marginAccountBalanceMarketValueShort: 0,
        marginAccountBalanceEquityIncludingOptions: 725000,
        marginAccountBalanceMarginCashAvailable: 0,
        marginAccountBalanceEquityExcludingOptions: 725000,
        marginBuyingPower: 0,
        mtdMarginInterest: 0
      }
    ];

    const positionsData: AccountPosition[] = [
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '123456789',
        accountName: 'John Doe IRA',
        symbol: 'VTI',
        securityType: 'ETF',
        securityDescription: 'Vanguard Total Stock Market ETF',
        accountingRuleCode: 'LONG',
        numberOfShares: 500,
        longShort: 'Long',
        price: 240.00,
        dateOfPrice: '2024-09-30',
        marketValue: 120000
      },
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '123456789',
        accountName: 'John Doe IRA',
        symbol: 'CASH',
        securityType: 'CASH',
        securityDescription: 'Cash Position',
        accountingRuleCode: 'CASH',
        numberOfShares: 1,
        longShort: 'Long',
        price: 1.00,
        dateOfPrice: '2024-09-30',
        marketValue: 5000
      },
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '987654321',
        accountName: 'Jane Smith Taxable',
        symbol: 'SPY',
        securityType: 'ETF',
        securityDescription: 'SPDR S&P 500 ETF Trust',
        accountingRuleCode: 'LONG',
        numberOfShares: 1000,
        longShort: 'Long',
        price: 450.00,
        dateOfPrice: '2024-09-30',
        marketValue: 450000
      },
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '987654321',
        accountName: 'Jane Smith Taxable',
        symbol: 'BND',
        securityType: 'ETF',
        securityDescription: 'Vanguard Total Bond Market ETF',
        accountingRuleCode: 'LONG',
        numberOfShares: 2750,
        longShort: 'Long',
        price: 100.00,
        dateOfPrice: '2024-09-30',
        marketValue: 275000
      },
      {
        asOfBusinessDate: '2024-09-30',
        accountNumber: '987654321',
        accountName: 'Jane Smith Taxable',
        symbol: 'SWVXX',
        securityType: 'MONEY MARKET',
        securityDescription: 'Schwab Government Money Fund',
        accountingRuleCode: 'LONG',
        numberOfShares: 25000,
        longShort: 'Long',
        price: 1.00,
        dateOfPrice: '2024-09-30',
        marketValue: 25000
      }
    ];
    console.log('✅ Test data created');

    // Create clients
    const client1 = {
      id: 'client-1',
      name: 'John Doe',
      feeScheduleId: flatFeeSchedule.id,
      billingFrequency: 'quarterly' as const,
      accountFeeScheduleOverrides: [],
      clientAdjustments: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const client2 = {
      id: 'client-2',
      name: 'Jane Smith',
      feeScheduleId: tieredFeeSchedule.id,
      billingFrequency: 'quarterly' as const,
      accountFeeScheduleOverrides: [],
      clientAdjustments: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    engine.addClient(client1);
    engine.addClient(client2);
    console.log('✅ Clients created and added');

    // Create billing period
    const currentQuarter = BillingPeriodManager.getCurrentQuarter();
    console.log(`✅ Billing period created: ${currentQuarter.name}`);

    // Calculate fees
    const results = engine.calculateFeesForPeriod(
      balanceData,
      positionsData,
      currentQuarter
    );
    console.log('✅ Fee calculations completed');

    // Display results
    console.log('\n📊 CALCULATION RESULTS:');
    console.log('='.repeat(50));

    console.log(`Total Clients: ${results.summary.totalClients}`);
    console.log(`Total Accounts: ${results.summary.totalAccounts}`);
    console.log(`Total Portfolio Value: $${results.summary.totalPortfolioValue.toLocaleString()}`);
    console.log(`Total Billable Value: $${results.summary.totalBillableValue.toLocaleString()}`);
    console.log(`Total Excluded Value: $${results.summary.totalExcludedValue.toLocaleString()}`);
    console.log(`Total Fees: $${results.summary.totalFees.toLocaleString()}`);
    console.log(`Average Fee Rate: ${(results.summary.averageFeeRate * 100).toFixed(3)}%`);

    console.log('\n👥 CLIENT DETAILS:');
    console.log('='.repeat(50));

    results.clientCalculations.forEach(client => {
      console.log(`\n${client.clientName}:`);
      console.log(`  Portfolio Value: $${client.totalPortfolioValue.toLocaleString()}`);
      console.log(`  Billable Value: $${client.totalBillableValue.toLocaleString()}`);
      console.log(`  Final Fees: $${client.totalFinalFees.toLocaleString()}`);

      client.accountCalculations.forEach(account => {
        console.log(`\n  Account: ${account.accountName} (${account.accountNumber})`);
        console.log(`    Fee Schedule: ${account.feeScheduleName}`);
        console.log(`    Portfolio Value: $${account.totalPortfolioValue.toLocaleString()}`);
        console.log(`    Excluded Value: $${account.excludedValue.toLocaleString()}`);
        console.log(`    Billable Value: $${account.billableValue.toLocaleString()}`);
        console.log(`    Annual Fee: $${account.annualFeeAmount.toLocaleString()}`);
        console.log(`    Proration Factor: ${account.prorationFactor.toFixed(4)}`);
        console.log(`    Quarterly Fee: $${account.finalFee.toLocaleString()}`);

        if (account.excludedPositions.length > 0) {
          console.log(`    Excluded Positions:`);
          account.excludedPositions.forEach(pos => {
            console.log(`      • ${pos.symbol}: $${pos.marketValue.toLocaleString()} (${pos.exclusionReason})`);
          });
        }

        if (account.tierBreakdown.length > 0) {
          console.log(`    Tier Breakdown:`);
          account.tierBreakdown.forEach(tier => {
            console.log(`      • Tier ${tier.tierNumber}: $${tier.applicableValue.toLocaleString()} @ ${(tier.tierRate * 100).toFixed(3)}% = $${tier.proRatedFeeForTier.toLocaleString()}`);
          });
        }
      });
    });

    if (results.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      console.log('='.repeat(50));
      results.errors.forEach(error => {
        console.log(`${error.type}: ${error.message}`);
      });
    }

    if (results.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS:');
      console.log('='.repeat(50));
      results.warnings.forEach(warning => {
        console.log(`${warning.type}: ${warning.message}`);
      });
    }

    console.log(`\n⏱️  Processing Time: ${results.processingTime}ms`);

    return {
      success: true,
      results,
      message: 'Fee calculation system test completed successfully'
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Fee calculation system test failed'
    };
  }
};