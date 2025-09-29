// Portfolio Analytics and Data Processing Utilities
import { AccountBalance, AccountPosition } from '../types/DataTypes';

// Color palettes for charts
export const CHART_COLORS = {
  primary: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#FFEB3B', '#795548'],
  performance: {
    positive: '#4CAF50',
    negative: '#F44336',
    neutral: '#9E9E9E'
  },
  assetTypes: {
    stock: '#2196F3',
    bond: '#4CAF50',
    cash: '#FF9800',
    commodity: '#9C27B0',
    reit: '#F44336',
    other: '#607D8B'
  },
  accountTypes: {
    ira: '#2196F3',
    roth: '#4CAF50',
    taxable: '#FF9800',
    '401k': '#9C27B0',
    other: '#607D8B'
  }
};

// Asset type classification
export interface AssetAllocation {
  name: string;
  value: number;
  percentage: number;
  color: string;
  count: number;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface AccountDistribution {
  accountType: string;
  accountName: string;
  value: number;
  percentage: number;
  color: string;
  cashAmount: number;
  investedAmount: number;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface TopHolding {
  symbol: string;
  description: string;
  marketValue: number;
  percentage: number;
  shares: number;
  avgCost?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  accountNumber: string;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface PortfolioMetrics {
  totalValue: number;
  totalCash: number;
  totalInvested: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  accountCount: number;
  positionCount: number;
  topHoldings: TopHolding[];
  assetAllocation: AssetAllocation[];
  accountDistribution: AccountDistribution[];
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
  dailyChange?: number;
  dailyChangePercent?: number;
  [key: string]: any; // Index signature for Recharts compatibility
}

export interface PerformanceMetrics {
  ytdReturn: number;
  oneYearReturn: number;
  threeYearReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export class PortfolioAnalyzer {
  private balanceData: AccountBalance[];
  private positionsData: AccountPosition[];

  constructor(balanceData: AccountBalance[], positionsData: AccountPosition[]) {
    this.balanceData = balanceData || [];
    this.positionsData = positionsData || [];
  }

  // Classify asset type based on security description
  private classifyAssetType(position: AccountPosition): string {
    const description = (position.securityDescription || '').toLowerCase();
    const securityType = (position.securityType || '').toLowerCase();
    const symbol = (position.symbol || '').toLowerCase();

    if (securityType.includes('stock') || securityType.includes('equity')) {
      return 'stock';
    }
    if (securityType.includes('bond') || securityType.includes('fixed')) {
      return 'bond';
    }
    if (securityType.includes('cash') || securityType.includes('money market')) {
      return 'cash';
    }
    if (description.includes('reit') || symbol.includes('reit')) {
      return 'reit';
    }
    if (description.includes('commodity') || description.includes('gold') || description.includes('oil')) {
      return 'commodity';
    }

    // Default classification based on patterns
    if (symbol.length <= 5 && !symbol.includes('.')) {
      return 'stock'; // Likely a stock ticker
    }

    return 'other';
  }

  // Extract account type from account name or number
  private classifyAccountType(account: AccountBalance): string {
    const accountName = (account.accountName || '').toLowerCase();
    const accountNumber = (account.accountNumber || '').toLowerCase();

    if (accountName.includes('ira') && !accountName.includes('roth')) {
      return 'ira';
    }
    if (accountName.includes('roth')) {
      return 'roth';
    }
    if (accountName.includes('401') || accountName.includes('403') || accountName.includes('457')) {
      return '401k';
    }
    if (accountName.includes('taxable') || accountName.includes('individual') || accountName.includes('joint')) {
      return 'taxable';
    }

    return 'other';
  }

  // Calculate comprehensive portfolio metrics
  calculatePortfolioMetrics(): PortfolioMetrics {
    const totalValue = this.balanceData.reduce((sum, account) => sum + (account.portfolioValue || 0), 0);
    const totalCash = this.balanceData.reduce((sum, account) => sum + (account.totalCash || 0), 0);
    const totalInvested = totalValue - totalCash;

    // Calculate asset allocation
    const assetMap = new Map<string, { value: number; count: number }>();

    this.positionsData.forEach(position => {
      const assetType = this.classifyAssetType(position);
      const marketValue = position.marketValue || 0;

      if (assetMap.has(assetType)) {
        const existing = assetMap.get(assetType)!;
        existing.value += marketValue;
        existing.count += 1;
      } else {
        assetMap.set(assetType, { value: marketValue, count: 1 });
      }
    });

    // Add cash as an asset type
    if (totalCash > 0) {
      assetMap.set('cash', { value: totalCash, count: this.balanceData.length });
    }

    const assetAllocation: AssetAllocation[] = Array.from(assetMap.entries()).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: data.value,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      color: CHART_COLORS.assetTypes[name as keyof typeof CHART_COLORS.assetTypes] || CHART_COLORS.primary[0],
      count: data.count
    })).sort((a, b) => b.value - a.value);

    // Calculate account distribution
    const accountDistribution: AccountDistribution[] = this.balanceData.map(account => {
      const accountType = this.classifyAccountType(account);
      return {
        accountType: accountType.toUpperCase(),
        accountName: account.accountName || account.accountNumber || 'Unknown',
        value: account.portfolioValue || 0,
        percentage: totalValue > 0 ? ((account.portfolioValue || 0) / totalValue) * 100 : 0,
        color: CHART_COLORS.accountTypes[accountType as keyof typeof CHART_COLORS.accountTypes] || CHART_COLORS.primary[0],
        cashAmount: account.totalCash || 0,
        investedAmount: (account.portfolioValue || 0) - (account.totalCash || 0)
      };
    }).sort((a, b) => b.value - a.value);

    // Calculate top holdings
    const topHoldings: TopHolding[] = this.positionsData
      .filter(position => (position.marketValue || 0) > 0)
      .map(position => {
        const marketValue = position.marketValue || 0;
        const shares = position.numberOfShares || 0;
        const avgCost = shares > 0 ? marketValue / shares : 0;

        return {
          symbol: position.symbol || 'N/A',
          description: position.securityDescription || 'Unknown Security',
          marketValue,
          percentage: totalValue > 0 ? (marketValue / totalValue) * 100 : 0,
          shares,
          avgCost,
          gainLoss: 0, // Would need cost basis data
          gainLossPercentage: 0, // Would need cost basis data
          accountNumber: position.accountNumber || 'Unknown'
        };
      })
      .sort((a, b) => b.marketValue - a.marketValue)
      .slice(0, 20); // Top 20 holdings

    return {
      totalValue,
      totalCash,
      totalInvested,
      totalGainLoss: 0, // Would need historical data
      totalGainLossPercentage: 0, // Would need historical data
      accountCount: this.balanceData.length,
      positionCount: this.positionsData.length,
      topHoldings,
      assetAllocation,
      accountDistribution
    };
  }

  // Generate time series data (mock data for now)
  generateTimeSeriesData(days: number = 365): TimeSeriesPoint[] {
    const metrics = this.calculatePortfolioMetrics();
    const currentValue = metrics.totalValue;
    const data: TimeSeriesPoint[] = [];

    // Generate mock historical data
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Simulate portfolio growth with some volatility
      const daysFactor = (days - i) / days;
      const trend = 1 + (daysFactor * 0.15); // 15% annual growth
      const volatility = 1 + (Math.random() - 0.5) * 0.04; // ±2% daily volatility

      const value = Math.round(currentValue * trend * volatility);
      const previousValue = data.length > 0 ? data[data.length - 1].value : value;
      const dailyChange = value - previousValue;
      const dailyChangePercent = previousValue > 0 ? (dailyChange / previousValue) * 100 : 0;

      data.push({
        date: date.toISOString().split('T')[0],
        value,
        dailyChange,
        dailyChangePercent
      });
    }

    return data;
  }

  // Calculate risk and performance metrics
  calculatePerformanceMetrics(timeSeriesData: TimeSeriesPoint[]): PerformanceMetrics {
    if (timeSeriesData.length < 2) {
      return {
        ytdReturn: 0,
        oneYearReturn: 0,
        threeYearReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0
      };
    }

    const returns = timeSeriesData.slice(1).map((point, index) => {
      const previousValue = timeSeriesData[index].value;
      return previousValue > 0 ? ((point.value - previousValue) / previousValue) : 0;
    });

    const ytdStart = new Date().getFullYear();
    const ytdData = timeSeriesData.filter(point => new Date(point.date).getFullYear() === ytdStart);
    const ytdReturn = ytdData.length > 1
      ? ((ytdData[ytdData.length - 1].value - ytdData[0].value) / ytdData[0].value) * 100
      : 0;

    const oneYearReturn = timeSeriesData.length >= 252
      ? ((timeSeriesData[timeSeriesData.length - 1].value - timeSeriesData[timeSeriesData.length - 252].value) / timeSeriesData[timeSeriesData.length - 252].value) * 100
      : 0;

    const volatility = this.calculateVolatility(returns) * Math.sqrt(252) * 100; // Annualized volatility
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const sharpeRatio = volatility > 0 ? (avgReturn * 252) / (volatility / 100) : 0; // Assuming 0% risk-free rate

    const maxDrawdown = this.calculateMaxDrawdown(timeSeriesData) * 100;
    const winRate = (returns.filter(ret => ret > 0).length / returns.length) * 100;

    return {
      ytdReturn,
      oneYearReturn,
      threeYearReturn: 0, // Would need 3 years of data
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate
    };
  }

  // Calculate standard deviation of returns
  private calculateVolatility(returns: number[]): number {
    if (returns.length < 2) return 0;

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const squaredDiffs = returns.map(ret => Math.pow(ret - mean, 2));
    const variance = squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);

    return Math.sqrt(variance);
  }

  // Calculate maximum drawdown
  private calculateMaxDrawdown(data: TimeSeriesPoint[]): number {
    let maxDrawdown = 0;
    let peak = data[0]?.value || 0;

    for (const point of data) {
      if (point.value > peak) {
        peak = point.value;
      }

      const drawdown = peak > 0 ? (peak - point.value) / peak : 0;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  // Sector analysis (would need sector mapping)
  analyzeSectors(): { name: string; value: number; percentage: number; color: string }[] {
    // Mock sector data - in real implementation, would map symbols to sectors
    const sectorMap = new Map<string, number>();

    this.positionsData.forEach(position => {
      const sector = this.mapToSector(position.symbol || '');
      const value = position.marketValue || 0;
      sectorMap.set(sector, (sectorMap.get(sector) || 0) + value);
    });

    const totalValue = Array.from(sectorMap.values()).reduce((sum, val) => sum + val, 0);

    return Array.from(sectorMap.entries()).map(([name, value], index) => ({
      name,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      color: CHART_COLORS.primary[index % CHART_COLORS.primary.length]
    })).sort((a, b) => b.value - a.value);
  }

  // Map symbol to sector (mock implementation)
  private mapToSector(symbol: string): string {
    // This would typically use a symbol-to-sector mapping service
    const techSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'TSLA', 'NVDA'];
    const financeSymbols = ['JPM', 'BAC', 'WFC', 'C', 'GS', 'MS'];
    const healthSymbols = ['JNJ', 'PFE', 'ABBV', 'MRK', 'UNH'];

    const upperSymbol = symbol.toUpperCase();

    if (techSymbols.includes(upperSymbol)) return 'Technology';
    if (financeSymbols.includes(upperSymbol)) return 'Financial';
    if (healthSymbols.includes(upperSymbol)) return 'Healthcare';

    return 'Other';
  }

  // Risk analysis
  analyzeRisk(): {
    concentrationRisk: number;
    diversificationScore: number;
    riskAlerts: string[];
  } {
    const metrics = this.calculatePortfolioMetrics();
    const topHoldingPercentage = metrics.topHoldings[0]?.percentage || 0;
    const top5Percentage = metrics.topHoldings.slice(0, 5).reduce((sum, holding) => sum + holding.percentage, 0);

    const concentrationRisk = Math.max(topHoldingPercentage, top5Percentage * 0.4);
    const diversificationScore = Math.max(0, 100 - concentrationRisk * 2);

    const riskAlerts: string[] = [];

    if (topHoldingPercentage > 20) {
      riskAlerts.push(`Single position represents ${topHoldingPercentage.toFixed(1)}% of portfolio`);
    }

    if (top5Percentage > 60) {
      riskAlerts.push(`Top 5 positions represent ${top5Percentage.toFixed(1)}% of portfolio`);
    }

    if (metrics.assetAllocation.length < 3) {
      riskAlerts.push('Limited asset class diversification');
    }

    return {
      concentrationRisk,
      diversificationScore,
      riskAlerts
    };
  }
}

// Utility functions for formatting
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatPercentage = (percentage: number, decimals: number = 1): string => {
  return `${percentage.toFixed(decimals)}%`;
};

export const formatCompactNumber = (num: number): string => {
  if (num >= 1e9) {
    return `$${(num / 1e9).toFixed(1)}B`;
  } else if (num >= 1e6) {
    return `$${(num / 1e6).toFixed(1)}M`;
  } else if (num >= 1e3) {
    return `$${(num / 1e3).toFixed(1)}K`;
  } else {
    return `$${num.toFixed(0)}`;
  }
};

// Hook for using portfolio analytics
export const usePortfolioAnalytics = (balanceData: AccountBalance[], positionsData: AccountPosition[]) => {
  const analyzer = new PortfolioAnalyzer(balanceData, positionsData);

  return {
    calculateMetrics: () => analyzer.calculatePortfolioMetrics(),
    generateTimeSeriesData: (days?: number) => analyzer.generateTimeSeriesData(days),
    calculatePerformance: (data: TimeSeriesPoint[]) => analyzer.calculatePerformanceMetrics(data),
    analyzeSectors: () => analyzer.analyzeSectors(),
    analyzeRisk: () => analyzer.analyzeRisk(),
    formatCurrency,
    formatPercentage,
    formatCompactNumber
  };
};