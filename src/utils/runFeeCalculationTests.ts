// Test Runner for Fee Calculation System
import { FeeCalculationTester } from './feeCalculationTests';

export const runFeeTests = () => {
  console.log('🚀 Starting Fee Calculation Test Suite...\n');

  const testSuite = new FeeCalculationTester();
  const results = testSuite.runAllTests();

  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%\n`);

  if (results.failed > 0) {
    console.log('❌ Failed Tests:');
    results.results
      .filter((result: any) => !result.passed)
      .forEach((result: any) => {
        console.log(`  - ${result.testName}: ${result.error}`);
      });
    console.log('');
  }

  console.log('📝 All Test Details:');
  results.results.forEach((result: any) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  return results;
};

// Export for use in components
export default runFeeTests;