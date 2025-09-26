// Advanced search suggestions and autocomplete engine
import { AccountBalance, AccountPosition } from '../types/DataTypes';

export interface SearchSuggestion {
  id: string;
  text: string;
  category: 'recent' | 'popular' | 'account' | 'symbol' | 'field' | 'value' | 'pattern';
  type: 'exact' | 'fuzzy' | 'prefix' | 'pattern';
  relevanceScore: number;
  metadata?: {
    count?: number;
    lastUsed?: string;
    dataType?: string;
    fieldName?: string;
    sampleValue?: string;
  };
  icon?: string;
  description?: string;
}

export interface SuggestionEngineOptions {
  maxSuggestions?: number;
  includeRecentSearches?: boolean;
  includePopularSearches?: boolean;
  includeDataSuggestions?: boolean;
  includePatternSuggestions?: boolean;
  fuzzyThreshold?: number;
}

export class SearchSuggestionEngine {
  private recentSearches: string[] = [];
  private popularSearches: Map<string, number> = new Map();
  private dataCache: {
    balanceData?: AccountBalance[];
    positionsData?: AccountPosition[];
    lastUpdated?: number;
  } = {};
  private fieldSuggestions: Map<string, Set<string>> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RECENT = 10;
  private readonly MAX_POPULAR = 20;

  constructor() {
    this.loadFromStorage();
  }

  // Main suggestion generation method
  generateSuggestions(
    query: string,
    balanceData: AccountBalance[] = [],
    positionsData: AccountPosition[] = [],
    options: SuggestionEngineOptions = {}
  ): SearchSuggestion[] {
    const opts: Required<SuggestionEngineOptions> = {
      maxSuggestions: 8,
      includeRecentSearches: true,
      includePopularSearches: true,
      includeDataSuggestions: true,
      includePatternSuggestions: true,
      fuzzyThreshold: 0.6,
      ...options
    };

    // Update data cache if needed
    this.updateDataCache(balanceData, positionsData);

    const suggestions: SearchSuggestion[] = [];
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      // Return recent and popular searches when no query
      return this.getEmptyQuerySuggestions(opts);
    }

    // Recent searches
    if (opts.includeRecentSearches) {
      suggestions.push(...this.getRecentSearchSuggestions(normalizedQuery));
    }

    // Popular searches
    if (opts.includePopularSearches) {
      suggestions.push(...this.getPopularSearchSuggestions(normalizedQuery));
    }

    // Data-based suggestions
    if (opts.includeDataSuggestions) {
      suggestions.push(...this.getDataBasedSuggestions(normalizedQuery, opts.fuzzyThreshold));
    }

    // Pattern suggestions
    if (opts.includePatternSuggestions) {
      suggestions.push(...this.getPatternSuggestions(normalizedQuery));
    }

    // Sort by relevance and remove duplicates
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    return uniqueSuggestions
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, opts.maxSuggestions);
  }

  // Record search usage
  recordSearch(query: string): void {
    if (!query.trim()) return;

    const normalizedQuery = query.trim();

    // Update recent searches
    this.recentSearches = [
      normalizedQuery,
      ...this.recentSearches.filter(s => s !== normalizedQuery)
    ].slice(0, this.MAX_RECENT);

    // Update popular searches
    const currentCount = this.popularSearches.get(normalizedQuery) || 0;
    this.popularSearches.set(normalizedQuery, currentCount + 1);

    // Keep only top popular searches
    if (this.popularSearches.size > this.MAX_POPULAR) {
      const sorted = Array.from(this.popularSearches.entries())
        .sort(([,a], [,b]) => b - a);
      this.popularSearches = new Map(sorted.slice(0, this.MAX_POPULAR));
    }

    this.saveToStorage();
  }

  // Get suggestions for empty query
  private getEmptyQuerySuggestions(options: Required<SuggestionEngineOptions>): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Recent searches
    suggestions.push(...this.recentSearches.slice(0, 3).map((search, index) => ({
      id: `recent-${index}`,
      text: search,
      category: 'recent' as const,
      type: 'exact' as const,
      relevanceScore: 100 - index * 10,
      icon: '🕐',
      description: 'Recent search'
    })));

    // Popular searches
    const popular = Array.from(this.popularSearches.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    suggestions.push(...popular.map(([search, count], index) => ({
      id: `popular-${index}`,
      text: search,
      category: 'popular' as const,
      type: 'exact' as const,
      relevanceScore: 90 - index * 5,
      metadata: { count },
      icon: '🔥',
      description: `Used ${count} times`
    })));

    // Common field suggestions
    const commonFields = ['Account', 'Symbol', 'AAPL', 'IRA', 'Cash', 'Bond'];
    suggestions.push(...commonFields.slice(0, 2).map((field, index) => ({
      id: `field-${index}`,
      text: field,
      category: 'field' as const,
      type: 'exact' as const,
      relevanceScore: 80 - index * 5,
      icon: '💡',
      description: 'Common search term'
    })));

    return suggestions.slice(0, options.maxSuggestions);
  }

  // Get recent search suggestions
  private getRecentSearchSuggestions(query: string): SearchSuggestion[] {
    return this.recentSearches
      .filter(search => search.toLowerCase().includes(query))
      .slice(0, 2)
      .map((search, index) => ({
        id: `recent-${search}`,
        text: search,
        category: 'recent' as const,
        type: 'exact' as const,
        relevanceScore: 95 - index * 5,
        icon: '🕐',
        description: 'Recent search'
      }));
  }

  // Get popular search suggestions
  private getPopularSearchSuggestions(query: string): SearchSuggestion[] {
    return Array.from(this.popularSearches.entries())
      .filter(([search]) => search.toLowerCase().includes(query))
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([search, count], index) => ({
        id: `popular-${search}`,
        text: search,
        category: 'popular' as const,
        type: 'exact' as const,
        relevanceScore: 85 - index * 5,
        metadata: { count },
        icon: '🔥',
        description: `Used ${count} times`
      }));
  }

  // Get data-based suggestions
  private getDataBasedSuggestions(query: string, fuzzyThreshold: number): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];
    const { balanceData = [], positionsData = [] } = this.dataCache;

    // Account suggestions
    const accounts = this.extractUniqueValues(balanceData, ['accountNumber', 'accountName']);
    suggestions.push(...this.createValueSuggestions(
      accounts,
      query,
      'account',
      '🏦',
      fuzzyThreshold
    ));

    // Symbol suggestions
    const symbols = this.extractUniqueValues(positionsData, ['symbol', 'securityDescription']);
    suggestions.push(...this.createValueSuggestions(
      symbols,
      query,
      'symbol',
      '📈',
      fuzzyThreshold
    ));

    // Security type suggestions
    const securityTypes = this.extractUniqueValues(positionsData, ['securityType']);
    suggestions.push(...this.createValueSuggestions(
      securityTypes,
      query,
      'field',
      '🏷️',
      fuzzyThreshold
    ));

    return suggestions;
  }

  // Get pattern-based suggestions
  private getPatternSuggestions(query: string): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    // Number patterns
    if (/^\d/.test(query)) {
      suggestions.push({
        id: `pattern-account-${query}`,
        text: `Account ${query}*`,
        category: 'pattern',
        type: 'pattern',
        relevanceScore: 70,
        icon: '🔍',
        description: 'Search accounts starting with these digits'
      });
    }

    // Symbol patterns (3-5 uppercase letters)
    if (/^[A-Za-z]{1,5}$/.test(query)) {
      suggestions.push({
        id: `pattern-symbol-${query}`,
        text: `${query.toUpperCase()}*`,
        category: 'pattern',
        type: 'pattern',
        relevanceScore: 75,
        icon: '📊',
        description: 'Search symbols starting with these letters'
      });
    }

    // Dollar amount patterns
    if (/^[\$\d,\.]+$/.test(query)) {
      suggestions.push({
        id: `pattern-amount-${query}`,
        text: `Amount ≥ ${query}`,
        category: 'pattern',
        type: 'pattern',
        relevanceScore: 65,
        icon: '💰',
        description: 'Search amounts greater than or equal to this value'
      });
    }

    return suggestions;
  }

  // Extract unique values from data
  private extractUniqueValues(data: any[], fields: string[]): Map<string, number> {
    const values = new Map<string, number>();

    data.forEach(item => {
      fields.forEach(field => {
        const value = item[field];
        if (value && typeof value === 'string' && value.trim()) {
          const normalized = value.trim();
          values.set(normalized, (values.get(normalized) || 0) + 1);
        }
      });
    });

    return values;
  }

  // Create suggestions from values
  private createValueSuggestions(
    values: Map<string, number>,
    query: string,
    category: SearchSuggestion['category'],
    icon: string,
    fuzzyThreshold: number
  ): SearchSuggestion[] {
    const suggestions: SearchSuggestion[] = [];

    values.forEach((count, value) => {
      const similarity = this.calculateSimilarity(value.toLowerCase(), query);

      if (similarity >= fuzzyThreshold || value.toLowerCase().includes(query)) {
        const type: SearchSuggestion['type'] = value.toLowerCase().startsWith(query) ? 'prefix' :
                                             value.toLowerCase().includes(query) ? 'exact' :
                                             'fuzzy';

        suggestions.push({
          id: `${category}-${value}`,
          text: value,
          category,
          type,
          relevanceScore: (similarity * 100) + (count * 0.1),
          metadata: { count },
          icon,
          description: `Found in ${count} record${count !== 1 ? 's' : ''}`
        });
      }
    });

    return suggestions.slice(0, 3); // Limit per category
  }

  // Calculate similarity between strings
  private calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1;
    if (str1.startsWith(str2)) return 0.9;
    if (str1.includes(str2)) return 0.7;

    // Simple Levenshtein distance approximation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Remove duplicate suggestions
  private removeDuplicates(suggestions: SearchSuggestion[]): SearchSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = `${suggestion.text.toLowerCase()}-${suggestion.category}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Update data cache
  private updateDataCache(balanceData: AccountBalance[], positionsData: AccountPosition[]): void {
    const now = Date.now();
    const shouldUpdate = !this.dataCache.lastUpdated ||
                        (now - this.dataCache.lastUpdated) > this.CACHE_DURATION ||
                        this.dataCache.balanceData?.length !== balanceData.length ||
                        this.dataCache.positionsData?.length !== positionsData.length;

    if (shouldUpdate) {
      this.dataCache = {
        balanceData: [...balanceData],
        positionsData: [...positionsData],
        lastUpdated: now
      };
    }
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('searchSuggestionEngine');
      if (stored) {
        const data = JSON.parse(stored);
        this.recentSearches = data.recentSearches || [];
        this.popularSearches = new Map(data.popularSearches || []);
      }
    } catch (error) {
      console.warn('Failed to load search suggestion data:', error);
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    try {
      const data = {
        recentSearches: this.recentSearches,
        popularSearches: Array.from(this.popularSearches.entries())
      };
      localStorage.setItem('searchSuggestionEngine', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save search suggestion data:', error);
    }
  }

  // Clear all stored data
  clearStorage(): void {
    this.recentSearches = [];
    this.popularSearches.clear();
    this.dataCache = {};
    localStorage.removeItem('searchSuggestionEngine');
  }

  // Get statistics
  getStatistics(): {
    recentSearchCount: number;
    popularSearchCount: number;
    totalSearches: number;
  } {
    const totalSearches = Array.from(this.popularSearches.values())
      .reduce((sum, count) => sum + count, 0);

    return {
      recentSearchCount: this.recentSearches.length,
      popularSearchCount: this.popularSearches.size,
      totalSearches
    };
  }
}

// Singleton instance
export const searchSuggestionEngine = new SearchSuggestionEngine();