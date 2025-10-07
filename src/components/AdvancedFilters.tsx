import React, { useState, useMemo } from 'react';
import { Plus, X, Filter, Save, Trash2, BookOpen, Calendar, DollarSign, Hash } from 'lucide-react';
import { useSearchContext } from '../contexts/SearchContext';
import { useAppContext } from '../contexts/AppContext';
import { FilterCondition } from '../contexts/SearchContext';

interface FieldOption {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  options?: string[]; // For dropdown fields
}

const AdvancedFilters: React.FC = () => {
  const {
    state: searchState,
    addFilter,
    removeFilter,
    clearAllFilters,
    saveCurrentFilters,
    loadSavedFilter,
    deleteSavedFilter,
    hasActiveFilters
  } = useSearchContext();

  const { state: appState } = useAppContext();

  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilterName, setSaveFilterName] = useState('');
  const [newFilterField, setNewFilterField] = useState('');

  // Combine and deduplicate fields
  const allFields = useMemo(() => {
    // Define available fields for filtering based on data structure
    const balanceFields: FieldOption[] = [
      { key: 'accountNumber', label: 'Account Number', type: 'string' },
      { key: 'accountName', label: 'Account Name', type: 'string' },
      { key: 'portfolioValue', label: 'Portfolio Value', type: 'number' },
      { key: 'totalCash', label: 'Total Cash', type: 'number' },
      { key: 'totalEquity', label: 'Total Equity', type: 'number' },
      { key: 'totalFixedIncome', label: 'Fixed Income', type: 'number' },
      { key: 'totalAlternative', label: 'Alternative Investments', type: 'number' },
    ];

    const positionFields: FieldOption[] = [
      { key: 'accountNumber', label: 'Account Number', type: 'string' },
      { key: 'symbol', label: 'Symbol', type: 'string' },
      { key: 'securityDescription', label: 'Security Description', type: 'string' },
      { key: 'securityType', label: 'Security Type', type: 'string' },
      { key: 'marketValue', label: 'Market Value', type: 'number' },
      { key: 'numberOfShares', label: 'Number of Shares', type: 'number' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'unrealizedGainLoss', label: 'Unrealized Gain/Loss', type: 'number' },
      { key: 'percentOfAccount', label: 'Percent of Account', type: 'number' },
    ];

    const combined = [...balanceFields, ...positionFields];
    const unique = combined.filter((field, index, self) =>
      index === self.findIndex(f => f.key === field.key)
    );
    return unique.sort((a, b) => a.label.localeCompare(b.label));
  }, []);

  // Get unique values for string fields (for dropdown suggestions)
  const getFieldOptions = (fieldKey: string): string[] => {
    const allData = [...appState.balanceData, ...appState.positionsData];
    const values = allData
      .map(item => item[fieldKey as keyof typeof item])
      .filter(value => value !== null && value !== undefined && value !== '')
      .map(value => value.toString());

    return Array.from(new Set(values)).sort().slice(0, 20); // Limit to 20 most common values
  };

  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case 'string':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'contains', label: 'Contains' },
          { value: 'startsWith', label: 'Starts with' },
          { value: 'endsWith', label: 'Ends with' },
        ];
      case 'number':
        return [
          { value: 'equals', label: 'Equals' },
          { value: 'gt', label: 'Greater than' },
          { value: 'gte', label: 'Greater than or equal' },
          { value: 'lt', label: 'Less than' },
          { value: 'lte', label: 'Less than or equal' },
          { value: 'between', label: 'Between' },
        ];
      case 'date':
        return [
          { value: 'equals', label: 'On date' },
          { value: 'gt', label: 'After' },
          { value: 'lt', label: 'Before' },
          { value: 'between', label: 'Between' },
        ];
      default:
        return [{ value: 'equals', label: 'Equals' }];
    }
  };

  const handleAddFilter = () => {
    if (!newFilterField) return;

    const field = allFields.find(f => f.key === newFilterField);
    if (!field) return;

    const newFilter: FilterCondition = {
      field: newFilterField,
      operator: 'equals',
      value: '',
      dataType: field.type
    };

    addFilter(newFilter);
    setNewFilterField('');
  };

  const handleUpdateFilter = (fieldKey: string, updates: Partial<FilterCondition>) => {
    const existingFilter = searchState.activeFilters.find(f => f.field === fieldKey);
    if (!existingFilter) return;

    const updatedFilter: FilterCondition = {
      ...existingFilter,
      ...updates
    };

    addFilter(updatedFilter);
  };

  const handleSaveFilter = () => {
    if (!saveFilterName.trim() || !hasActiveFilters) return;

    saveCurrentFilters(saveFilterName.trim());
    setSaveFilterName('');
    setShowSaveDialog(false);
  };

  const renderFilterValue = (filter: FilterCondition) => {
    const field = allFields.find(f => f.key === filter.field);
    if (!field) return null;

    const commonInputStyle = {
      padding: '6px 8px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      fontSize: '13px',
      outline: 'none',
      width: '120px',
    };

    switch (filter.operator) {
      case 'between':
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              placeholder="Min"
              value={filter.value?.min || ''}
              onChange={(e) => handleUpdateFilter(filter.field, {
                value: { ...filter.value, min: field.type === 'number' ? parseFloat(e.target.value) : e.target.value }
              })}
              style={{ ...commonInputStyle, width: '80px' }}
            />
            <span style={{ color: '#666', fontSize: '12px' }}>to</span>
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              placeholder="Max"
              value={filter.value?.max || ''}
              onChange={(e) => handleUpdateFilter(filter.field, {
                value: { ...filter.value, max: field.type === 'number' ? parseFloat(e.target.value) : e.target.value }
              })}
              style={{ ...commonInputStyle, width: '80px' }}
            />
          </div>
        );

      default:
        const fieldOptions = field.type === 'string' ? getFieldOptions(filter.field) : [];

        if (fieldOptions.length > 0 && fieldOptions.length <= 10) {
          // Use dropdown for fields with few unique values
          return (
            <select
              value={filter.value}
              onChange={(e) => handleUpdateFilter(filter.field, { value: e.target.value })}
              style={{ ...commonInputStyle, width: '140px' }}
            >
              <option value="">Select value</option>
              {fieldOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          );
        } else {
          // Use text input with suggestions
          return (
            <input
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              placeholder="Enter value"
              value={filter.value}
              onChange={(e) => handleUpdateFilter(filter.field, {
                value: field.type === 'number' ? parseFloat(e.target.value) : e.target.value
              })}
              style={commonInputStyle}
              list={`${filter.field}-options`}
            />
          );
        }
    }
  };

  if (!searchState.showAdvancedFilters) return null;

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      padding: '20px',
      marginTop: '16px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid #f0f0f0',
      }}>
        <h3 style={{
          margin: 0,
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Filter size={18} />
          Advanced Filters
        </h3>

        <div style={{ display: 'flex', gap: '8px' }}>
          {hasActiveFilters && (
            <>
              <button
                onClick={() => setShowSaveDialog(true)}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#e3f2fd',
                  color: '#1976d2',
                  border: '1px solid #1976d2',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Save size={14} />
                Save
              </button>
              <button
                onClick={clearAllFilters}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#ffebee',
                  color: '#d32f2f',
                  border: '1px solid #d32f2f',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <X size={14} />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {searchState.activeFilters.map((filter) => {
        const field = allFields.find(f => f.key === filter.field);
        if (!field) return null;

        return (
          <div
            key={filter.field}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              backgroundColor: '#f8f9fa',
              borderRadius: '6px',
              marginBottom: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            {/* Field Icon */}
            <div style={{ color: '#666' }}>
              {field.type === 'number' ? <Hash size={16} /> :
               field.type === 'date' ? <Calendar size={16} /> :
               field.key.includes('Value') || field.key.includes('Cash') ? <DollarSign size={16} /> :
               <BookOpen size={16} />}
            </div>

            {/* Field Name */}
            <div style={{
              minWidth: '120px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#333',
            }}>
              {field.label}
            </div>

            {/* Operator */}
            <select
              value={filter.operator}
              onChange={(e) => handleUpdateFilter(filter.field, {
                operator: e.target.value as FilterCondition['operator'],
                value: e.target.value === 'between' ? { min: '', max: '' } : ''
              })}
              style={{
                padding: '6px 8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '13px',
                outline: 'none',
                minWidth: '100px',
              }}
            >
              {getOperatorOptions(field.type).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Value Input */}
            {renderFilterValue(filter)}

            {/* Remove Button */}
            <button
              onClick={() => removeFilter(filter.field)}
              style={{
                padding: '4px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                color: '#d32f2f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Remove filter"
            >
              <X size={16} />
            </button>

            {/* Datalist for suggestions */}
            {field.type === 'string' && (
              <datalist id={`${filter.field}-options`}>
                {getFieldOptions(filter.field).map(option => (
                  <option key={option} value={option} />
                ))}
              </datalist>
            )}
          </div>
        );
      })}

      {/* Add New Filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginTop: '12px',
      }}>
        <select
          value={newFilterField}
          onChange={(e) => setNewFilterField(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '13px',
            outline: 'none',
            minWidth: '200px',
          }}
        >
          <option value="">Select field to filter</option>
          {allFields
            .filter(field => !searchState.activeFilters.some(f => f.field === field.key))
            .map(field => (
              <option key={field.key} value={field.key}>
                {field.label} ({field.type})
              </option>
            ))}
        </select>

        <button
          onClick={handleAddFilter}
          disabled={!newFilterField}
          style={{
            padding: '8px 12px',
            backgroundColor: newFilterField ? '#2196f3' : '#f0f0f0',
            color: newFilterField ? 'white' : '#999',
            border: 'none',
            borderRadius: '4px',
            cursor: newFilterField ? 'pointer' : 'not-allowed',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '500',
          }}
        >
          <Plus size={14} />
          Add Filter
        </button>
      </div>

      {/* Saved Filters */}
      {searchState.savedFilters.length > 0 && (
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #f0f0f0',
        }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: '600',
            color: '#333',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <BookOpen size={16} />
            Saved Filters
          </h4>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            {searchState.savedFilters
              .sort((a, b) => new Date(b.lastUsed || b.createdAt).getTime() - new Date(a.lastUsed || a.createdAt).getTime())
              .slice(0, 5)
              .map((savedFilter) => (
                <div
                  key={savedFilter.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '16px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    gap: '6px',
                  }}
                >
                  <button
                    onClick={() => loadSavedFilter(savedFilter.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#2e7d32',
                      fontWeight: '500',
                      fontSize: '12px',
                    }}
                  >
                    {savedFilter.name}
                  </button>
                  <button
                    onClick={() => deleteSavedFilter(savedFilter.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#d32f2f',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            minWidth: '320px',
            maxWidth: '90vw',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#333' }}>
              Save Filter Set
            </h3>

            <input
              type="text"
              placeholder="Enter filter name"
              value={saveFilterName}
              onChange={(e) => setSaveFilterName(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                marginBottom: '16px',
                outline: 'none',
              }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveFilter();
                if (e.key === 'Escape') setShowSaveDialog(false);
              }}
            />

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSaveDialog(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFilter}
                disabled={!saveFilterName.trim()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: saveFilterName.trim() ? '#2196f3' : '#f0f0f0',
                  color: saveFilterName.trim() ? 'white' : '#999',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: saveFilterName.trim() ? 'pointer' : 'not-allowed',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                Save Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      {(hasActiveFilters || searchState.globalQuery) && (
        <div style={{
          marginTop: '16px',
          padding: '12px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#1976d2',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Filter size={14} />
          {hasActiveFilters && (
            <span>
              {searchState.activeFilters.length} active filter{searchState.activeFilters.length !== 1 ? 's' : ''}
              {searchState.filteredData.balanceData.length > 0 || searchState.filteredData.positionsData.length > 0 ? (
                <span> • {searchState.filteredData.balanceData.length + searchState.filteredData.positionsData.length} matching records</span>
              ) : null}
            </span>
          )}
          {searchState.globalQuery && (
            <span>
              {hasActiveFilters ? ' • ' : ''}Search: "{searchState.globalQuery}" ({searchState.globalResults.totalResults} results)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;