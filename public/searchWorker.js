// Web Worker for parallel search processing
// This runs in a separate thread to avoid blocking the main UI

class SearchWorker {
  constructor() {
    this.searchIndex = {};
    this.ngramIndex = new Map();
    this.invertedIndex = new Map();
  }

  // Normalize value for consistent searching
  normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return value.toString().toLowerCase().trim();
  }

  // Build search indexes
  buildIndex(data, fields) {
    console.log(`Worker: Building index for ${data.length} items`);
    const startTime = performance.now();

    this.searchIndex = {};
    this.ngramIndex.clear();
    this.invertedIndex.clear();

    data.forEach((item, index) => {
      fields.forEach(field => {
        if (!this.searchIndex[field]) {
          this.searchIndex[field] = {};
        }

        const value = this.normalizeValue(item[field]);
        if (value) {
          // Standard index
          this.addToIndex(this.searchIndex[field], value, index);

          // N-gram index for fuzzy matching
          this.buildNgramIndex(value, index);

          // Inverted index for full-text search
          this.buildInvertedIndex(value, index);

          // Word-based index
          const words = value.split(/\s+/);
          words.forEach(word => {
            if (word && word.length > 2) {
              this.addToIndex(this.searchIndex[field], `word:${word}`, index);
            }
          });
        }
      });
    });

    const indexingTime = performance.now() - startTime;
    console.log(`Worker: Index built in ${indexingTime.toFixed(2)}ms`);

    return {
      indexingTime,
      indexSize: Object.keys(this.searchIndex).length,
      ngramIndexSize: this.ngramIndex.size,
      invertedIndexSize: this.invertedIndex.size
    };
  }

  addToIndex(index, key, itemIndex) {
    if (!index[key]) {
      index[key] = new Set();
    }
    index[key].add(itemIndex);
  }

  buildNgramIndex(value, index) {
    const NGRAM_SIZE = 3;
    for (let i = 0; i <= value.length - NGRAM_SIZE; i++) {
      const ngram = value.substring(i, i + NGRAM_SIZE);
      if (!this.ngramIndex.has(ngram)) {
        this.ngramIndex.set(ngram, new Set());
      }
      this.ngramIndex.get(ngram).add(index);
    }
  }

  buildInvertedIndex(value, index) {
    const words = value.toLowerCase().split(/\s+|[^\w]/);
    words.forEach(word => {
      if (word.length > 1) {
        if (!this.invertedIndex.has(word)) {
          this.invertedIndex.set(word, new Set());
        }
        this.invertedIndex.get(word).add(index);
      }
    });
  }

  // Parallel search processing
  search(data, query, fields, options = {}) {
    const startTime = performance.now();
    const normalizedQuery = this.normalizeValue(query);

    if (!normalizedQuery) return { results: [], metrics: { searchTime: 0 } };

    // Use multiple search strategies in parallel
    const searchPromises = [
      this.exactSearch(normalizedQuery, fields),
      this.fuzzySearch(normalizedQuery, fields, options.fuzzyThreshold || 0.7),
      this.ngramSearch(normalizedQuery, fields),
      this.invertedIndexSearch(normalizedQuery, fields)
    ];

    // Combine results from all strategies
    const allResults = searchPromises.map(promise => promise || []);
    const matchingIndices = new Map();

    // Weight different search strategies
    const weights = [1.0, 0.8, 0.6, 0.7];

    allResults.forEach((results, strategyIndex) => {
      const weight = weights[strategyIndex] || 0.5;
      results.forEach(index => {
        const currentScore = matchingIndices.get(index) || 0;
        matchingIndices.set(index, currentScore + weight);
      });
    });

    // Calculate relevance scores
    const searchResults = [];
    matchingIndices.forEach((matchStrength, index) => {
      if (index < data.length) {
        const item = data[index];
        const relevanceScore = this.calculateRelevance(item, query, fields, matchStrength);

        if (relevanceScore > 0) {
          searchResults.push({
            item,
            relevanceScore,
            matchedFields: this.getMatchedFields(item, query, fields),
            highlights: {}
          });
        }
      }
    });

    // Sort by relevance
    searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Apply result limit
    const limitedResults = options.maxResults
      ? searchResults.slice(0, options.maxResults)
      : searchResults;

    const searchTime = performance.now() - startTime;

    return {
      results: limitedResults,
      metrics: {
        searchTime,
        totalResults: searchResults.length,
        matchingStrategies: allResults.filter(r => r.length > 0).length
      }
    };
  }

  exactSearch(query, fields) {
    const results = [];
    fields.forEach(field => {
      if (this.searchIndex[field] && this.searchIndex[field][query]) {
        this.searchIndex[field][query].forEach(idx => results.push(idx));
      }
    });
    return [...new Set(results)];
  }

  fuzzySearch(query, fields, threshold) {
    const results = [];
    fields.forEach(field => {
      if (this.searchIndex[field]) {
        Object.keys(this.searchIndex[field]).forEach(key => {
          if (this.jaccardSimilarity(query, key) >= threshold) {
            this.searchIndex[field][key].forEach(idx => results.push(idx));
          }
        });
      }
    });
    return [...new Set(results)];
  }

  ngramSearch(query, fields) {
    const queryNgrams = this.generateNgrams(query, 3);
    const candidateIndices = new Set();

    queryNgrams.forEach(ngram => {
      if (this.ngramIndex.has(ngram)) {
        this.ngramIndex.get(ngram).forEach(idx => candidateIndices.add(idx));
      }
    });

    return Array.from(candidateIndices);
  }

  invertedIndexSearch(query, fields) {
    const words = query.toLowerCase().split(/\s+/);
    const results = [];

    words.forEach(word => {
      if (this.invertedIndex.has(word)) {
        this.invertedIndex.get(word).forEach(idx => results.push(idx));
      }
    });

    return [...new Set(results)];
  }

  generateNgrams(text, n) {
    const ngrams = [];
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.push(text.substring(i, i + n));
    }
    return ngrams;
  }

  jaccardSimilarity(str1, str2) {
    const set1 = new Set(this.generateNgrams(str1, 2));
    const set2 = new Set(this.generateNgrams(str2, 2));

    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);

    return intersection.size / union.size;
  }

  calculateRelevance(item, query, fields, matchStrength) {
    const normalizedQuery = this.normalizeValue(query);
    const queryWords = normalizedQuery.split(/\s+/);

    let totalScore = 0;

    fields.forEach(field => {
      const fieldValue = item[field];
      if (fieldValue === null || fieldValue === undefined) return;

      const normalizedValue = this.normalizeValue(fieldValue);
      let fieldScore = 0;

      queryWords.forEach(word => {
        if (normalizedValue === word) {
          fieldScore += 100;
        } else if (normalizedValue.startsWith(word)) {
          fieldScore += 80;
        } else if (normalizedValue.includes(word)) {
          fieldScore += 50;
        }
      });

      if (fieldScore > 0) {
        totalScore += fieldScore * (1 + matchStrength);
      }
    });

    return totalScore;
  }

  getMatchedFields(item, query, fields) {
    const normalizedQuery = this.normalizeValue(query);
    const matchedFields = [];

    fields.forEach(field => {
      const fieldValue = this.normalizeValue(item[field]);
      if (fieldValue && fieldValue.includes(normalizedQuery)) {
        matchedFields.push(field);
      }
    });

    return matchedFields;
  }

  // Batch processing for large datasets
  processInBatches(data, query, fields, options, batchSize = 1000) {
    const results = [];
    const totalBatches = Math.ceil(data.length / batchSize);

    for (let i = 0; i < totalBatches; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const batch = data.slice(start, end);

      const batchResults = this.search(batch, query, fields, {
        ...options,
        maxResults: undefined // Don't limit per batch
      });

      results.push(...batchResults.results);

      // Send progress update
      self.postMessage({
        type: 'progress',
        progress: ((i + 1) / totalBatches) * 100,
        processedItems: end
      });
    }

    // Sort all results by relevance
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: options.maxResults ? results.slice(0, options.maxResults) : results,
      metrics: {
        totalBatches,
        totalResults: results.length
      }
    };
  }
}

// Initialize worker
const searchWorker = new SearchWorker();

// Handle messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;

  try {
    switch (type) {
      case 'buildIndex':
        const indexStats = searchWorker.buildIndex(data.items, data.fields);
        self.postMessage({
          type: 'indexBuilt',
          success: true,
          stats: indexStats
        });
        break;

      case 'search':
        const searchResult = searchWorker.search(
          data.items,
          data.query,
          data.fields,
          data.options
        );
        self.postMessage({
          type: 'searchComplete',
          success: true,
          results: searchResult.results,
          metrics: searchResult.metrics
        });
        break;

      case 'batchSearch':
        const batchResult = searchWorker.processInBatches(
          data.items,
          data.query,
          data.fields,
          data.options,
          data.batchSize
        );
        self.postMessage({
          type: 'batchSearchComplete',
          success: true,
          results: batchResult.results,
          metrics: batchResult.metrics
        });
        break;

      default:
        self.postMessage({
          type: 'error',
          success: false,
          message: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      success: false,
      message: error.message,
      stack: error.stack
    });
  }
};