import { AccountBalance, AccountPosition } from '../types/DataTypes';
import { FilterCondition } from '../contexts/SearchContext';

// Types for search optimization
export interface SearchIndex {
  [key: string]: {
    [value: string]: Set<number>; // Map values to indices for quick lookup
  };
}

export interface SearchOptions {
  caseSensitive?: boolean;
  fuzzyThreshold?: number; // 0-1, higher is more fuzzy
  highlightMatches?: boolean;
  maxResults?: number;
  sortByRelevance?: boolean;
}

export interface SearchResult<T> {
  item: T;
  relevanceScore: number;
  matchedFields: string[];
  highlights: { [field: string]: string };
}

export interface SearchMetrics {
  searchTime: number;
  totalResults: number;
  indexTime?: number;
  cacheHits?: number;
}

// Search performance optimizer
export class SearchPerformanceOptimizer {
  private searchIndex: SearchIndex = {};
  private lastIndexed: number = 0;
  private cache = new Map<string, any>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  // Build search index for faster lookups
  buildIndex(data: any[], fields: string[]): void {
    const startTime = performance.now();
    this.searchIndex = {};

    data.forEach((item, index) => {
      fields.forEach(field => {
        if (!this.searchIndex[field]) {
          this.searchIndex[field] = {};
        }

        const value = this.normalizeValue(item[field]);
        if (value) {
          // Index full value
          if (!this.searchIndex[field][value]) {
            this.searchIndex[field][value] = new Set();
          }
          this.searchIndex[field][value].add(index);

          // Index partial values for prefix matching
          for (let i = 1; i <= value.length; i++) {
            const prefix = value.substring(0, i);
            if (!this.searchIndex[field][prefix]) {
              this.searchIndex[field][prefix] = new Set();
            }
            this.searchIndex[field][prefix].add(index);
          }

          // Index words for word-based search
          if (typeof item[field] === 'string') {
            const words = value.split(/\s+/);
            words.forEach(word => {
              if (word && word.length > 2) {
                if (!this.searchIndex[field][word]) {
                  this.searchIndex[field][word] = new Set();
                }
                this.searchIndex[field][word].add(index);
              }
            });
          }
        }
      });
    });

    this.lastIndexed = Date.now();
    console.log(`Search index built in ${performance.now() - startTime}ms`);
  }

  private normalizeValue(value: any): string {
    if (value === null || value === undefined) return '';
    return value.toString().toLowerCase().trim();
  }

  // Fast search using index
  searchWithIndex<T>(
    data: T[],
    query: string,
    fields: string[],
    options: SearchOptions = {}
  ): SearchResult<T>[] {
    const cacheKey = `${query}:${fields.join(',')}:${JSON.stringify(options)}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.results;
      }
      this.cache.delete(cacheKey);
    }

    const startTime = performance.now();
    const normalizedQuery = this.normalizeValue(query);

    if (!normalizedQuery) return [];

    // Find matching indices using index
    const matchingIndices = new Set<number>();
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    queryWords.forEach(word => {
      fields.forEach(field => {
        if (this.searchIndex[field]) {
          // Exact match
          if (this.searchIndex[field][word]) {
            this.searchIndex[field][word].forEach(idx => matchingIndices.add(idx));
          }

          // Prefix matching for longer words
          if (word.length >= 3) {
            Object.keys(this.searchIndex[field]).forEach(indexedValue => {
              if (indexedValue.startsWith(word) && this.searchIndex[field][indexedValue]) {
                this.searchIndex[field][indexedValue].forEach(idx => matchingIndices.add(idx));
              }
            });
          }
        }
      });
    });

    // Convert indices to results with relevance scoring
    const results: SearchResult<T>[] = [];
    matchingIndices.forEach(index => {
      if (index < data.length) {
        const item = data[index];
        const result = this.calculateRelevance(item, query, fields, options);
        if (result.relevanceScore > 0) {
          results.push(result);
        }
      }
    });

    // Sort by relevance if requested
    if (options.sortByRelevance !== false) {
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // Limit results
    const limitedResults = options.maxResults
      ? results.slice(0, options.maxResults)
      : results;

    // Cache results
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Remove oldest entries
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)).forEach(([key]) => {
        this.cache.delete(key);
      });
    }

    this.cache.set(cacheKey, {
      results: limitedResults,
      timestamp: Date.now()
    });

    return limitedResults;
  }

  private calculateRelevance<T>(
    item: T,
    query: string,
    fields: string[],
    options: SearchOptions
  ): SearchResult<T> {
    const normalizedQuery = this.normalizeValue(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    let totalScore = 0;
    const matchedFields: string[] = [];
    const highlights: { [field: string]: string } = {};

    fields.forEach(field => {
      const fieldValue = (item as any)[field];
      if (fieldValue === null || fieldValue === undefined) return;

      const normalizedValue = this.normalizeValue(fieldValue);
      let fieldScore = 0;

      queryWords.forEach(word => {
        // Exact match (highest score)
        if (normalizedValue === word) {
          fieldScore += 100;
        }
        // Starts with (high score)
        else if (normalizedValue.startsWith(word)) {
          fieldScore += 80;
        }
        // Contains (medium score)
        else if (normalizedValue.includes(word)) {
          fieldScore += 50;
        }
        // Fuzzy match (low score)
        else if (options.fuzzyThreshold && this.fuzzyMatch(normalizedValue, word, options.fuzzyThreshold)) {
          fieldScore += 20;
        }
      });

      // Boost score for shorter matches (more precise)
      if (fieldScore > 0) {
        fieldScore *= (1 + (1 / normalizedValue.length));
        totalScore += fieldScore;
        matchedFields.push(field);

        // Generate highlights
        if (options.highlightMatches) {
          highlights[field] = this.highlightMatches(fieldValue.toString(), queryWords);
        }
      }
    });

    return {
      item,
      relevanceScore: totalScore,
      matchedFields,
      highlights
    };
  }

  private fuzzyMatch(text: string, pattern: string, threshold: number): boolean {
    if (pattern.length === 0) return true;
    if (text.length === 0) return false;

    const distance = this.levenshteinDistance(text, pattern);
    const maxDistance = Math.floor(pattern.length * (1 - threshold));
    return distance <= maxDistance;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[b.length][a.length];
  }

  private highlightMatches(text: string, queryWords: string[]): string {
    let highlightedText = text;
    queryWords.forEach(word => {
      const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    return highlightedText;
  }

  private escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Clear cache (useful for memory management)
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Would need to track hits vs misses
    };
  }
}

// Advanced filter utilities
export class FilterUtils {
  static applyFilters<T>(
    data: T[],
    filters: FilterCondition[],
    options: { parallel?: boolean } = {}
  ): T[] {
    if (filters.length === 0) return data;

    const filterFunctions = filters.map(filter => this.createFilterFunction<T>(filter));

    if (options.parallel && data.length > 1000) {
      // For large datasets, use parallel processing simulation
      return this.parallelFilter(data, filterFunctions);
    }

    return data.filter(item => filterFunctions.every(fn => fn(item)));
  }

  private static parallelFilter<T>(data: T[], filterFunctions: ((item: T) => boolean)[]): T[] {
    // Simulate parallel processing by chunking data
    const chunkSize = Math.ceil(data.length / 4);
    const chunks: T[][] = [];

    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    // Process chunks and combine results
    const results = chunks.map(chunk =>
      chunk.filter(item => filterFunctions.every(fn => fn(item)))
    );

    return results.flat();
  }

  private static createFilterFunction<T>(filter: FilterCondition): (item: T) => boolean {
    return (item: T) => {
      const fieldValue = (item as any)[filter.field];

      if (fieldValue === null || fieldValue === undefined) {
        return false;
      }

      switch (filter.operator) {
        case 'equals':
          return this.normalize(fieldValue) === this.normalize(filter.value);

        case 'contains':
          return this.normalize(fieldValue).includes(this.normalize(filter.value));

        case 'startsWith':
          return this.normalize(fieldValue).startsWith(this.normalize(filter.value));

        case 'endsWith':
          return this.normalize(fieldValue).endsWith(this.normalize(filter.value));

        case 'gt':
          return this.toNumber(fieldValue) > this.toNumber(filter.value);

        case 'gte':
          return this.toNumber(fieldValue) >= this.toNumber(filter.value);

        case 'lt':
          return this.toNumber(fieldValue) < this.toNumber(filter.value);

        case 'lte':
          return this.toNumber(fieldValue) <= this.toNumber(filter.value);

        case 'between':
          const numValue = this.toNumber(fieldValue);
          const min = this.toNumber(filter.value.min);
          const max = this.toNumber(filter.value.max);
          return numValue >= min && numValue <= max;

        case 'in':
          return Array.isArray(filter.value) && filter.value.includes(fieldValue);

        default:
          return true;
      }
    };
  }

  private static normalize(value: any): string {
    if (value === null || value === undefined) return '';
    return value.toString().toLowerCase().trim();
  }

  private static toNumber(value: any): number {
    if (typeof value === 'number') return value;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
}

// Highlighting utilities
export class HighlightUtils {
  static highlightText(text: string, searchTerm: string, className = 'highlight'): string {
    if (!text || !searchTerm) return text;

    const regex = new RegExp(`(${this.escapeRegex(searchTerm)})`, 'gi');
    return text.replace(regex, `<span class="${className}">$1</span>`);
  }

  static highlightTextReact(text: string, searchTerm: string): string {
    // Return HTML string that React can render safely
    if (!text || !searchTerm) return text;
    return this.highlightText(text, searchTerm);
  }

  static highlightMultipleTerms(text: string, terms: string[], className = 'highlight'): string {
    if (!text || !terms.length) return text;

    let result = text;
    terms.forEach((term, index) => {
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      result = result.replace(regex, `<span class="${className} ${className}-${index % 5}"">$1</span>`);
    });
    return result;
  }

  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// Performance monitoring
export class SearchMetricsCollector {
  private metrics: SearchMetrics[] = [];
  private readonly MAX_METRICS = 100;

  recordSearch(metrics: SearchMetrics): void {
    this.metrics.push({
      ...metrics,
      timestamp: Date.now()
    } as SearchMetrics & { timestamp: number });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  getAverageSearchTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.searchTime, 0);
    return total / this.metrics.length;
  }

  getSlowSearches(threshold = 100): SearchMetrics[] {
    return this.metrics.filter(m => m.searchTime > threshold);
  }

  clearMetrics(): void {
    this.metrics = [];
  }
}

// Export singleton instances
export const searchOptimizer = new SearchPerformanceOptimizer();
export const metricsCollector = new SearchMetricsCollector();

// Utility functions
export const searchUtils = {
  // Debounce function for search input
  debounce<T extends (...args: any[]) => void>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  },

  // Throttle function for scroll-based search updates
  throttle<T extends (...args: any[]) => void>(func: T, limit: number): T {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  },

  // Extract searchable text from objects
  extractSearchableText(obj: any, fields?: string[]): string {
    if (!obj) return '';

    const fieldsToSearch = fields || Object.keys(obj);
    return fieldsToSearch
      .map(field => {
        const value = obj[field];
        if (value === null || value === undefined) return '';
        return value.toString();
      })
      .join(' ')
      .toLowerCase();
  },

  // Get field suggestions based on data
  getFieldSuggestions(data: any[], fieldName: string, limit = 10): string[] {
    const values = new Set<string>();

    data.forEach(item => {
      const value = item[fieldName];
      if (value !== null && value !== undefined && value !== '') {
        values.add(value.toString());
      }
    });

    return Array.from(values).slice(0, limit).sort();
  }
};