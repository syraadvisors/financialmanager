// Enhanced Search History Management with persistence and analytics
export interface SearchHistoryEntry {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
  executionTime: number; // in milliseconds
  category?: 'account' | 'position' | 'symbol' | 'general';
  filters?: string[]; // Active filters during search
  successful: boolean; // Whether search returned results
  source: 'manual' | 'suggestion' | 'recent' | 'filter';
}

export interface SearchPattern {
  pattern: string;
  frequency: number;
  lastUsed: string;
  avgResultCount: number;
  successRate: number;
  category: string;
}

export interface SearchStatistics {
  totalSearches: number;
  uniqueQueries: number;
  avgResultCount: number;
  mostPopularQueries: SearchHistoryEntry[];
  recentQueries: SearchHistoryEntry[];
  searchPatterns: SearchPattern[];
  successRate: number;
  avgExecutionTime: number;
  categoryCounts: Record<string, number>;
  dailySearchCounts: Record<string, number>;
}

export class SearchHistoryManager {
  private static readonly STORAGE_KEY = 'financial_manager_search_history';
  private static readonly PATTERNS_KEY = 'financial_manager_search_patterns';
  private static readonly MAX_HISTORY_SIZE = 1000;
  private static readonly MAX_PATTERNS = 50;
  private static readonly DEBOUNCE_DELAY = 500;

  private history: SearchHistoryEntry[] = [];
  private patterns: Map<string, SearchPattern> = new Map();
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
  }

  // Add a new search entry to history
  addSearch(
    query: string,
    resultCount: number,
    executionTime: number,
    filters: string[] = [],
    source: SearchHistoryEntry['source'] = 'manual'
  ): string {
    const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const entry: SearchHistoryEntry = {
      id,
      query: query.trim(),
      timestamp,
      resultCount,
      executionTime,
      category: this.categorizeQuery(query),
      filters: [...filters],
      successful: resultCount > 0,
      source
    };

    // Add to history (front of array for recency)
    this.history.unshift(entry);

    // Maintain size limit
    if (this.history.length > SearchHistoryManager.MAX_HISTORY_SIZE) {
      this.history = this.history.slice(0, SearchHistoryManager.MAX_HISTORY_SIZE);
    }

    // Update patterns
    this.updatePatterns(entry);

    // Debounced save
    this.debouncedSave();

    return id;
  }

  // Get search history with optional filtering
  getHistory(options: {
    limit?: number;
    category?: string;
    successful?: boolean;
    source?: SearchHistoryEntry['source'];
    since?: Date;
  } = {}): SearchHistoryEntry[] {
    let filtered = [...this.history];

    if (options.category) {
      filtered = filtered.filter(entry => entry.category === options.category);
    }

    if (options.successful !== undefined) {
      filtered = filtered.filter(entry => entry.successful === options.successful);
    }

    if (options.source) {
      filtered = filtered.filter(entry => entry.source === options.source);
    }

    if (options.since) {
      filtered = filtered.filter(entry => new Date(entry.timestamp) >= options.since!);
    }

    return options.limit ? filtered.slice(0, options.limit) : filtered;
  }

  // Get recent unique searches (deduplicated)
  getRecentUniqueSearches(limit: number = 10): SearchHistoryEntry[] {
    const seen = new Set<string>();
    const unique: SearchHistoryEntry[] = [];

    for (const entry of this.history) {
      const key = entry.query.toLowerCase();
      if (!seen.has(key) && entry.successful) {
        seen.add(key);
        unique.push(entry);
        if (unique.length >= limit) break;
      }
    }

    return unique;
  }

  // Get popular searches based on frequency and recency
  getPopularSearches(limit: number = 5): SearchHistoryEntry[] {
    const queryStats = new Map<string, {
      count: number;
      latestEntry: SearchHistoryEntry;
      avgResultCount: number;
      lastUsed: Date;
    }>();

    // Analyze search frequency and recency
    this.history.forEach(entry => {
      const key = entry.query.toLowerCase();
      const existing = queryStats.get(key);

      if (existing) {
        existing.count++;
        existing.avgResultCount = (existing.avgResultCount + entry.resultCount) / 2;
        if (new Date(entry.timestamp) > existing.lastUsed) {
          existing.latestEntry = entry;
          existing.lastUsed = new Date(entry.timestamp);
        }
      } else {
        queryStats.set(key, {
          count: 1,
          latestEntry: entry,
          avgResultCount: entry.resultCount,
          lastUsed: new Date(entry.timestamp)
        });
      }
    });

    // Score and sort by popularity (frequency + recency + success)
    return Array.from(queryStats.values())
      .filter(stat => stat.latestEntry.successful)
      .sort((a, b) => {
        const scoreA = this.calculatePopularityScore(a);
        const scoreB = this.calculatePopularityScore(b);
        return scoreB - scoreA;
      })
      .slice(0, limit)
      .map(stat => stat.latestEntry);
  }

  // Get search suggestions based on partial input
  getSuggestions(partialQuery: string, limit: number = 5): string[] {
    if (!partialQuery.trim()) return [];

    const partial = partialQuery.toLowerCase().trim();
    const suggestions = new Set<string>();

    // Exact prefix matches from history
    this.history.forEach(entry => {
      if (entry.successful && entry.query.toLowerCase().startsWith(partial)) {
        suggestions.add(entry.query);
      }
    });

    // Pattern-based suggestions
    this.patterns.forEach((pattern, key) => {
      if (key.toLowerCase().includes(partial)) {
        suggestions.add(key);
      }
    });

    // Word-based suggestions (for partial word matches)
    if (suggestions.size < limit) {
      this.history.forEach(entry => {
        if (entry.successful) {
          const words = entry.query.toLowerCase().split(/\s+/);
          words.forEach(word => {
            if (word.startsWith(partial) && word !== partial) {
              suggestions.add(entry.query);
            }
          });
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  }

  // Get comprehensive statistics
  getStatistics(): SearchStatistics {
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentEntries = this.history.filter(
      entry => new Date(entry.timestamp) >= last30Days
    );

    const uniqueQueries = new Set(this.history.map(entry => entry.query.toLowerCase())).size;
    const successfulEntries = this.history.filter(entry => entry.successful);

    // Calculate category counts
    const categoryCounts: Record<string, number> = {};
    this.history.forEach(entry => {
      categoryCounts[entry.category || 'general'] = (categoryCounts[entry.category || 'general'] || 0) + 1;
    });

    // Calculate daily search counts for the last 7 days
    const dailySearchCounts: Record<string, number> = {};
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    this.history
      .filter(entry => new Date(entry.timestamp) >= last7Days)
      .forEach(entry => {
        const date = new Date(entry.timestamp).toDateString();
        dailySearchCounts[date] = (dailySearchCounts[date] || 0) + 1;
      });

    return {
      totalSearches: this.history.length,
      uniqueQueries,
      avgResultCount: this.history.length > 0
        ? this.history.reduce((sum, entry) => sum + entry.resultCount, 0) / this.history.length
        : 0,
      mostPopularQueries: this.getPopularSearches(5),
      recentQueries: this.getRecentUniqueSearches(10),
      searchPatterns: Array.from(this.patterns.values()).slice(0, 10),
      successRate: this.history.length > 0
        ? (successfulEntries.length / this.history.length) * 100
        : 0,
      avgExecutionTime: this.history.length > 0
        ? this.history.reduce((sum, entry) => sum + entry.executionTime, 0) / this.history.length
        : 0,
      categoryCounts,
      dailySearchCounts
    };
  }

  // Clear all search history
  clearHistory(): void {
    this.history = [];
    this.patterns.clear();
    this.saveToStorage();
  }

  // Clear searches older than specified days
  clearOldSearches(days: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const originalCount = this.history.length;
    this.history = this.history.filter(
      entry => new Date(entry.timestamp) >= cutoffDate
    );

    const removedCount = originalCount - this.history.length;
    if (removedCount > 0) {
      this.saveToStorage();
    }

    return removedCount;
  }

  // Export search history data
  exportHistory(): string {
    const exportData = {
      history: this.history,
      patterns: Array.from(this.patterns.entries()),
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    return JSON.stringify(exportData, null, 2);
  }

  // Import search history data
  importHistory(jsonData: string): { success: boolean; message: string; imported: number } {
    try {
      const data = JSON.parse(jsonData);

      if (!data.history || !Array.isArray(data.history)) {
        return { success: false, message: 'Invalid data format', imported: 0 };
      }

      // Validate and import entries
      let imported = 0;
      data.history.forEach((entry: any) => {
        if (this.isValidHistoryEntry(entry)) {
          this.history.push(entry);
          imported++;
        }
      });

      // Import patterns if available
      if (data.patterns && Array.isArray(data.patterns)) {
        data.patterns.forEach(([key, pattern]: [string, SearchPattern]) => {
          if (typeof key === 'string' && pattern && typeof pattern.frequency === 'number') {
            this.patterns.set(key, pattern);
          }
        });
      }

      // Sort by timestamp (newest first) and maintain size limit
      this.history.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      if (this.history.length > SearchHistoryManager.MAX_HISTORY_SIZE) {
        this.history = this.history.slice(0, SearchHistoryManager.MAX_HISTORY_SIZE);
      }

      this.saveToStorage();

      return {
        success: true,
        message: `Successfully imported ${imported} search entries`,
        imported
      };
    } catch (error) {
      return {
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        imported: 0
      };
    }
  }

  // Private methods
  private categorizeQuery(query: string): SearchHistoryEntry['category'] {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.match(/^\d+$/)) return 'account';
    if (lowerQuery.match(/^[a-z]{1,5}$/)) return 'symbol';
    if (lowerQuery.includes('position') || lowerQuery.includes('stock') || lowerQuery.includes('bond')) {
      return 'position';
    }
    if (lowerQuery.includes('account') || lowerQuery.includes('balance')) {
      return 'account';
    }

    return 'general';
  }

  private updatePatterns(entry: SearchHistoryEntry): void {
    const pattern = this.patterns.get(entry.query);

    if (pattern) {
      pattern.frequency++;
      pattern.lastUsed = entry.timestamp;
      pattern.avgResultCount = (pattern.avgResultCount + entry.resultCount) / 2;
      pattern.successRate = pattern.successRate * 0.9 + (entry.successful ? 0.1 : 0);
    } else {
      this.patterns.set(entry.query, {
        pattern: entry.query,
        frequency: 1,
        lastUsed: entry.timestamp,
        avgResultCount: entry.resultCount,
        successRate: entry.successful ? 1 : 0,
        category: entry.category || 'general'
      });
    }

    // Maintain patterns size limit
    if (this.patterns.size > SearchHistoryManager.MAX_PATTERNS) {
      const sortedPatterns = Array.from(this.patterns.entries())
        .sort(([,a], [,b]) => b.frequency - a.frequency);

      this.patterns.clear();
      sortedPatterns.slice(0, SearchHistoryManager.MAX_PATTERNS)
        .forEach(([key, pattern]) => this.patterns.set(key, pattern));
    }
  }

  private calculatePopularityScore(stat: {
    count: number;
    avgResultCount: number;
    lastUsed: Date;
  }): number {
    const now = new Date().getTime();
    const daysSinceLastUse = (now - stat.lastUsed.getTime()) / (1000 * 60 * 60 * 24);

    // Score = frequency * result_success * recency_factor
    const frequencyScore = Math.log(stat.count + 1);
    const resultScore = Math.log(stat.avgResultCount + 1);
    const recencyScore = Math.exp(-daysSinceLastUse / 30); // Exponential decay over 30 days

    return frequencyScore * resultScore * recencyScore;
  }

  private isValidHistoryEntry(entry: any): entry is SearchHistoryEntry {
    return (
      entry &&
      typeof entry.id === 'string' &&
      typeof entry.query === 'string' &&
      typeof entry.timestamp === 'string' &&
      typeof entry.resultCount === 'number' &&
      typeof entry.executionTime === 'number' &&
      typeof entry.successful === 'boolean'
    );
  }

  private loadFromStorage(): void {
    try {
      const historyData = localStorage.getItem(SearchHistoryManager.STORAGE_KEY);
      if (historyData) {
        const parsed = JSON.parse(historyData);
        if (Array.isArray(parsed)) {
          this.history = parsed.filter(entry => this.isValidHistoryEntry(entry));
        }
      }

      const patternsData = localStorage.getItem(SearchHistoryManager.PATTERNS_KEY);
      if (patternsData) {
        const parsed = JSON.parse(patternsData);
        if (Array.isArray(parsed)) {
          this.patterns = new Map(parsed);
        }
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
      this.history = [];
      this.patterns.clear();
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(
        SearchHistoryManager.STORAGE_KEY,
        JSON.stringify(this.history)
      );

      localStorage.setItem(
        SearchHistoryManager.PATTERNS_KEY,
        JSON.stringify(Array.from(this.patterns.entries()))
      );
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  private debouncedSave(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveToStorage();
      this.saveTimeout = null;
    }, SearchHistoryManager.DEBOUNCE_DELAY);
  }
}

// Singleton instance
export const searchHistoryManager = new SearchHistoryManager();

// Hook for React components
export const useSearchHistory = () => {
  const addSearch = (
    query: string,
    resultCount: number,
    executionTime: number,
    filters: string[] = [],
    source: SearchHistoryEntry['source'] = 'manual'
  ) => searchHistoryManager.addSearch(query, resultCount, executionTime, filters, source);

  const getRecentSearches = (limit?: number) =>
    searchHistoryManager.getRecentUniqueSearches(limit);

  const getPopularSearches = (limit?: number) =>
    searchHistoryManager.getPopularSearches(limit);

  const getSuggestions = (query: string, limit?: number) =>
    searchHistoryManager.getSuggestions(query, limit);

  const getStatistics = () => searchHistoryManager.getStatistics();

  const clearHistory = () => searchHistoryManager.clearHistory();

  return {
    addSearch,
    getRecentSearches,
    getPopularSearches,
    getSuggestions,
    getStatistics,
    clearHistory,
    exportHistory: () => searchHistoryManager.exportHistory(),
    importHistory: (data: string) => searchHistoryManager.importHistory(data),
    clearOldSearches: (days: number) => searchHistoryManager.clearOldSearches(days)
  };
};