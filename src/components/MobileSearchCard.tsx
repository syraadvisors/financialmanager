import React, { useMemo } from 'react';
import { MoreVertical, Search, TrendingUp, TrendingDown } from 'lucide-react';
import { HighlightedText } from '../utils/textHighlighting';
import styles from './MobileSearchCard.module.css';

interface MobileSearchCardProps {
  data: Record<string, any>;
  searchTerm?: string;
  primaryField: string;
  secondaryField?: string;
  valueField?: string;
  fields: Array<{
    key: string;
    label: string;
    formatter?: (value: any) => React.ReactNode;
    searchable?: boolean;
  }>;
  onClick?: (data: Record<string, any>) => void;
  onMenuClick?: (data: Record<string, any>) => void;
  className?: string;
}

const MobileSearchCard: React.FC<MobileSearchCardProps> = ({
  data,
  searchTerm,
  primaryField,
  secondaryField,
  valueField,
  fields,
  onClick,
  onMenuClick,
  className = ''
}) => {
  // Check if this card matches the search term
  const hasMatch = useMemo(() => {
    if (!searchTerm) return false;

    return fields.some(field => {
      if (field.searchable === false) return false;
      const value = data[field.key];
      if (!value) return false;
      return value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [data, searchTerm, fields]);

  // Get the value with proper formatting
  const getFormattedValue = (fieldKey: string) => {
    const field = fields.find(f => f.key === fieldKey);
    const value = data[fieldKey];

    if (!value) return null;

    if (field?.formatter) {
      return field.formatter(value);
    }

    return value;
  };

  // Render highlighted text if searchable
  const renderFieldValue = (fieldKey: string, value: any) => {
    const field = fields.find(f => f.key === fieldKey);

    if (!searchTerm || field?.searchable === false || typeof value !== 'string') {
      return getFormattedValue(fieldKey);
    }

    return (
      <HighlightedText
        text={value}
        searchTerm={searchTerm}
        options={{ fuzzyMatching: true, maxHighlights: 2 }}
      />
    );
  };

  // Get icon based on value change or type
  const getValueIcon = () => {
    if (!valueField) return null;

    const value = data[valueField];
    if (typeof value === 'number') {
      if (value > 0) return <TrendingUp size={14} className={styles.valueIconPositive} />;
      if (value < 0) return <TrendingDown size={14} className={styles.valueIconNegative} />;
    }

    return null;
  };

  const cardClasses = [
    styles.mobileSearchCard,
    hasMatch ? styles.mobileSearchCardHighlighted : '',
    onClick ? styles.clickable : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} onClick={() => onClick?.(data)}>
      {/* Match Indicator */}
      {hasMatch && (
        <div className={styles.matchIndicator}>
          <Search size={12} />
        </div>
      )}

      {/* Main Content */}
      <div className={hasMatch ? styles.contentWithIndicator : styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.primary}>
            {renderFieldValue(primaryField, data[primaryField])}
          </div>

          {onMenuClick && (
            <button
              className={styles.menu}
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick(data);
              }}
              aria-label="More options"
            >
              <MoreVertical size={16} />
            </button>
          )}
        </div>

        {/* Secondary Info */}
        {secondaryField && data[secondaryField] && (
          <div className={styles.secondary}>
            {renderFieldValue(secondaryField, data[secondaryField])}
          </div>
        )}

        {/* Value */}
        {valueField && data[valueField] && (
          <div className={styles.value}>
            {getValueIcon()}
            {renderFieldValue(valueField, data[valueField])}
          </div>
        )}

        {/* Additional Fields */}
        <div className={styles.details}>
          {fields
            .filter(field =>
              field.key !== primaryField &&
              field.key !== secondaryField &&
              field.key !== valueField &&
              data[field.key]
            )
            .slice(0, 3) // Show max 3 additional fields
            .map(field => (
              <div key={field.key} className={styles.detail}>
                <span className={styles.detailLabel}>
                  {field.label}:
                </span>
                <span className={styles.detailValue}>
                  {renderFieldValue(field.key, data[field.key])}
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

// Export with React.memo for performance optimization
export default React.memo(MobileSearchCard);