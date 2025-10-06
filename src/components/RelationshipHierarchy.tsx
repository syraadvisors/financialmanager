import React from 'react';
import { Building2, Users, Home, User, Briefcase, ChevronRight, ExternalLink } from 'lucide-react';

export interface HierarchyNode {
  id: string;
  name: string;
  type: 'relationship' | 'master_account' | 'household' | 'client' | 'account';
  count?: number;
  aum?: number;
  status?: string;
}

interface RelationshipHierarchyProps {
  hierarchy: HierarchyNode[];
  onNavigate?: (nodeId: string, nodeType: string) => void;
  compact?: boolean;
  showLinks?: boolean;
}

const RelationshipHierarchy: React.FC<RelationshipHierarchyProps> = ({
  hierarchy,
  onNavigate,
  compact = false,
  showLinks = true,
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

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '8px 12px',
        backgroundColor: '#f8fafc',
        borderRadius: '6px',
        fontSize: '13px',
      }}>
        {hierarchy.map((node, index) => (
          <React.Fragment key={node.id}>
            {index > 0 && <ChevronRight size={14} color="#94a3b8" />}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: getColor(node.type),
                cursor: showLinks && onNavigate ? 'pointer' : 'default',
                fontWeight: index === hierarchy.length - 1 ? '600' : '400',
              }}
              onClick={() => showLinks && onNavigate && onNavigate(node.id, node.type)}
            >
              {getIcon(node.type, 14)}
              <span>{node.name}</span>
              {showLinks && onNavigate && (
                <ExternalLink size={12} style={{ opacity: 0.5 }} />
              )}
            </div>
          </React.Fragment>
        ))}
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
      <h3 style={{
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a202c',
        marginBottom: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <Building2 size={16} />
        Relationship Hierarchy
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {hierarchy.map((node, index) => (
          <div key={node.id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                marginLeft: `${index * 20}px`,
                backgroundColor: index === hierarchy.length - 1 ? '#f0f9ff' : 'transparent',
                borderRadius: '6px',
                cursor: showLinks && onNavigate ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
              onClick={() => showLinks && onNavigate && onNavigate(node.id, node.type)}
              onMouseEnter={(e) => {
                if (showLinks && onNavigate) {
                  e.currentTarget.style.backgroundColor = '#f0f9ff';
                }
              }}
              onMouseLeave={(e) => {
                if (showLinks && onNavigate) {
                  e.currentTarget.style.backgroundColor = index === hierarchy.length - 1 ? '#f0f9ff' : 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: `${getColor(node.type)}15`,
                  color: getColor(node.type),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon(node.type, 16)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: index === hierarchy.length - 1 ? '600' : '500',
                    color: '#1a202c',
                  }}>
                    {node.name}
                  </span>
                  {node.status && (
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      backgroundColor: node.status === 'Active' ? '#dcfce7' : '#fee2e2',
                      color: node.status === 'Active' ? '#166534' : '#991b1b',
                      borderRadius: '4px',
                      fontWeight: '500',
                    }}>
                      {node.status}
                    </span>
                  )}
                  {showLinks && onNavigate && (
                    <ExternalLink size={14} color="#94a3b8" />
                  )}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#64748b',
                  display: 'flex',
                  gap: '12px',
                }}>
                  <span style={{ textTransform: 'capitalize' }}>{node.type.replace('_', ' ')}</span>
                  {node.count !== undefined && (
                    <span>• {node.count} {node.count === 1 ? 'item' : 'items'}</span>
                  )}
                  {node.aum !== undefined && (
                    <span>• {formatCurrency(node.aum)} AUM</span>
                  )}
                </div>
              </div>

              {index < hierarchy.length - 1 && (
                <ChevronRight size={16} color="#cbd5e1" />
              )}
            </div>

            {index < hierarchy.length - 1 && (
              <div
                style={{
                  width: '2px',
                  height: '12px',
                  backgroundColor: '#e2e8f0',
                  marginLeft: `${index * 20 + 27}px`,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelationshipHierarchy;
