import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { PageType, NavigationItem, AppState } from '../types/NavigationTypes';
import { APP_CONFIG } from '../config/constants';
import UndoRedoControls from './UndoRedoControls';
import { useAuth } from '../contexts/AuthContext';
import UserProfileModal from './UserProfileModal';
import './Navigation.css';

interface NavigationProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  appState: AppState;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentPage, onPageChange, appState, isCollapsed: externalCollapsed, onToggleCollapse }) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile menu when page changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [currentPage, isMobile]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileMenuOpen]);

  const handleToggle = () => {
    const newCollapsed = !isCollapsed;
    if (onToggleCollapse) {
      onToggleCollapse(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const handleMobileMenuToggle = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleNavItemClick = (pageId: PageType) => {
    onPageChange(pageId);
    if (isMobile) {
      setIsMobileMenuOpen(false);
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
      id: PageType.BILLING_FEE_AGREEMENTS,
      title: 'Billing Agreements',
      description: 'Fee agreements',
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
    {
      id: PageType.USER_MANAGEMENT,
      title: 'User Management',
      description: 'Manage users',
      icon: 'users',
      requiresData: 'none',
    },
    {
      id: PageType.AUDIT_LOGS,
      title: 'Audit Logs',
      description: 'Activity logs',
      icon: 'filetext',
      requiresData: 'none',
    },
  ];

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          className="mobile-menu-button"
          onClick={handleMobileMenuToggle}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && (
        <div
          className={`mobile-overlay ${isMobileMenuOpen ? 'visible' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`navigation-container ${isMobile ? (isMobileMenuOpen ? 'mobile-open' : '') : 'desktop'} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}>
      {/* App Header */}
      <div style={{
        padding: isCollapsed ? '28px 8px 28px 8px' : '28px 20px 28px 20px',
        borderBottom: '1px solid var(--border-primary)',
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
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              {APP_CONFIG.APP_NAME}
            </h1>
          )}
        </div>

        {/* Toggle Button - Hidden on mobile */}
        <button
          className="desktop-toggle-button"
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

      {/* Navigation Items - Scrollable */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 0',
        minHeight: 0  // Important for flexbox scrolling
      }}>
        {/* Super Admin Dashboard Link - Only visible to super_admin */}
        {userProfile?.role === 'super_admin' && (
          <div style={{ padding: isCollapsed ? '0 12px' : '0 20px', marginBottom: '4px' }}>
            <a
              href="/super-admin"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: isCollapsed ? 'center' : 'space-between',
                width: '100%',
                padding: isCollapsed ? '10px 8px' : '10px 12px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold',
                textAlign: 'left',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#b91c1c';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#dc2626';
              }}
              title={isCollapsed ? 'Super Admin Dashboard' : ''}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '20px',
                }}>
                  {getIcon('settings', 18)}
                </div>
                {!isCollapsed && (
                  <div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 'bold',
                      lineHeight: 1.2,
                    }}>
                      Super Admin
                    </div>
                    <div style={{
                      fontSize: '10px',
                      opacity: 0.9,
                      lineHeight: 1.2,
                      marginTop: '1px',
                    }}>
                      System Dashboard
                    </div>
                  </div>
                )}
              </div>
            </a>
          </div>
        )}

        {navigationItems
          .filter(item => {
            // Hide User Management and Audit Logs for non-admins
            if (item.id === PageType.USER_MANAGEMENT || item.id === PageType.AUDIT_LOGS) {
              return userProfile?.role === 'admin' || userProfile?.role === 'super_admin';
            }
            return true;
          })
          .map((item) => {
          const isActive = currentPage === item.id;
          const isEnabled = getDataStatus(item.requiresData);

          return (
            <div key={item.id} style={{ padding: isCollapsed ? '0 12px' : '0 20px', marginBottom: '4px' }}>
              <button
                onClick={() => handleNavItemClick(item.id)}
                disabled={!isEnabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: isCollapsed ? 'center' : 'space-between',
                  width: '100%',
                  padding: isCollapsed ? '10px 8px' : '10px 12px',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  color: isActive ? 'white' : isEnabled ? 'var(--text-primary)' : 'var(--text-tertiary)',
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
                    e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
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
                        fontSize: '13px',
                        fontWeight: isActive ? 'bold' : 'normal',
                        lineHeight: 1.2,
                      }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: '10px',
                        opacity: 0.8,
                        lineHeight: 1.2,
                        marginTop: '1px',
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
          padding: '12px 20px 8px 20px',
          borderTop: '1px solid var(--border-primary)',
          flexShrink: 0,
        }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
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
        <div style={{
          padding: '8px 20px',
          flexShrink: 0
        }}>
          <UndoRedoControls />
        </div>
      )}

      {/* User Profile Section */}
      {user && (
        <div style={{
          padding: isCollapsed ? '8px 12px' : '8px 20px',
          borderTop: '1px solid var(--border-primary)',
          flexShrink: 0,
          position: 'relative'
        }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title={isCollapsed ? user.email || 'User menu' : undefined}
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#667eea',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '14px',
              fontWeight: 'bold',
              flexShrink: 0
            }}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <div style={{ flex: 1, textAlign: 'left', overflow: 'hidden' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.email}
                </div>
              </div>
            )}
          </button>

          {/* User Menu Dropdown */}
          {showUserMenu && !isCollapsed && (
            <>
              <div
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 98
                }}
                onClick={() => setShowUserMenu(false)}
              />
              <div style={{
                position: 'absolute',
                bottom: '70px',
                left: '20px',
                right: '20px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-primary)',
                zIndex: 99
              }}>
                {/* Profile Menu Item */}
                <button
                  onClick={() => {
                    setShowProfileModal(true);
                    setShowUserMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border-primary)',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <UserCircle size={18} />
                  My Profile
                </button>

                {/* Sign Out Menu Item */}
                <button
                  onClick={async () => {
                    try {
                      await signOut();
                      setShowUserMenu(false);
                    } catch (error) {
                      console.error('Sign out error:', error);
                    }
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#dc3545',
                    fontWeight: '500',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <LogOut size={18} />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer */}
      {!isCollapsed && (
        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid var(--border-primary)',
          fontSize: '10px',
          color: 'var(--text-tertiary)',
          textAlign: 'center',
        }}>
          {APP_CONFIG.APP_VERSION}
        </div>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onSave={refreshProfile}
      />
    </nav>
    </>
  );
};

export default Navigation;