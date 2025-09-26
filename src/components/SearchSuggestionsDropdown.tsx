import React, { useMemo, useCallback } from 'react';
import { Clock, TrendingUp, Building, TrendingDown, Search, Hash, DollarSign } from 'lucide-react';
import { SearchSuggestion } from '../utils/searchSuggestions';

interface SearchSuggestionsDropdownProps {
  suggestions: SearchSuggestion[];
  isVisible: boolean;
  selectedIndex: number;
  onSelect: (suggestion: SearchSuggestion) => void;
  onMouseEnter?: (index: number) => void;
  className?: string;
}

const SearchSuggestionsDropdown: React.FC<SearchSuggestionsDropdownProps> = ({
  suggestions,
  isVisible,
  selectedIndex,
  onSelect,
  onMouseEnter,
  className = ''
}) => {
  // Get icon for suggestion category
  const getCategoryIcon = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.icon) return suggestion.icon;

    switch (suggestion.category) {
      case 'recent':
        return <Clock size={14} color="#666" />;
      case 'popular':
        return <TrendingUp size={14} color="#e67e22" />;
      case 'account':
        return <Building size={14} color="#3498db" />;
      case 'symbol':
        return <TrendingDown size={14} color="#27ae60" />;
      case 'field':
        return <Hash size={14} color="#9b59b6" />;
      case 'value':
        return <DollarSign size={14} color="#f39c12" />;
      case 'pattern':
        return <Search size={14} color="#95a5a6" />;
      default:
        return <Search size={14} color="#666" />;
    }
  }, []);

  // Get background color for suggestion type
  const getTypeColor = useCallback((type: SearchSuggestion['type']): string => {
    switch (type) {
      case 'exact':
        return '#e8f5e8';
      case 'prefix':
        return '#e3f2fd';
      case 'fuzzy':
        return '#fff3e0';
      case 'pattern':
        return '#f3e5f5';
      default:
        return '#f5f5f5';
    }
  }, []);

  // Format metadata for display
  const formatMetadata = useCallback((suggestion: SearchSuggestion): string => {
    const { metadata } = suggestion;
    if (!metadata) return '';

    const parts: string[] = [];

    if (metadata.count) {
      parts.push(`${metadata.count} record${metadata.count !== 1 ? 's' : ''}`);
    }

    if (metadata.lastUsed) {
      const date = new Date(metadata.lastUsed);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

      if (diffHours < 24) {
        parts.push(`${diffHours}h ago`);
      } else {
        const diffDays = Math.floor(diffHours / 24);
        parts.push(`${diffDays}d ago`);
      }
    }

    if (metadata.dataType) {
      parts.push(metadata.dataType);
    }

    return parts.join(' • ');
  }, []);

  // Group suggestions by category
  const groupedSuggestions = useMemo(() => {
    const groups: { [key: string]: SearchSuggestion[] } = {};

    suggestions.forEach(suggestion => {
      const category = suggestion.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(suggestion);
    });

    // Sort categories by priority
    const categoryOrder = ['recent', 'popular', 'account', 'symbol', 'field', 'value', 'pattern'];
    return categoryOrder
      .filter(category => groups[category])
      .map(category => ({
        category,
        suggestions: groups[category].sort((a, b) => b.relevanceScore - a.relevanceScore)
      }));
  }, [suggestions]);

  // Get category display name
  const getCategoryDisplayName = useCallback((category: string): string => {
    const names = {
      recent: 'Recent Searches',
      popular: 'Popular',
      account: 'Accounts',
      symbol: 'Securities',
      field: 'Fields',
      value: 'Values',
      pattern: 'Patterns'
    };
    return names[category as keyof typeof names] || category;
  }, []);

  if (!isVisible || suggestions.length === 0) {
    return null;
  }

  return (
    <div
      className={`search-suggestions-dropdown ${className}`}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        border: '1px solid #e0e0e0',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: 1000,
        maxHeight: '400px',
        overflowY: 'auto',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      {groupedSuggestions.map(({ category, suggestions: categorySuggestions }) => (
        <div key={category}>
          {/* Category Header */}
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e9ecef',
            fontSize: '11px',
            fontWeight: '600',
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            position: 'sticky',
            top: 0,
            zIndex: 1001
          }}>
            {getCategoryDisplayName(category)}
          </div>

          {/* Category Suggestions */}
          {categorySuggestions.map((suggestion, categoryIndex) => {
            const globalIndex = suggestions.indexOf(suggestion);
            const isSelected = globalIndex === selectedIndex;

            return (
              <div
                key={suggestion.id}
                onClick={() => onSelect(suggestion)}
                onMouseEnter={() => onMouseEnter?.(globalIndex)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  cursor: 'pointer',
                  backgroundColor: isSelected ? '#f0f7ff' : getTypeColor(suggestion.type),
                  borderLeft: isSelected ? '3px solid #2196f3' : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  borderBottom: categoryIndex < categorySuggestions.length - 1 ? '1px solid #f0f0f0' : 'none'
                }}
              >
                {/* Icon */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  marginRight: '12px',
                  fontSize: suggestion.icon ? '14px' : 'inherit'
                }}>
                  {suggestion.icon || getCategoryIcon(suggestion)}
                </div>

                {/* Main content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    marginBottom: suggestion.description ? '2px' : 0
                  }}>
                    {suggestion.text}
                  </div>

                  {suggestion.description && (
                    <div style={{
                      fontSize: '12px',
                      color: '#666',
                      marginBottom: '2px'
                    }}>
                      {suggestion.description}
                    </div>
                  )}

                  {/* Metadata */}
                  {formatMetadata(suggestion) && (
                    <div style={{
                      fontSize: '11px',
                      color: '#999',
                      fontStyle: 'italic'
                    }}>
                      {formatMetadata(suggestion)}
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <div style={{
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '600',
                  color: '#666',
                  backgroundColor: 'rgba(0, 0, 0, 0.05)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {suggestion.type}
                </div>

                {/* Relevance score (development only) */}
                {process.env.NODE_ENV === 'development' && (
                  <div style={{
                    marginLeft: '8px',
                    padding: '2px 4px',
                    borderRadius: '2px',
                    fontSize: '9px',
                    fontFamily: 'monospace',
                    backgroundColor: '#e0e0e0',
                    color: '#666'
                  }}>
                    {Math.round(suggestion.relevanceScore)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* Footer with keyboard hints */}
      <div style={{
        padding: '8px 16px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #e9ecef',
        fontSize: '11px',
        color: '#666',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          Use ↑↓ to navigate, Enter to select
        </div>
        <div>
          {suggestions.length} suggestion{suggestions.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
};

export default SearchSuggestionsDropdown;