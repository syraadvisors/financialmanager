import React from 'react';

// Text highlighting utility for search results
export interface HighlightMatch {
  text: string;
  isHighlighted: boolean;
  matchType?: 'exact' | 'fuzzy' | 'partial';
}

export interface HighlightOptions {
  caseSensitive?: boolean;
  fuzzyMatching?: boolean;
  maxHighlights?: number;
  highlightClassName?: string;
}

// React component for highlighted text
interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  className?: string;
  highlightClassName?: string;
  options?: HighlightOptions;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchTerm,
  className = '',
  highlightClassName = 'search-highlight',
  options = {}
}) => {
  const segments = React.useMemo(() => {
    return TextHighlighter.highlight(text, searchTerm, options);
  }, [text, searchTerm, options]);

  return (
    <span className={className}>
      {segments.map((segment, index) => {
        if (segment.isHighlighted) {
          const highlightClass = segment.matchType
            ? `${highlightClassName} ${highlightClassName}--${segment.matchType}`
            : highlightClassName;

          return (
            <mark key={index} className={highlightClass}>
              {segment.text}
            </mark>
          );
        }

        return <React.Fragment key={index}>{segment.text}</React.Fragment>;
      })}
    </span>
  );
};

export class TextHighlighter {
  private static readonly DEFAULT_OPTIONS: Required<HighlightOptions> = {
    caseSensitive: false,
    fuzzyMatching: true,
    maxHighlights: 10,
    highlightClassName: 'search-highlight'
  };

  // Main highlighting function that returns structured data for React rendering
  static highlight(
    text: string,
    searchTerm: string,
    options: HighlightOptions = {}
  ): HighlightMatch[] {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };

    if (!text || !searchTerm) {
      return [{ text, isHighlighted: false }];
    }

    const normalizedText = opts.caseSensitive ? text : text.toLowerCase();
    const normalizedSearch = opts.caseSensitive ? searchTerm : searchTerm.toLowerCase();

    // Split search term into individual words for better matching
    const searchWords = normalizedSearch.split(/\s+/).filter(word => word.length > 0);

    if (searchWords.length === 0) {
      return [{ text, isHighlighted: false }];
    }

    // Find all matches
    const matches = this.findMatches(normalizedText, searchWords, opts);

    // Convert matches to highlighted segments
    return this.createHighlightSegments(text, matches, opts);
  }

  // Find all match positions in the text
  private static findMatches(
    text: string,
    searchWords: string[],
    options: Required<HighlightOptions>
  ): Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }> {
    const matches: Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }> = [];

    for (const word of searchWords) {
      // Exact matches
      const exactMatches = this.findExactMatches(text, word);
      matches.push(...exactMatches.map(match => ({ ...match, matchType: 'exact' as const })));

      // Fuzzy matches (only if enabled and no exact matches found)
      if (options.fuzzyMatching && exactMatches.length === 0) {
        const fuzzyMatches = this.findFuzzyMatches(text, word);
        matches.push(...fuzzyMatches.map(match => ({ ...match, matchType: 'fuzzy' as const })));
      }

      // Partial matches (for longer words)
      if (word.length > 3) {
        const partialMatches = this.findPartialMatches(text, word);
        matches.push(...partialMatches.map(match => ({ ...match, matchType: 'partial' as const })));
      }
    }

    // Sort matches by position and remove overlaps
    return this.mergeOverlappingMatches(matches).slice(0, options.maxHighlights);
  }

  // Find exact string matches
  private static findExactMatches(text: string, searchTerm: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    let index = 0;

    while (index < text.length) {
      const found = text.indexOf(searchTerm, index);
      if (found === -1) break;

      matches.push({ start: found, end: found + searchTerm.length });
      index = found + 1;
    }

    return matches;
  }

  // Find fuzzy matches using simple edit distance
  private static findFuzzyMatches(text: string, searchTerm: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    const minLength = Math.max(3, searchTerm.length - 1);
    const maxLength = searchTerm.length + 2;

    for (let i = 0; i <= text.length - minLength; i++) {
      for (let len = minLength; len <= maxLength && i + len <= text.length; len++) {
        const substring = text.substring(i, i + len);

        if (this.calculateSimilarity(substring, searchTerm) > 0.7) {
          matches.push({ start: i, end: i + len });
        }
      }
    }

    return matches;
  }

  // Find partial matches (substring matching)
  private static findPartialMatches(text: string, searchTerm: string): Array<{ start: number; end: number }> {
    const matches: Array<{ start: number; end: number }> = [];
    const minPartialLength = Math.floor(searchTerm.length * 0.6);

    for (let len = minPartialLength; len < searchTerm.length; len++) {
      const partial = searchTerm.substring(0, len);
      const partialMatches = this.findExactMatches(text, partial);
      matches.push(...partialMatches);
    }

    return matches;
  }

  // Calculate similarity between two strings (simplified Jaccard similarity)
  private static calculateSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.split(''));
    const set2 = new Set(str2.split(''));

    const intersection = Array.from(set1).filter(char => set2.has(char));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);

    return intersection.length / union.size;
  }

  // Merge overlapping matches
  private static mergeOverlappingMatches(
    matches: Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }>
  ): Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }> {
    if (matches.length === 0) return [];

    const sorted = matches.sort((a, b) => a.start - b.start);
    const merged: Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }> = [];

    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      if (current.end >= next.start) {
        // Overlapping matches - merge them, preferring exact matches
        const matchType = current.matchType === 'exact' || next.matchType === 'exact'
          ? 'exact'
          : current.matchType === 'fuzzy' || next.matchType === 'fuzzy'
          ? 'fuzzy'
          : 'partial';

        current = {
          start: current.start,
          end: Math.max(current.end, next.end),
          matchType
        };
      } else {
        merged.push(current);
        current = next;
      }
    }

    merged.push(current);
    return merged;
  }

  // Create highlighted text segments
  private static createHighlightSegments(
    originalText: string,
    matches: Array<{ start: number; end: number; matchType: 'exact' | 'fuzzy' | 'partial' }>,
    options: Required<HighlightOptions>
  ): HighlightMatch[] {
    if (matches.length === 0) {
      return [{ text: originalText, isHighlighted: false }];
    }

    const segments: HighlightMatch[] = [];
    let currentIndex = 0;

    for (const match of matches) {
      // Add non-highlighted text before the match
      if (currentIndex < match.start) {
        segments.push({
          text: originalText.substring(currentIndex, match.start),
          isHighlighted: false
        });
      }

      // Add highlighted match
      segments.push({
        text: originalText.substring(match.start, match.end),
        isHighlighted: true,
        matchType: match.matchType
      });

      currentIndex = match.end;
    }

    // Add remaining non-highlighted text
    if (currentIndex < originalText.length) {
      segments.push({
        text: originalText.substring(currentIndex),
        isHighlighted: false
      });
    }

    return segments;
  }
}