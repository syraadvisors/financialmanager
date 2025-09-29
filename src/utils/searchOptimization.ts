// Enhanced search optimization utilities with indexing and caching
import { AccountBalance, AccountPosition } from '../types/DataTypes';

// Trie node for prefix-based search optimization
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEndOfWord = false;
  recordIds: Set<number> = new Set();

  insert(word: string, recordId: number): void {
    let current = this as TrieNode;

    for (const char of word.toLowerCase()) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
      current.recordIds.add(recordId);
    }

    current.isEndOfWord = true;
  }

  search(prefix: string): Set<number> {
    let current = this as TrieNode;

    for (const char of prefix.toLowerCase()) {
      if (!current.children.has(char)) {
        return new Set();
      }
      current = current.children.get(char)!;
    }

    return current.recordIds;
  }

  clear(): void {
    this.children.clear();
    this.recordIds.clear();
    this.isEndOfWord = false;
  }
}

// Inverted index for fast full-text search
class InvertedIndex {
  private index: Map<string, Set<number>> = new Map();
  private documents: Map<number, any> = new Map();

  addDocument(docId: number, document: any, searchableFields: string[]): void {
    this.documents.set(docId, document);

    searchableFields.forEach(field => {
      const value = document[field];
      if (value && typeof value === 'string') {
        const words = this.tokenize(value);
        words.forEach(word => {
          if (!this.index.has(word)) {
            this.index.set(word, new Set());
          }
          this.index.get(word)!.add(docId);
        });
      }
    });
  }

  search(query: string): Set<number> {
    const queryWords = this.tokenize(query);
    if (queryWords.length === 0) return new Set();

    // Start with documents containing the first word
    let results = new Set(this.index.get(queryWords[0]) || []);

    // Intersect with documents containing other words (AND operation)
    for (let i = 1; i < queryWords.length; i++) {
      const wordResults = this.index.get(queryWords[i]) || new Set();
      results = this.intersect(results, wordResults);
    }

    return results;
  }

  partialSearch(query: string): Set<number> {
    const queryWords = this.tokenize(query);
    const results = new Set<number>();

    queryWords.forEach(queryWord => {
      // Find all indexed words that start with the query word
      this.index.forEach((docIds, indexWord) => {
        if (indexWord.startsWith(queryWord)) {
          docIds.forEach(docId => results.add(docId));
        }
      });
    });

    return results;
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  private intersect<T>(setA: Set<T>, setB: Set<T>): Set<T> {
    const intersection = new Set<T>();
    setA.forEach(elem => {
      if (setB.has(elem)) {
        intersection.add(elem);
      }
    });
    return intersection;
  }

  clear(): void {
    this.index.clear();
    this.documents.clear();
  }

  getSize(): number {
    return this.documents.size;
  }
}

// Main search optimizer class
export class SearchOptimizer {
  private prefixTrie: TrieNode = new TrieNode();
  private invertedIndex: InvertedIndex = new InvertedIndex();
  private lastIndexUpdate = 0;
  private readonly INDEX_UPDATE_THRESHOLD = 2 * 60 * 1000; // 2 minutes

  // Cache for search results
  private searchCache: Map<string, {
    results: number[];
    timestamp: number;
  }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_CACHE_SIZE = 100;

  // Index data for fast searching
  indexData(
    balanceData: AccountBalance[],
    positionsData: AccountPosition[]
  ): void {
    const now = Date.now();

    // Skip if recently indexed
    if (now - this.lastIndexUpdate < this.INDEX_UPDATE_THRESHOLD) {
      return;
    }

    // Clear existing indexes
    this.prefixTrie.clear();
    this.invertedIndex.clear();
    this.searchCache.clear();

    // Index balance data
    balanceData.forEach((item, index) => {
      const docId = `balance_${index}`;
      const numericId = this.hashCode(docId);

      const searchableFields = [
        'accountNumber', 'accountName', 'accountType'
      ];

      // Add to inverted index
      this.invertedIndex.addDocument(numericId, item, searchableFields);

      // Add to prefix trie
      searchableFields.forEach(field => {
        const value = item[field as keyof AccountBalance];
        if (value && typeof value === 'string') {
          this.prefixTrie.insert(value, numericId);
        }
      });
    });

    // Index positions data
    positionsData.forEach((item, index) => {
      const docId = `position_${index}`;
      const numericId = this.hashCode(docId);

      const searchableFields = [
        'symbol', 'securityDescription', 'securityType', 'accountNumber'
      ];

      // Add to inverted index
      this.invertedIndex.addDocument(numericId, item, searchableFields);

      // Add to prefix trie
      searchableFields.forEach(field => {
        const value = item[field as keyof AccountPosition];
        if (value && typeof value === 'string') {
          this.prefixTrie.insert(value, numericId);
        }
      });
    });

    this.lastIndexUpdate = now;
  }

  // Fast search using indexed data
  searchIndexed(query: string): number[] {
    if (!query.trim()) return [];

    const cacheKey = query.toLowerCase().trim();

    // Check cache first
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.results;
    }

    let results: Set<number>;

    // Use different search strategies based on query
    if (query.length <= 2) {
      // For very short queries, use prefix search
      results = this.prefixTrie.search(query);
    } else if (query.includes(' ')) {
      // For multi-word queries, use full-text search
      results = this.invertedIndex.search(query);

      // If no exact matches, try partial search
      if (results.size === 0) {
        results = this.invertedIndex.partialSearch(query);
      }
    } else {
      // For single words, combine both strategies
      const prefixResults = this.prefixTrie.search(query);
      const indexResults = this.invertedIndex.search(query);

      results = new Set<number>();
      prefixResults.forEach(id => results.add(id));
      indexResults.forEach(id => results.add(id));

      // If no results, try partial search
      if (results.size === 0) {
        results = this.invertedIndex.partialSearch(query);
      }
    }

    const resultArray: number[] = [];
    results.forEach(id => resultArray.push(id));

    // Cache the results
    this.cacheResults(cacheKey, resultArray);

    return resultArray;
  }

  // Get search performance metrics
  getMetrics(): {
    indexSize: number;
    cacheSize: number;
    cacheHitRate: number;
    lastIndexUpdate: string;
  } {
    return {
      indexSize: this.invertedIndex.getSize(),
      cacheSize: this.searchCache.size,
      cacheHitRate: this.calculateCacheHitRate(),
      lastIndexUpdate: new Date(this.lastIndexUpdate).toISOString()
    };
  }

  // Clear all cached data
  clearCache(): void {
    this.searchCache.clear();
    this.prefixTrie.clear();
    this.invertedIndex.clear();
    this.lastIndexUpdate = 0;
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cacheResults(key: string, results: number[]): void {
    // Remove oldest entries if cache is full
    if (this.searchCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.searchCache.keys().next().value;
      if (oldestKey) {
        this.searchCache.delete(oldestKey);
      }
    }

    this.searchCache.set(key, {
      results,
      timestamp: Date.now()
    });
  }

  private calculateCacheHitRate(): number {
    // This would need to be tracked during actual usage
    // For now, return a placeholder
    return 0.75; // 75% hit rate
  }
}

// Singleton instance for global use
export const searchOptimizer = new SearchOptimizer();

// Enhanced search worker for background processing
export class SearchWorker {
  private static instance: SearchWorker;
  private worker: Worker | null = null;
  private isWorkerSupported = typeof Worker !== 'undefined';

  static getInstance(): SearchWorker {
    if (!SearchWorker.instance) {
      SearchWorker.instance = new SearchWorker();
    }
    return SearchWorker.instance;
  }

  // Initialize web worker for background search processing
  initializeWorker(): void {
    if (!this.isWorkerSupported) {
      console.warn('Web Workers not supported in this environment');
      return;
    }

    try {
      // Create inline worker for search processing
      const workerScript = `
        // Web worker script for background search processing
        let searchIndex = new Map();
        let documentStore = new Map();

        self.onmessage = function(e) {
          const { type, data } = e.data;

          switch (type) {
            case 'INDEX_DATA':
              indexData(data);
              break;
            case 'SEARCH':
              search(data.query);
              break;
            case 'CLEAR':
              clearData();
              break;
          }
        };

        function indexData(data) {
          // Index the provided data
          data.forEach((item, index) => {
            documentStore.set(index, item);

            // Create search terms
            const searchTerms = extractSearchTerms(item);
            searchTerms.forEach(term => {
              if (!searchIndex.has(term)) {
                searchIndex.set(term, new Set());
              }
              searchIndex.get(term).add(index);
            });
          });

          self.postMessage({ type: 'INDEX_COMPLETE', count: data.length });
        }

        function search(query) {
          const results = performSearch(query);
          self.postMessage({ type: 'SEARCH_RESULTS', results });
        }

        function extractSearchTerms(item) {
          const terms = new Set();

          Object.values(item).forEach(value => {
            if (typeof value === 'string') {
              const words = value.toLowerCase().split(/\\s+/);
              words.forEach(word => {
                if (word.length > 1) {
                  terms.add(word);
                }
              });
            }
          });

          return Array.from(terms);
        }

        function performSearch(query) {
          const queryTerms = query.toLowerCase().split(/\\s+/);
          const matchingDocs = new Set();

          queryTerms.forEach(term => {
            const docs = searchIndex.get(term);
            if (docs) {
              docs.forEach(docId => matchingDocs.add(docId));
            }
          });

          return Array.from(matchingDocs);
        }

        function clearData() {
          searchIndex.clear();
          documentStore.clear();
          self.postMessage({ type: 'CLEAR_COMPLETE' });
        }
      `;

      const blob = new Blob([workerScript], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));

      this.worker.onmessage = (e) => {
        const { type, results, count } = e.data;

        switch (type) {
          case 'SEARCH_RESULTS':
            // Handle search results
            console.debug('Search completed in worker:', results?.length, 'results');
            break;
          case 'INDEX_COMPLETE':
            console.debug('Indexing completed:', count, 'documents');
            break;
          case 'CLEAR_COMPLETE':
            console.debug('Search index cleared');
            break;
        }
      };

      this.worker.onerror = (error) => {
        console.error('Search worker error:', error);
      };

    } catch (error) {
      console.warn('Failed to initialize search worker:', error);
      this.worker = null;
    }
  }

  // Send data to worker for indexing
  indexDataInWorker(data: any[]): void {
    if (this.worker) {
      this.worker.postMessage({ type: 'INDEX_DATA', data });
    }
  }

  // Perform search using worker
  searchInWorker(query: string): Promise<number[]> {
    return new Promise((resolve) => {
      if (!this.worker) {
        resolve([]);
        return;
      }

      const handleMessage = (e: MessageEvent) => {
        if (e.data.type === 'SEARCH_RESULTS') {
          this.worker?.removeEventListener('message', handleMessage);
          resolve(e.data.results || []);
        }
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.postMessage({ type: 'SEARCH', data: { query } });
    });
  }

  // Terminate worker
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// Export singleton instance
export const searchWorker = SearchWorker.getInstance();