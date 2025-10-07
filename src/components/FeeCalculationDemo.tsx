// Fee Calculation System Demo Component
import React, { useState } from 'react';
import { FeeCalculationEngine } from '../utils/feeCalculationEngine';
import { FeeScheduleManager, BillingPeriodManager } from '../utils/feeScheduleManager';
import { runFeeTests } from '../utils/runFeeCalculationTests';
import { AccountBalance, AccountPosition } from '../types/DataTypes';

const FeeCalculationDemo: React.FC = () => {
  const [testResults, setTestResults] = useState<any>(null);
  const [demoResults, setDemoResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Sample data for demonstration
  const sampleBalanceData: AccountBalance[] = [
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

  const samplePositionsData: AccountPosition[] = [
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

  const runTests = async () => {
    setLoading(true);
    try {
      const results = runFeeTests();
      setTestResults(results);
    } catch (error) {
      console.error('Error running tests:', error);
    }
    setLoading(false);
  };

  const runDemo = async () => {
    setLoading(true);
    try {
      // Create fee calculation engine
      const engine = new FeeCalculationEngine();

      // Create sample fee schedules
      const feeSchedule1 = FeeScheduleManager.createFromLegacyData({
        fee_code: '1',
        flat_percent: 0.0025 // 0.25%
      });

      const feeSchedule5 = FeeScheduleManager.createFromLegacyData({
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

      // Add fee schedules to engine
      engine.addFeeSchedule(feeSchedule1);
      engine.addFeeSchedule(feeSchedule5);

      // Create current quarter billing period
      const currentQuarter = BillingPeriodManager.getCurrentQuarter();

      // Create clients with different fee schedules
      const client1 = {
        id: 'client-1',
        name: 'John Doe',
        feeScheduleId: feeSchedule1.id,
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
        feeScheduleId: feeSchedule5.id,
        billingFrequency: 'quarterly' as const,
        accountFeeScheduleOverrides: [],
        clientAdjustments: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      engine.addClient(client1);
      engine.addClient(client2);

      // Calculate fees for the period
      const results = engine.calculateFeesForPeriod(
        sampleBalanceData,
        samplePositionsData,
        currentQuarter
      );

      setDemoResults(results);
    } catch (error) {
      console.error('Error running demo:', error);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${(rate * 100).toFixed(3)}%`;
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Fee Calculation System Demo</h1>

      <div style={{ marginBottom: '30px' }}>
        <h2>System Testing</h2>
        <button
          onClick={runTests}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Running Tests...' : 'Run Test Suite'}
        </button>

        {testResults && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
            <h3>Test Results</h3>
            <p><strong>Passed:</strong> {testResults.passed}</p>
            <p><strong>Failed:</strong> {testResults.failed}</p>
            <p><strong>Success Rate:</strong> {((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%</p>

            <details style={{ marginTop: '10px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Detailed Results</summary>
              <div style={{ marginTop: '10px' }}>
                {testResults.results.map((result: any, index: number) => (
                  <div key={index} style={{
                    marginBottom: '10px',
                    padding: '10px',
                    backgroundColor: result.passed ? '#e8f5e8' : '#ffe8e8',
                    borderRadius: '4px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>
                      {result.passed ? '✅' : '❌'} {result.testName}
                    </div>
                    {result.details && <div style={{ fontSize: '14px', marginTop: '5px' }}>{result.details}</div>}
                    {result.error && <div style={{ fontSize: '14px', color: 'red', marginTop: '5px' }}>Error: {result.error}</div>}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h2>Live Demo Calculation</h2>
        <button
          onClick={runDemo}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Calculating...' : 'Run Demo Calculation'}
        </button>

        {demoResults && (
          <div style={{ marginTop: '20px' }}>
            <div style={{ padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '4px', marginBottom: '20px' }}>
              <h3>Calculation Summary</h3>
              <p><strong>Total Clients:</strong> {demoResults.summary.totalClients}</p>
              <p><strong>Total Accounts:</strong> {demoResults.summary.totalAccounts}</p>
              <p><strong>Total Portfolio Value:</strong> {formatCurrency(demoResults.summary.totalPortfolioValue)}</p>
              <p><strong>Total Billable Value:</strong> {formatCurrency(demoResults.summary.totalBillableValue)}</p>
              <p><strong>Total Excluded Value:</strong> {formatCurrency(demoResults.summary.totalExcludedValue)}</p>
              <p><strong>Total Fees:</strong> {formatCurrency(demoResults.summary.totalFees)}</p>
              <p><strong>Average Fee Rate:</strong> {formatPercentage(demoResults.summary.averageFeeRate)}</p>
            </div>

            <h3>Client Details</h3>
            {demoResults.clientCalculations.map((client: any, index: number) => (
              <div key={index} style={{
                marginBottom: '20px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}>
                <h4>{client.clientName}</h4>
                <p><strong>Total Portfolio Value:</strong> {formatCurrency(client.totalPortfolioValue)}</p>
                <p><strong>Total Billable Value:</strong> {formatCurrency(client.totalBillableValue)}</p>
                <p><strong>Total Final Fees:</strong> {formatCurrency(client.totalFinalFees)}</p>

                <details style={{ marginTop: '15px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>View Account Details</summary>
                  <div style={{ marginTop: '10px' }}>
                    {client.accountCalculations.map((account: any, accountIndex: number) => (
                      <div key={accountIndex} style={{
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#fafafa',
                        borderRadius: '4px'
                      }}>
                        <h5>{account.accountName} ({account.accountNumber})</h5>
                        <p><strong>Fee Schedule:</strong> {account.feeScheduleName}</p>
                        <p><strong>Total Portfolio Value:</strong> {formatCurrency(account.totalPortfolioValue)}</p>
                        <p><strong>Excluded Value:</strong> {formatCurrency(account.excludedValue)}</p>
                        <p><strong>Billable Value:</strong> {formatCurrency(account.billableValue)}</p>
                        <p><strong>Annual Fee Amount:</strong> {formatCurrency(account.annualFeeAmount)}</p>
                        <p><strong>Proration Factor:</strong> {account.prorationFactor.toFixed(4)}</p>
                        <p><strong>Final Fee:</strong> {formatCurrency(account.finalFee)}</p>

                        {account.excludedPositions.length > 0 && (
                          <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer' }}>Excluded Positions ({account.excludedPositions.length})</summary>
                            <div style={{ marginTop: '5px' }}>
                              {account.excludedPositions.map((position: any, posIndex: number) => (
                                <div key={posIndex} style={{ fontSize: '12px', marginBottom: '5px' }}>
                                  • {position.symbol}: {formatCurrency(position.marketValue)} - {position.exclusionReason}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}

                        {account.tierBreakdown.length > 0 && (
                          <details style={{ marginTop: '10px' }}>
                            <summary style={{ cursor: 'pointer' }}>Tier Breakdown ({account.tierBreakdown.length} tiers)</summary>
                            <div style={{ marginTop: '5px' }}>
                              {account.tierBreakdown.map((tier: any, tierIndex: number) => (
                                <div key={tierIndex} style={{ fontSize: '12px', marginBottom: '5px' }}>
                                  • Tier {tier.tierNumber}: {formatCurrency(tier.applicableValue)} @ {formatPercentage(tier.tierRate)} = {formatCurrency(tier.proRatedFeeForTier)}
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
        <h3>Sample Data Used</h3>
        <p>This demo uses the following sample data:</p>

        <h4>Accounts:</h4>
        <ul>
          <li>John Doe IRA: $150,000 portfolio ($5,000 cash) - Fee Schedule 1 (0.25% flat)</li>
          <li>Jane Smith Taxable: $750,000 portfolio ($25,000 money market) - Fee Schedule 5 (tiered)</li>
        </ul>

        <h4>Fee Schedules:</h4>
        <ul>
          <li><strong>Schedule 1:</strong> 0.25% flat annual rate</li>
          <li><strong>Schedule 5:</strong> Tiered rates (1.2% up to $250K, 1.0% up to $500K, 0.8% up to $1M, 0.6% up to $2.5M, 0.5% above)</li>
        </ul>

        <h4>Fund Exclusions:</h4>
        <ul>
          <li>CASH positions</li>
          <li>SWVXX (Schwab Money Market)</li>
          <li>Money Market funds</li>
        </ul>
      </div>
    </div>
  );
};

export default FeeCalculationDemo;