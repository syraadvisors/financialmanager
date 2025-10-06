import React, { useState } from 'react';
import {
  Upload,
  BarChart3,
  Database,
  TrendingUp,
  PieChart,
  History,
  Settings,
  Calculator,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Calendar,
  Home,
  Building2,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { PageType, NavigationItem, AppState } from '../types/NavigationTypes';
import { APP_CONFIG } from '../config/constants';
import UndoRedoControls from './UndoRedoControls';

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  appState: AppState;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, appState, isCollapsed: externalCollapsed, onToggleCollapse }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };
  const getIcon = (iconName: string, size = 20) => {
    const iconMap: Record<string, React.ReactNode> = {
      upload: <Upload size={size} />,
      overview: <BarChart3 size={size} />,
      balance: <Database size={size} />,
      positions: <TrendingUp size={size} />,
      analytics: <PieChart size={size} />,
      history: <History size={size} />,
      calculator: <Calculator size={size} />,
      usercircle: <UserCircle size={size} />,
      users: <Users size={size} />,
      home: <Home size={size} />,
      building: <Building2 size={size} />,
      filetext: <FileText size={size} />,
      calendar: <Calendar size={size} />,
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
      id: PageType.OVERVIEW,
      title: 'Overview',
      description: 'Summary dashboard',
      icon: 'overview',
      requiresData: 'none',
    },
    {
      id: PageType.FEE_CALCULATOR,
      title: 'Fee Calculator',
      description: 'Calculate fees',
      icon: 'calculator',
      requiresData: 'none',
    },
    {
      id: PageType.FEE_REPORTS,
      title: 'Fee Reports',
      description: 'View reports',
      icon: 'analytics',
      requiresData: 'none',
    },
    {
      id: PageType.MASTER_ACCOUNTS,
      title: 'Master Accounts',
      description: 'Manage master accounts',
      icon: 'building',
      requiresData: 'none',
    },
    {
      id: PageType.CLIENTS,
      title: 'Clients',
      description: 'Manage clients',
      icon: 'usercircle',
      requiresData: 'none',
    },
    {
      id: PageType.ACCOUNTS,
      title: 'Accounts',
      description: 'Manage accounts',
      icon: 'users',
      requiresData: 'none',
    },
    {
      id: PageType.HOUSEHOLDS,
      title: 'Households',
      description: 'Manage households',
      icon: 'home',
      requiresData: 'none',
    },
    {
      id: PageType.RELATIONSHIPS,
      title: 'Relationships',
      description: 'Manage relationships',
      icon: 'building',
      requiresData: 'none',
    },
    {
      id: PageType.FEE_SCHEDULES,
      title: 'Fee Schedules',
      description: 'Configure schedules',
      icon: 'filetext',
      requiresData: 'none',
    },
    {
      id: PageType.BILLING_PERIODS,
      title: 'Billing Periods',
      description: 'Manage billing',
      icon: 'calendar',
      requiresData: 'none',
    },
    {
      id: PageType.IMPORT,
      title: 'Data Import',
      description: 'Import CSV files',
      icon: 'upload',
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
      id: PageType.HISTORY,
      title: 'Import History',
      description: 'Previous imports',
      icon: 'history',
      requiresData: 'none',
      badge: appState.fileHistory.length || undefined,
    },
    {
      id: PageType.FIRM_SETTINGS,
      title: 'Firm Settings',
      description: 'Company settings',
      icon: 'settings',
      requiresData: 'none',
    },
  ];

  return (
    <nav style={{
      backgroundColor: 'white',
      borderRight: '1px solid #e0e0e0',
      padding: '20px 0',
      minHeight: '100vh',
      width: isCollapsed ? '80px' : '280px',
      position: 'fixed',
      left: 0,
      top: 0,
      overflowY: 'auto',
      zIndex: 90,
      transition: 'width 0.3s ease',
    }}>
      {/* App Header */}
      <div style={{
        padding: isCollapsed ? '0 8px 24px 8px' : '0 20px 24px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: isCollapsed ? 'column' : 'row',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
        gap: '12px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: '12px',
        }}>
          <BarChart3 size={32} style={{ color: '#2196f3', flexShrink: 0 }} />
          {!isCollapsed && (
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0,
            }}>
              {APP_CONFIG.APP_NAME}
            </h1>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#2196f3',
            border: '2px solid white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2196f3';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title={isCollapsed ? 'Expand menu' : 'Collapse menu'}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Items */}
      <div style={{ padding: '20px 0' }}>
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id;
          const isEnabled = getDataStatus(item.requiresData);

          return (
            <div key={item.id} style={{ padding: isCollapsed ? '0 12px' : '0 20px', marginBottom: '4px' }}>
              <button
                onClick={() => onPageChange(item.id)}
                disabled={!isEnabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  padding: isCollapsed ? '12px 8px' : '12px 16px',
                  backgroundColor: isActive ? '#2196f3' : 'transparent',
                  color: isActive ? 'white' : isEnabled ? '#333' : '#ccc',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: isActive ? 'bold' : 'normal',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  opacity: isEnabled ? 1 : 0.5,
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (isEnabled && !isActive) {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                  }
                }}
                onMouseLeave={(e) => {
                  if (isEnabled && !isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                title={isCollapsed ? item.title : ''}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                  }}>
                    {getIcon(item.icon, 18)}
                  </div>
                  {!isCollapsed && (
                    <div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        lineHeight: 1.2,
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.8,
                        lineHeight: 1.2,
                        marginTop: '2px',
                      }}>
                        {item.description}
                      </div>
                    </div>
                  )}
                </div>
                {item.badge && !isCollapsed && (
                  <div style={{
                    backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#2196f3',
                    color: isActive ? 'white' : 'white',
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    fontWeight: 'bold',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}>
                    {item.badge}
                  </div>
                )}
                {item.badge && isCollapsed && (
                  <div style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#2196f3',
                  }} />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Status Indicators */}
      {!isCollapsed && (
        <div style={{
          padding: '20px 20px 10px 20px',
          borderTop: '1px solid #f0f0f0',
          marginTop: 'auto',
        }}>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '12px' }}>
            <strong>Data Status</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: appState.balanceData.length > 0 ? '#4caf50' : '#999',
            }}>
              {appState.balanceData.length > 0 ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              Balance Data ({appState.balanceData.length} records)
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: appState.positionsData.length > 0 ? '#4caf50' : '#999',
            }}>
              {appState.positionsData.length > 0 ? (
                <CheckCircle size={14} />
              ) : (
                <AlertCircle size={14} />
              )}
              Positions Data ({appState.positionsData.length} records)
            </div>
          </div>
        </div>
      )}

      {/* Undo/Redo Controls */}
      {!isCollapsed && (
        <div style={{ padding: '10px 20px' }}>
          <UndoRedoControls />
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid #f0f0f0',
          fontSize: '10px',
          color: '#999',
          textAlign: 'center',
        }}>
          {APP_CONFIG.APP_VERSION}
        </div>
      )}
    </nav>
  );
};

export default Navigation;