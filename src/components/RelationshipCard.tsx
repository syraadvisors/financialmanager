import React from 'react';
import { Building2, Users, Home, User, Briefcase, DollarSign, TrendingUp, ChevronRight } from 'lucide-react';

interface RelatedEntity {
  id: string;
  name: string;
  type: 'relationship' | 'master_account' | 'household' | 'client' | 'account';
  count?: number;
  aum?: number;
  status?: string;
  details?: string;
}

interface RelationshipCardProps {
  title: string;
  entities: RelatedEntity[];
  onViewEntity?: (entityId: string, entityType: string) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
  maxDisplay?: number;
}

const RelationshipCard: React.FC<RelationshipCardProps> = ({
  title,
  entities,
  onViewEntity,
  showViewAll = true,
  onViewAll,
  maxDisplay = 5,
}) => {
  const getIcon = (type: string, size = 16) => {
    switch (type) {
      case 'relationship':
        return <Building2 size={size} />;
      case 'master_account':
        return <Briefcase size={size} />;
      case 'household':
        return <Home size={size} />;
      case 'client':
        return <User size={size} />;
      case 'account':
        return <Users size={size} />;
      default:
        return <Users size={size} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'relationship':
        return '#8b5cf6';
      case 'master_account':
        return '#0ea5e9';
      case 'household':
        return '#10b981';
      case 'client':
        return '#f59e0b';
      case 'account':
        return '#2196f3';
      default:
        return '#64748b';
    }
  };

  const formatCurrency = (amount?: number): string => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const displayedEntities = entities.slice(0, maxDisplay);
  const hasMore = entities.length > maxDisplay;

  if (entities.length === 0) {
    return (
      <div style={{
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1a202c',
          marginBottom: '8px',
        }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
          No related {title.toLowerCase()} found
        </p>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      padding: '16px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '12px',
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: '600',
          color: '#1a202c',
          margin: 0,
        }}>
          {title}
        </h3>
        <span style={{
          fontSize: '12px',
          color: '#64748b',
          backgroundColor: '#f1f5f9',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: '500',
        }}>
          {entities.length}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {displayedEntities.map((entity) => (
          <div
            key={entity.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              cursor: onViewEntity ? 'pointer' : 'default',
              transition: 'all 0.2s',
              border: '1px solid transparent',
            }}
            onClick={() => onViewEntity && onViewEntity(entity.id, entity.type)}
            onMouseEnter={(e) => {
              if (onViewEntity) {
                e.currentTarget.style.backgroundColor = '#eff6ff';
                e.currentTarget.style.borderColor = '#bfdbfe';
              }
            }}
            onMouseLeave={(e) => {
              if (onViewEntity) {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = 'transparent';
              }
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: `${getColor(entity.type)}15`,
                color: getColor(entity.type),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {getIcon(entity.type, 16)}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '500',
                color: '#1a202c',
                marginBottom: '2px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {entity.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#64748b',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
              }}>
                {entity.details && <span>{entity.details}</span>}
                {entity.count !== undefined && (
                  <span>{entity.count} {entity.count === 1 ? 'item' : 'items'}</span>
                )}
                {entity.aum !== undefined && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <DollarSign size={12} />
                    {formatCurrency(entity.aum)}
                  </span>
                )}
              </div>
            </div>

            {entity.status && (
              <span style={{
                fontSize: '11px',
                padding: '3px 8px',
                backgroundColor: entity.status === 'Active' ? '#dcfce7' : '#fee2e2',
                color: entity.status === 'Active' ? '#166534' : '#991b1b',
                borderRadius: '4px',
                fontWeight: '500',
                whiteSpace: 'nowrap',
              }}>
                {entity.status}
              </span>
            )}

            {onViewEntity && (
              <ChevronRight size={16} color="#cbd5e1" />
            )}
          </div>
        ))}

        {hasMore && showViewAll && (
          <button
            onClick={onViewAll}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              color: '#2196f3',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            View All {entities.length} {title}
          </button>
        )}
      </div>
    </div>
  );
};

export default RelationshipCard;
