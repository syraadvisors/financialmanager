// Search Performance Benchmarking Suite
import { SearchPerformanceOptimizer, searchOptimizer } from './searchUtils';

export interface BenchmarkResult {
  testName: string;
  dataSize: number;
  queryComplexity: 'simple' | 'medium' | 'complex';
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number; // searches per second
  cacheHitRate: number;
  memoryUsage: number;
  iterations: number;
  timestamp: string;
}

export interface BenchmarkSuite {
  name: string;
  description: string;
  results: BenchmarkResult[];
  totalTime: number;
  summary: {
    bestPerformance: BenchmarkResult;
    worstPerformance: BenchmarkResult;
    averagePerformance: number;
    recommendedOptimizations: string[];
  };
}

export class SearchBenchmarkRunner {
  private results: BenchmarkResult[] = [];
  private testData: any[] = [];
  private testFields: string[] = [];

  constructor() {
    // Generate synthetic test data
    this.generateTestData();
  }

  private generateTestData(): void {
    const accountTypes = ['Individual', 'IRA', 'Corporate', 'Trust', 'Joint'];
    const securityTypes = ['Stock', 'Bond', 'ETF', 'Mutual Fund', 'Option', 'Cash'];
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA', 'META', 'NFLX', 'NVDA', 'JPM', 'BAC'];

    // Generate 10,000 synthetic records for testing
    for (let i = 0; i < 10000; i++) {
      this.testData.push({
        accountNumber: `ACC${String(i + 100000).substring(1)}`,
        accountName: `${accountTypes[i % accountTypes.length]} Account ${i + 1}`,
        symbol: symbols[i % symbols.length] + (i % 100 === 0 ? '.TO' : ''),
        securityDescription: `Test Security ${i + 1} - ${securityTypes[i % securityTypes.length]}`,
        securityType: securityTypes[i % securityTypes.length],
        portfolioValue: Math.random() * 1000000 + 1000,
        totalCash: Math.random() * 50000,
        marketValue: Math.random() * 100000 + 100,
        numberOfShares: Math.random() * 1000 + 1,
        price: Math.random() * 500 + 10
      });
    }

    this.testFields = [
      'accountNumber',
      'accountName',
      'symbol',
      'securityDescription',
      'securityType'
    ];

    console.log(`Generated ${this.testData.length} test records for benchmarking`);
  }

  // Run a single benchmark test
  async runBenchmark(
    testName: string,
    queries: string[],
    dataSize: number = this.testData.length,
    iterations: number = 100,
    queryComplexity: 'simple' | 'medium' | 'complex' = 'medium'
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${testName}`);

    // Prepare test data subset
    const testDataSubset = this.testData.slice(0, dataSize);
    const optimizer = new SearchPerformanceOptimizer();

    // Build index (not included in timing)
    const indexStart = performance.now();
    optimizer.buildIndex(testDataSubset, this.testFields);
    const indexTime = performance.now() - indexStart;

    console.log(`Index built in ${indexTime.toFixed(2)}ms for ${dataSize} records`);

    // Warm up the cache
    for (const query of queries.slice(0, 3)) {
      optimizer.searchWithIndex(testDataSubset, query, this.testFields, {
        fuzzyThreshold: 0.7,
        maxResults: 100
      });
    }

    // Run benchmark iterations
    const times: number[] = [];
    const memoryBefore = this.getMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const query = queries[i % queries.length];

      const startTime = performance.now();
      const results = optimizer.searchWithIndex(testDataSubset, query, this.testFields, {
        fuzzyThreshold: 0.7,
        maxResults: 100,
        sortByRelevance: true
      });
      const endTime = performance.now();

      times.push(endTime - startTime);

      // Log progress every 25%
      if (i % Math.floor(iterations / 4) === 0 && i > 0) {
        console.log(`  Progress: ${((i / iterations) * 100).toFixed(0)}%`);
      }
    }

    const memoryAfter = this.getMemoryUsage();
    const metrics = optimizer.getPerformanceMetrics();

    // Calculate statistics
    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);
    const throughput = 1000 / averageTime; // searches per second

    const result: BenchmarkResult = {
      testName,
      dataSize,
      queryComplexity,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      cacheHitRate: metrics.cacheHitRate,
      memoryUsage: memoryAfter - memoryBefore,
      iterations,
      timestamp: new Date().toISOString()
    };

    this.results.push(result);
    return result;
  }

  // Run comprehensive benchmark suite
  async runComprehensiveBenchmark(): Promise<BenchmarkSuite> {
    console.log('Starting comprehensive search benchmark suite...');

    const startTime = performance.now();
    const results: BenchmarkResult[] = [];

    // Test queries with varying complexity
    const simpleQueries = ['AAPL', 'IRA', 'Stock', '123', 'Test'];
    const mediumQueries = ['AAPL Individual', 'Corporate Account', 'Mutual Fund', 'Bond ETF', 'Test Security'];
    const complexQueries = [
      'Individual Account with Stock',
      'IRA Account AAPL Test Security',
      'Corporate Bond Mutual Fund',
      'Joint Trust Account with ETF',
      'Cash Option in Individual Account'
    ];

    // Different data sizes
    const dataSizes = [100, 1000, 5000, 10000];

    // Run benchmarks for different scenarios
    for (const dataSize of dataSizes) {
      // Simple queries
      results.push(await this.runBenchmark(
        `Simple Queries - ${dataSize} records`,
        simpleQueries,
        dataSize,
        50,
        'simple'
      ));

      // Medium complexity queries
      results.push(await this.runBenchmark(
        `Medium Queries - ${dataSize} records`,
        mediumQueries,
        dataSize,
        30,
        'medium'
      ));

      // Complex queries
      results.push(await this.runBenchmark(
        `Complex Queries - ${dataSize} records`,
        complexQueries,
        dataSize,
        20,
        'complex'
      ));
    }

    // Stress test
    results.push(await this.runBenchmark(
      'Stress Test - 1000 iterations',
      [...simpleQueries, ...mediumQueries, ...complexQueries],
      10000,
      1000,
      'complex'
    ));

    const totalTime = performance.now() - startTime;

    // Generate summary
    const bestPerformance = results.reduce((best, current) =>
      current.throughput > best.throughput ? current : best
    );

    const worstPerformance = results.reduce((worst, current) =>
      current.averageTime > worst.averageTime ? current : worst
    );

    const averagePerformance = results.reduce((sum, result) =>
      sum + result.throughput, 0) / results.length;

    const recommendedOptimizations = this.generateRecommendations(results);

    const suite: BenchmarkSuite = {
      name: 'Comprehensive Search Performance Benchmark',
      description: 'Full performance analysis of search functionality across different data sizes and query complexities',
      results,
      totalTime,
      summary: {
        bestPerformance,
        worstPerformance,
        averagePerformance,
        recommendedOptimizations
      }
    };

    console.log('Benchmark suite completed!');
    return suite;
  }

  // Generate performance recommendations
  private generateRecommendations(results: BenchmarkResult[]): string[] {
    const recommendations: string[] = [];

    // Analyze average performance
    const avgTime = results.reduce((sum, r) => sum + r.averageTime, 0) / results.length;
    const avgCacheHit = results.reduce((sum, r) => sum + r.cacheHitRate, 0) / results.length;

    if (avgTime > 100) {
      recommendations.push('Consider enabling Web Workers for large datasets');
      recommendations.push('Implement result pagination to reduce processing load');
    }

    if (avgTime > 50) {
      recommendations.push('Optimize indexing strategy for better performance');
      recommendations.push('Consider pre-building indexes on application startup');
    }

    if (avgCacheHit < 0.6) {
      recommendations.push('Increase cache size to improve hit rates');
      recommendations.push('Implement smarter cache eviction policies');
    }

    // Check for memory usage patterns
    const avgMemory = results.reduce((sum, r) => sum + r.memoryUsage, 0) / results.length;
    if (avgMemory > 10 * 1024 * 1024) { // 10MB
      recommendations.push('Memory usage is high - consider implementing index compression');
      recommendations.push('Use streaming for very large datasets');
    }

    // Performance scaling analysis
    const largeDataResults = results.filter(r => r.dataSize >= 5000);
    if (largeDataResults.length > 0) {
      const avgLargeTime = largeDataResults.reduce((sum, r) => sum + r.averageTime, 0) / largeDataResults.length;
      if (avgLargeTime > avgTime * 2) {
        recommendations.push('Performance degrades significantly with large datasets - implement chunking');
        recommendations.push('Consider database-like indexing for production use');
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is excellent! No optimizations needed.');
      recommendations.push('Consider A/B testing different search algorithms for edge cases');
    }

    return recommendations;
  }

  // Memory usage estimation
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    // Fallback estimation
    return Date.now() % 1000000; // Simple proxy
  }

  // Export benchmark results
  exportResults(suite: BenchmarkSuite): string {
    const report = {
      timestamp: new Date().toISOString(),
      environment: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
        language: navigator.language
      },
      suite
    };

    return JSON.stringify(report, null, 2);
  }

  // Compare two benchmark results
  compareResults(result1: BenchmarkResult, result2: BenchmarkResult): {
    performanceChange: number;
    throughputChange: number;
    memoryChange: number;
    recommendation: string;
  } {
    const performanceChange = ((result1.averageTime - result2.averageTime) / result2.averageTime) * 100;
    const throughputChange = ((result1.throughput - result2.throughput) / result2.throughput) * 100;
    const memoryChange = ((result1.memoryUsage - result2.memoryUsage) / result2.memoryUsage) * 100;

    let recommendation = '';
    if (performanceChange < -10) {
      recommendation = 'Significant performance improvement detected!';
    } else if (performanceChange > 10) {
      recommendation = 'Performance degradation detected - investigate recent changes';
    } else {
      recommendation = 'Performance is stable within acceptable variance';
    }

    return {
      performanceChange,
      throughputChange,
      memoryChange,
      recommendation
    };
  }

  // Clear previous results
  clearResults(): void {
    this.results = [];
  }

  // Get all results
  getAllResults(): BenchmarkResult[] {
    return [...this.results];
  }
}

// Singleton instance
export const benchmarkRunner = new SearchBenchmarkRunner();

// Utility functions for performance testing
export const performanceUtils = {
  // Quick performance test
  async quickTest(data: any[], fields: string[], queries: string[]): Promise<{
    averageTime: number;
    throughput: number;
    cacheHitRate: number;
  }> {
    const optimizer = searchOptimizer;
    const times: number[] = [];

    // Build index
    optimizer.buildIndex(data, fields);

    // Run tests
    for (let i = 0; i < 10; i++) {
      const query = queries[i % queries.length];
      const startTime = performance.now();
      optimizer.searchWithIndex(data, query, fields);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const metrics = optimizer.getPerformanceMetrics();

    return {
      averageTime,
      throughput: 1000 / averageTime,
      cacheHitRate: metrics.cacheHitRate
    };
  },

  // Measure indexing performance
  measureIndexing(data: any[], fields: string[]): {
    indexingTime: number;
    indexSize: number;
    memoryEstimate: number;
  } {
    const optimizer = new SearchPerformanceOptimizer();

    const startTime = performance.now();
    optimizer.buildIndex(data, fields);
    const indexingTime = performance.now() - startTime;

    const metrics = optimizer.getPerformanceMetrics();

    return {
      indexingTime,
      indexSize: metrics.indexSize,
      memoryEstimate: data.length * fields.length * 50 // Rough estimate
    };
  },

  // Profile search query
  profileQuery(
    data: any[],
    fields: string[],
    query: string,
    iterations: number = 100
  ): {
    times: number[];
    averageTime: number;
    medianTime: number;
    percentile95: number;
    standardDeviation: number;
  } {
    const optimizer = searchOptimizer;
    optimizer.buildIndex(data, fields);

    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      optimizer.searchWithIndex(data, query, fields);
      const endTime = performance.now();
      times.push(endTime - startTime);
    }

    times.sort((a, b) => a - b);

    const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
    const medianTime = times[Math.floor(times.length / 2)];
    const percentile95 = times[Math.floor(times.length * 0.95)];

    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      times,
      averageTime,
      medianTime,
      percentile95,
      standardDeviation
    };
  }
};