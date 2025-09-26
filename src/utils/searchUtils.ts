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

// Enhanced search performance optimizer with advanced algorithms
export class SearchPerformanceOptimizer {
  private searchIndex: SearchIndex = {};
  private invertedIndex: Map<string, Set<number>> = new Map();
  private ngramIndex: Map<string, Set<number>> = new Map();
  private lastIndexed: number = 0;
  private cache = new Map<string, any>();
  private lruCache = new Map<string, { data: any; timestamp: number; accessCount: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 200;
  private readonly MAX_LRU_SIZE = 100;
  private readonly NGRAM_SIZE = 3;
  private performanceMetrics: {
    searchTimes: number[];
    indexingTime: number;
    cacheHitRate: number;
    totalSearches: number;
    cacheHits: number;
  } = {
    searchTimes: [],
    indexingTime: 0,
    cacheHitRate: 0,
    totalSearches: 0,
    cacheHits: 0,
  };

  // Enhanced build index with multiple indexing strategies
  buildIndex(data: any[], fields: string[]): void {
    const startTime = performance.now();
    this.searchIndex = {};
    this.invertedIndex.clear();
    this.ngramIndex.clear();

    // Build multiple index types for optimal search performance
    data.forEach((item, index) => {
      fields.forEach(field => {
        if (!this.searchIndex[field]) {
          this.searchIndex[field] = {};
        }

        const value = this.normalizeValue(item[field]);
        if (value) {
          // 1. Standard exact matching index
          this.addToIndex(this.searchIndex[field], value, index);

          // 2. Inverted index for full-text search
          this.buildInvertedIndex(value, index);

          // 3. N-gram index for fuzzy matching
          this.buildNgramIndex(value, index);

          // 4. Prefix index for autocomplete
          this.buildPrefixIndex(this.searchIndex[field], value, index);

          // 5. Word-based index for multi-word search
          this.buildWordIndex(this.searchIndex[field], value, index);

          // 6. Phonetic index for sound-alike matching (optional)
          if (typeof item[field] === 'string' && value.length > 3) {
            const soundex = this.soundex(value);
            this.addToIndex(this.searchIndex[field], `soundex:${soundex}`, index);
          }
        }
      });
    });

    this.performanceMetrics.indexingTime = performance.now() - startTime;
    this.lastIndexed = Date.now();
    console.log(`Enhanced search index built in ${this.performanceMetrics.indexingTime.toFixed(2)}ms`);
    console.log(`Index stats: ${this.invertedIndex.size} terms, ${this.ngramIndex.size} n-grams`);
  }

  private addToIndex(index: any, key: string, itemIndex: number): void {
    if (!index[key]) {
      index[key] = new Set();
    }
    index[key].add(itemIndex);
  }

  private buildInvertedIndex(value: string, index: number): void {
    const words = value.toLowerCase().split(/\s+|[^\w]/);
    words.forEach(word => {
      if (word.length > 1) {
        if (!this.invertedIndex.has(word)) {
          this.invertedIndex.set(word, new Set());
        }
        this.invertedIndex.get(word)!.add(index);
      }
    });
  }

  private buildNgramIndex(value: string, index: number): void {
    // Create n-grams for fuzzy matching
    for (let i = 0; i <= value.length - this.NGRAM_SIZE; i++) {
      const ngram = value.substring(i, i + this.NGRAM_SIZE);
      if (!this.ngramIndex.has(ngram)) {
        this.ngramIndex.set(ngram, new Set());
      }
      this.ngramIndex.get(ngram)!.add(index);
    }
  }

  private buildPrefixIndex(index: any, value: string, itemIndex: number): void {
    // Build prefix index with intelligent length limits
    const maxPrefixLength = Math.min(value.length, 20);
    for (let i = 1; i <= maxPrefixLength; i++) {
      const prefix = value.substring(0, i);
      this.addToIndex(index, `prefix:${prefix}`, itemIndex);
    }
  }

  private buildWordIndex(index: any, value: string, itemIndex: number): void {
    const words = value.split(/\s+/);
    words.forEach(word => {
      if (word && word.length > 2) {
        this.addToIndex(index, `word:${word}`, itemIndex);
      }
    });
  }

  // Soundex algorithm for phonetic matching
  private soundex(str: string): string {
    str = str.toLowerCase().replace(/[^a-z]/g, '');
    if (!str) return '0000';

    const firstLetter = str[0];
    str = str.replace(/[hw]/g, '');

    const mapping = {
      'bfpv': '1', 'cgjkqsxz': '2', 'dt': '3',
      'l': '4', 'mn': '5', 'r': '6'
    };

    let soundexCode = firstLetter;
    for (let i = 1; i < str.length; i++) {
      const char = str[i];
      for (const [chars, code] of Object.entries(mapping)) {
        if (chars.includes(char) && soundexCode[soundexCode.length - 1] !== code) {
          soundexCode += code;
          break;
        }
      }
      if (soundexCode.length >= 4) break;
    }

    return soundexCode.padEnd(4, '0').substring(0, 4);
  }

  private normalizeValue(value: any): string {
    if (value === null || value === undefined) return '';
    return value.toString().toLowerCase().trim();
  }

  // Enhanced fast search with multiple matching strategies
  searchWithIndex<T>(
    data: T[],
    query: string,
    fields: string[],
    options: SearchOptions = {}
  ): SearchResult<T>[] {
    const cacheKey = `${query}:${fields.join(',')}:${JSON.stringify(options)}`;
    this.performanceMetrics.totalSearches++;

    // Check LRU cache first
    const lruCached = this.lruCache.get(cacheKey);
    if (lruCached && Date.now() - lruCached.timestamp < this.CACHE_TTL) {
      lruCached.accessCount++;
      this.performanceMetrics.cacheHits++;
      this.updateCacheMetrics();
      return lruCached.data;
    }

    // Check regular cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.performanceMetrics.cacheHits++;
        this.updateCacheMetrics();
        return cached.results;
      }
      this.cache.delete(cacheKey);
    }

    const startTime = performance.now();
    const normalizedQuery = this.normalizeValue(query);

    if (!normalizedQuery) return [];

    // Multi-strategy search approach
    const searchStrategies = [
      () => this.exactSearch(normalizedQuery, fields),
      () => this.fuzzySearch(normalizedQuery, fields, options.fuzzyThreshold || 0.7),
      () => this.ngramSearch(normalizedQuery, fields),
      () => this.phoneticSearch(normalizedQuery, fields),
      () => this.invertedIndexSearch(normalizedQuery, fields)
    ];

    const matchingIndices = new Map<number, number>(); // index -> match strength

    // Execute search strategies with weighted scoring
    searchStrategies.forEach((strategy, strategyIndex) => {
      const strategyResults = strategy();
      const weight = [1.0, 0.8, 0.6, 0.4, 0.7][strategyIndex]; // Strategy weights

      strategyResults.forEach(index => {
        const currentScore = matchingIndices.get(index) || 0;
        matchingIndices.set(index, currentScore + weight);
      });
    });

    // Convert to results with enhanced relevance scoring
    const results: SearchResult<T>[] = [];
    matchingIndices.forEach((matchStrength, index) => {
      if (index < data.length) {
        const item = data[index];
        const result = this.calculateEnhancedRelevance(item, query, fields, options, matchStrength);
        if (result.relevanceScore > 0) {
          results.push(result);
        }
      }
    });

    // Advanced sorting with multiple criteria
    this.sortResults(results, options);

    // Limit results
    const limitedResults = options.maxResults
      ? results.slice(0, options.maxResults)
      : results;

    // Record performance metrics
    const searchTime = performance.now() - startTime;
    this.performanceMetrics.searchTimes.push(searchTime);
    if (this.performanceMetrics.searchTimes.length > 100) {
      this.performanceMetrics.searchTimes.shift();
    }

    // Enhanced caching with LRU
    this.cacheResults(cacheKey, limitedResults);
    this.updateCacheMetrics();

    return limitedResults;
  }

  private exactSearch(query: string, fields: string[]): number[] {
    const results: number[] = [];
    fields.forEach(field => {
      if (this.searchIndex[field] && this.searchIndex[field][query]) {
        this.searchIndex[field][query].forEach(idx => results.push(idx));
      }
    });
    return results;
  }

  private fuzzySearch(query: string, fields: string[], threshold: number): number[] {
    const results: number[] = [];
    fields.forEach(field => {
      if (this.searchIndex[field]) {
        Object.keys(this.searchIndex[field]).forEach(key => {
          if (this.jaccardSimilarity(query, key) >= threshold) {
            this.searchIndex[field][key].forEach(idx => results.push(idx));
          }
        });
      }
    });
    return results;
  }

  private ngramSearch(query: string, fields: string[]): number[] {
    const queryNgrams = this.generateNgrams(query, this.NGRAM_SIZE);
    const candidateIndices = new Set<number>();

    queryNgrams.forEach(ngram => {
      if (this.ngramIndex.has(ngram)) {
        this.ngramIndex.get(ngram)!.forEach(idx => candidateIndices.add(idx));
      }
    });

    return Array.from(candidateIndices);
  }

  private phoneticSearch(query: string, fields: string[]): number[] {
    const querySoundex = this.soundex(query);
    const results: number[] = [];

    fields.forEach(field => {
      if (this.searchIndex[field] && this.searchIndex[field][`soundex:${querySoundex}`]) {
        this.searchIndex[field][`soundex:${querySoundex}`].forEach(idx => results.push(idx));
      }
    });

    return results;
  }

  private invertedIndexSearch(query: string, fields: string[]): number[] {
    const words = query.toLowerCase().split(/\s+/);
    const results: number[] = [];

    words.forEach(word => {
      if (this.invertedIndex.has(word)) {
        this.invertedIndex.get(word)!.forEach(idx => results.push(idx));
      }
    });

    return results;
  }

  private generateNgrams(text: string, n: number): string[] {
    const ngrams: string[] = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    return ngrams;
  }

  private jaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(this.generateNgrams(str1, 2));
    const set2 = new Set(this.generateNgrams(str2, 2));

    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);

    return intersection.size / union.size;
  }

  // Enhanced relevance calculation with multiple factors
  private calculateEnhancedRelevance<T>(
    item: T,
    query: string,
    fields: string[],
    options: SearchOptions,
    matchStrength: number
  ): SearchResult<T> {
    const normalizedQuery = this.normalizeValue(query);
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

    let totalScore = 0;
    const matchedFields: string[] = [];
    const highlights: { [field: string]: string } = {};

    // Field importance weights
    const fieldWeights: { [key: string]: number } = {
      'accountNumber': 1.5,
      'symbol': 1.3,
      'accountName': 1.2,
      'securityDescription': 1.0,
      'securityType': 0.8
    };

    fields.forEach(field => {
      const fieldValue = (item as any)[field];
      if (fieldValue === null || fieldValue === undefined) return;

      const normalizedValue = this.normalizeValue(fieldValue);
      let fieldScore = 0;

      queryWords.forEach(word => {
        // Multiple scoring factors
        const exactMatch = normalizedValue === word ? 100 : 0;
        const startsWithMatch = normalizedValue.startsWith(word) ? 80 : 0;
        const containsMatch = normalizedValue.includes(word) ? 50 : 0;
        const editDistance = this.calculateEditDistance(normalizedValue, word);
        const fuzzyScore = Math.max(0, 30 - editDistance * 5);
        const ngramScore = this.calculateNgramSimilarity(normalizedValue, word) * 25;

        fieldScore += Math.max(exactMatch, startsWithMatch, containsMatch, fuzzyScore, ngramScore);
      });

      if (fieldScore > 0) {
        // Apply field weight
        const fieldWeight = fieldWeights[field] || 1.0;
        fieldScore *= fieldWeight;

        // Position bonus (earlier fields get higher scores)
        const positionBonus = 1 + (1 / (fields.indexOf(field) + 1));
        fieldScore *= positionBonus;

        // Length penalty/bonus
        const lengthFactor = this.calculateLengthFactor(normalizedValue, normalizedQuery);
        fieldScore *= lengthFactor;

        totalScore += fieldScore;
        matchedFields.push(field);

        // Generate highlights
        if (options.highlightMatches) {
          highlights[field] = this.highlightMatches(fieldValue.toString(), queryWords);
        }
      }
    });

    // Apply match strength from search strategies
    totalScore *= (1 + matchStrength);

    // Query coverage bonus (how much of the query was matched)
    const queryCoverage = this.calculateQueryCoverage(query, matchedFields, item as any);
    totalScore *= (1 + queryCoverage);

    return {
      item,
      relevanceScore: totalScore,
      matchedFields,
      highlights
    };
  }

  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateNgramSimilarity(str1: string, str2: string): number {
    const ngrams1 = new Set(this.generateNgrams(str1, 2));
    const ngrams2 = new Set(this.generateNgrams(str2, 2));

    const intersection = new Set(Array.from(ngrams1).filter(x => ngrams2.has(x)));
    const union = new Set([...Array.from(ngrams1), ...Array.from(ngrams2)]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private calculateLengthFactor(fieldValue: string, query: string): number {
    const lengthRatio = query.length / fieldValue.length;

    if (lengthRatio > 0.8) return 1.2; // Query is most of the field
    if (lengthRatio > 0.5) return 1.1; // Query is significant portion
    if (lengthRatio > 0.1) return 1.0; // Normal case
    return 0.9; // Query is small part of field
  }

  private calculateQueryCoverage(query: string, matchedFields: string[], item: any): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    let coveredWords = 0;

    queryWords.forEach(word => {
      const isWordCovered = matchedFields.some(field => {
        const fieldValue = this.normalizeValue(item[field]);
        return fieldValue.includes(word);
      });

      if (isWordCovered) coveredWords++;
    });

    return queryWords.length === 0 ? 0 : coveredWords / queryWords.length;
  }

  private sortResults<T>(results: SearchResult<T>[], options: SearchOptions): void {
    results.sort((a, b) => {
      // Primary sort: relevance score
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort: number of matched fields
      if (b.matchedFields.length !== a.matchedFields.length) {
        return b.matchedFields.length - a.matchedFields.length;
      }

      // Tertiary sort: alphabetical by first matched field value
      const aFirstValue = a.matchedFields[0] ? (a.item as any)[a.matchedFields[0]] : '';
      const bFirstValue = b.matchedFields[0] ? (b.item as any)[b.matchedFields[0]] : '';
      return String(aFirstValue).localeCompare(String(bFirstValue));
    });
  }

  private cacheResults<T>(cacheKey: string, results: SearchResult<T>[]): void {
    // Regular cache
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      entries.slice(0, Math.floor(this.MAX_CACHE_SIZE / 2)).forEach(([key]) => {
        this.cache.delete(key);
      });
    }

    this.cache.set(cacheKey, {
      results,
      timestamp: Date.now()
    });

    // LRU cache
    if (this.lruCache.size >= this.MAX_LRU_SIZE) {
      const entries = Array.from(this.lruCache.entries());
      entries.sort((a, b) => a[1].accessCount - b[1].accessCount || a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.MAX_LRU_SIZE / 4));
      toRemove.forEach(([key]) => this.lruCache.delete(key));
    }

    this.lruCache.set(cacheKey, {
      data: results,
      timestamp: Date.now(),
      accessCount: 1
    });
  }

  private updateCacheMetrics(): void {
    this.performanceMetrics.cacheHitRate =
      this.performanceMetrics.totalSearches === 0 ? 0 :
      this.performanceMetrics.cacheHits / this.performanceMetrics.totalSearches;
  }

  // Public method to get performance metrics
  getPerformanceMetrics() {
    const avgSearchTime = this.performanceMetrics.searchTimes.length === 0 ? 0 :
      this.performanceMetrics.searchTimes.reduce((sum, time) => sum + time, 0) / this.performanceMetrics.searchTimes.length;

    return {
      ...this.performanceMetrics,
      averageSearchTime: avgSearchTime,
      indexSize: Object.keys(this.searchIndex).length,
      invertedIndexSize: this.invertedIndex.size,
      ngramIndexSize: this.ngramIndex.size,
      cacheSize: this.cache.size,
      lruCacheSize: this.lruCache.size,
    };
  }

  // Maintenance methods
  clearCache(): void {
    this.cache.clear();
    this.lruCache.clear();
    this.performanceMetrics.cacheHits = 0;
    this.performanceMetrics.totalSearches = 0;
    this.performanceMetrics.cacheHitRate = 0;
  }

  optimizeIndex(): void {
    // Remove unused cache entries
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL * 2) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    // Optimize LRU cache
    const lruExpiredKeys: string[] = [];
    this.lruCache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL * 2 && value.accessCount < 2) {
        lruExpiredKeys.push(key);
      }
    });

    lruExpiredKeys.forEach(key => this.lruCache.delete(key));
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