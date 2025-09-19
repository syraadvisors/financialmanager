import React from 'react';
import {
  Upload,
  BarChart3,
  Database,
  TrendingUp,
  PieChart,
  History,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { PageType, NavigationItem, AppState } from '../types/NavigationTypes';
import { APP_CONFIG } from '../config/constants';

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  appState: AppState;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, appState }) => {
  const getIcon = (iconName: string, size = 20) => {
    const iconMap: Record<string, React.ReactNode> = {
      upload: <Upload size={size} />,
      overview: <BarChart3 size={size} />,
      balance: <Database size={size} />,
      positions: <TrendingUp size={size} />,
      analytics: <PieChart size={size} />,
      history: <History size={size} />,
      settings: <Settings size={size} />,
    };
    return iconMap[iconName] || <Database size={size} />;
  };

  const getDataStatus = (requiresData?: string) => {
    const hasBalance = appState.balanceData.length > 0;
    const hasPositions = appState.positionsData.length > 0;

    switch (requiresData) {
      case 'balance':
        return hasBalance;
      case 'positions':
        return hasPositions;
      case 'both':
        return hasBalance && hasPositions;
      case 'none':
      default:
        return true;
    }
  };

  const navigationItems: NavigationItem[] = [
    {
      id: PageType.IMPORT,
      title: 'Data Import',
      description: 'Import CSV files',
      icon: 'upload',
      requiresData: 'none',
    },
    {
      id: PageType.OVERVIEW,
      title: 'Overview',
      description: 'Summary dashboard',
      icon: 'overview',
      requiresData: 'none',
    },
    {
      id: PageType.BALANCE_DATA,
      title: 'Balance Data',
      description: 'Account balances',
      icon: 'balance',
      requiresData: 'balance',
      badge: appState.balanceData.length || undefined,
    },
    {
      id: PageType.POSITIONS_DATA,
      title: 'Positions Data',
      description: 'Account positions',
      icon: 'positions',
      requiresData: 'positions',
      badge: appState.positionsData.length || undefined,
    },
    {
      id: PageType.ANALYTICS,
      title: 'Analytics',
      description: 'Data insights',
      icon: 'analytics',
      requiresData: 'both',
    },
    {
      id: PageType.HISTORY,
      title: 'Import History',
      description: 'Previous imports',
      icon: 'history',
      requiresData: 'none',
      badge: appState.fileHistory.length || undefined,
    },
  ];

  return (
    <nav style={{
      backgroundColor: 'white',
      borderRight: '1px solid #e0e0e0',
      padding: '20px 0',
      minHeight: '100vh',
      width: '280px',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      zIndex: 100,
    }}>
      {/* Header */}
      <div style={{
        padding: '0 20px 20px',
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '20px',
      }}>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 4px 0',
        }}>
          Financial Manager
        </h1>
        <p style={{
          fontSize: '12px',
          color: '#666',
          margin: 0,
        }}>
          Secure local data processing
        </p>
      </div>

      {/* Navigation Items */}
      <div style={{ padding: '0 12px' }}>
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id;
          const hasRequiredData = getDataStatus(item.requiresData);
          const isDisabled = !hasRequiredData && item.requiresData !== 'none';

          return (
            <button
              key={item.id}
              onClick={() => !isDisabled && onPageChange(item.id)}
              disabled={isDisabled}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                marginBottom: '4px',
                backgroundColor: isActive ? APP_CONFIG.UI.COLORS.INFO : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
                opacity: isDisabled ? 0.5 : 1,
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isDisabled && !isActive) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {/* Icon */}
              <div style={{
                color: isActive ? '#1976d2' : isDisabled ? '#999' : '#666',
                display: 'flex',
                alignItems: 'center',
              }}>
                {getIcon(item.icon)}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: isActive ? '600' : '500',
                  color: isActive ? '#1976d2' : isDisabled ? '#999' : '#333',
                  marginBottom: '2px',
                }}>
                  {item.title}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: isDisabled ? '#ccc' : '#666',
                  lineHeight: '1.2',
                }}>
                  {item.description}
                </div>
              </div>

              {/* Status Indicators */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}>
                {/* Data Status */}
                {item.requiresData && item.requiresData !== 'none' && (
                  <div style={{
                    color: hasRequiredData ? '#4caf50' : '#ff9800',
                  }}>
                    {hasRequiredData ? (
                      <CheckCircle size={12} />
                    ) : (
                      <AlertCircle size={12} />
                    )}
                  </div>
                )}

                {/* Badge */}
                {item.badge && (
                  <div style={{
                    backgroundColor: isActive ? '#1976d2' : '#666',
                    color: 'white',
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    minWidth: '16px',
                    textAlign: 'center',
                  }}>
                    {typeof item.badge === 'number' && item.badge > 999
                      ? '999+'
                      : item.badge}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Status Footer */}
      <div style={{
        padding: '20px',
        marginTop: 'auto',
        borderTop: '1px solid #e0e0e0',
        fontSize: '11px',
        color: '#666',
      }}>
        <div style={{ marginBottom: '8px' }}>
          <strong>Data Status:</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
          <CheckCircle size={12} style={{ color: appState.balanceData.length > 0 ? '#4caf50' : '#ddd' }} />
          Balance Data ({appState.balanceData.length} records)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <CheckCircle size={12} style={{ color: appState.positionsData.length > 0 ? '#4caf50' : '#ddd' }} />
          Positions Data ({appState.positionsData.length} records)
        </div>
        {appState.lastImport.timestamp && (
          <div style={{ fontSize: '10px', color: '#999' }}>
            Last import: {new Date(appState.lastImport.timestamp).toLocaleDateString()}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;