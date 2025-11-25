import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './App.css';
import './App.responsive.css';
import './styles/searchHighlighting.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { SearchProvider } from './contexts/SearchContext';
import { FirmProvider } from './contexts/FirmContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ImpersonationProvider } from './contexts/ImpersonationContext';
import Navigation from './components/Navigation';
import LoadingSkeleton from './components/LoadingSkeleton';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import ImpersonationBanner from './components/ImpersonationBanner';
import {
  createLazyComponent,
  initializeBundleOptimization
} from './utils/bundleOptimization';
import { useFinancialAppShortcuts } from './hooks/useKeyboardShortcuts';

// Import marketing pages
import {
  HomePage,
  FeaturesPage,
  PricingPage,
  AboutPage,
  ContactPage,
  SupportPage,
  CompliancePage
} from './public-pages/pages';

// Lazy load all page components with enhanced code splitting
const OverviewPage = createLazyComponent(
  () => import('./pages/OverviewPage'),
  'OverviewPage',
  () => true // Preload overview as it's commonly accessed
);

const ImportPage = createLazyComponent(
  () => import('./pages/ImportPage'),
  'ImportPage'
);

const BalanceDataPage = createLazyComponent(
  () => import('./pages/EnhancedBalanceDataPage'),
  'BalanceDataPage'
);

const PositionsDataPage = createLazyComponent(
  () => import('./pages/EnhancedPositionsDataPage'),
  'PositionsDataPage'
);

const AnalyticsPage = createLazyComponent(
  () => import('./pages/AnalyticsPage'),
  'AnalyticsPage'
);

const HistoryPage = createLazyComponent(
  () => import('./pages/HistoryPage'),
  'HistoryPage'
);

const FeeManagementPage = createLazyComponent(
  () => import('./pages/FeeManagementPage'),
  'FeeManagementPage'
);

const FirmSettingsPage = createLazyComponent(
  () => import('./pages/FirmSettingsPage'),
  'FirmSettingsPage'
);

const UserManagementPage = createLazyComponent(
  () => import('./components/UserManagementPage'),
  'UserManagementPage'
);

const AuditLogsPage = createLazyComponent(
  () => import('./pages/AuditLogsPage'),
  'AuditLogsPage'
);

const AppSupportPage = createLazyComponent(
  () => import('./pages/AppSupportPage'),
  'AppSupportPage'
);

const SuperAdminDashboard = createLazyComponent(
  () => import('./pages/SuperAdminDashboard'),
  'SuperAdminDashboard'
);

// Lazy load heavy components that are conditionally rendered
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const HelpModal = lazy(() => import('./components/HelpModal'));
const SessionExpiryNotification = lazy(() => import('./components/SessionExpiryNotification'));

// Main App component that uses the context
const AppContent: React.FC = () => {
  const { state, setCurrentPage, handleDataImported } = useAppContext();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const location = useLocation();

  // Initialize keyboard shortcuts
  useFinancialAppShortcuts();

  // Initialize bundle optimization
  useEffect(() => {
    initializeBundleOptimization();
  }, []);

  // Sync URL with AppContext state for backward compatibility
  useEffect(() => {
    const pathToPageType: Record<string, PageType> = {
      '/app': PageType.OVERVIEW,
      '/app/overview': PageType.OVERVIEW,
      '/app/import': PageType.IMPORT,
      '/app/balance-data': PageType.BALANCE_DATA,
      '/app/positions-data': PageType.POSITIONS_DATA,
      '/app/analytics': PageType.ANALYTICS,
      '/app/history': PageType.HISTORY,
      '/app/fee-calculator': PageType.FEE_CALCULATOR,
      '/app/clients': PageType.CLIENTS,
      '/app/accounts': PageType.ACCOUNTS,
      '/app/master-accounts': PageType.MASTER_ACCOUNTS,
      '/app/households': PageType.HOUSEHOLDS,
      '/app/relationships': PageType.RELATIONSHIPS,
      '/app/fee-schedules': PageType.FEE_SCHEDULES,
      '/app/billing-fee-agreements': PageType.BILLING_FEE_AGREEMENTS,
      '/app/billing-periods': PageType.BILLING_PERIODS,
      '/app/fee-reports': PageType.FEE_REPORTS,
      '/app/firm-settings': PageType.FIRM_SETTINGS,
      '/app/user-management': PageType.USER_MANAGEMENT,
      '/app/audit-logs': PageType.AUDIT_LOGS,
      '/app/app-support': PageType.APP_SUPPORT,
    };

    const pageType = pathToPageType[location.pathname] || PageType.OVERVIEW;
    if (state.currentPage !== pageType) {
      setCurrentPage(pageType);
    }
  }, [location.pathname, state.currentPage, setCurrentPage]);

  // Handle custom events from keyboard shortcuts
  useEffect(() => {
    const handleOpenCommandPalette = () => setShowCommandPalette(true);
    const handleShowHelp = () => setShowHelpModal(true);
    const handleGlobalEscape = () => {
      setShowCommandPalette(false);
      setShowHelpModal(false);
      // Clear search could be handled here
    };

    document.addEventListener('openCommandPalette', handleOpenCommandPalette);
    document.addEventListener('showHelp', handleShowHelp);
    document.addEventListener('globalEscape', handleGlobalEscape);

    return () => {
      document.removeEventListener('openCommandPalette', handleOpenCommandPalette);
      document.removeEventListener('showHelp', handleShowHelp);
      document.removeEventListener('globalEscape', handleGlobalEscape);
    };
  }, []);

  const handleExportData = async (data: any[], format: 'csv' | 'json' | 'excel') => {
    try {
      const { exportToCSV, exportToExcel, exportToJSON } = await import('./utils/exportUtils');

      const options = {
        filename: 'financial_data',
        includeTimestamp: true,
        includeMetadata: true
      };

      switch (format) {
        case 'csv':
          await exportToCSV(data, options);
          break;
        case 'excel':
          await exportToExcel(data, options);
          break;
        case 'json':
          await exportToJSON(data, options);
          break;
      }
    } catch (error) {
      const { loggers } = await import('./utils/logger');
      loggers.app.error('Export failed', error);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Impersonation Banner - Fixed at top */}
      <ImpersonationBanner />

      {/* Navigation Sidebar */}
      <Navigation
        currentPage={state.currentPage}
        onPageChange={setCurrentPage}
        appState={state}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={setIsNavCollapsed}
      />

      {/* Main Content with Nested Routes */}
      <div className={`app-main-content ${isNavCollapsed ? 'collapsed' : ''}`}>
        <Suspense fallback={<LoadingSkeleton type="page" />}>
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />
            <Route path="overview" element={
              <OverviewPage
                onExportData={(format: 'csv' | 'json' | 'excel') => {
                  const allData = [...state.balanceData, ...state.positionsData];
                  handleExportData(allData, format);
                }}
              />
            } />
            <Route path="import" element={<ImportPage onDataImported={handleDataImported} />} />
            <Route path="balance-data" element={<BalanceDataPage onExportData={handleExportData} />} />
            <Route path="positions-data" element={<PositionsDataPage onExportData={handleExportData} />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="fee-calculator" element={<FeeManagementPage activeTab="calculator" />} />
            <Route path="clients" element={<FeeManagementPage activeTab="clients" />} />
            <Route path="accounts" element={<FeeManagementPage activeTab="accounts" />} />
            <Route path="master-accounts" element={<FeeManagementPage activeTab="master-accounts" />} />
            <Route path="households" element={<FeeManagementPage activeTab="households" />} />
            <Route path="relationships" element={<FeeManagementPage activeTab="relationships" />} />
            <Route path="fee-schedules" element={<FeeManagementPage activeTab="schedules" />} />
            <Route path="billing-fee-agreements" element={<FeeManagementPage activeTab="agreements" />} />
            <Route path="billing-periods" element={<FeeManagementPage activeTab="billing" />} />
            <Route path="fee-reports" element={<FeeManagementPage activeTab="reports" />} />
            <Route path="firm-settings" element={<FirmSettingsPage />} />
            <Route path="user-management" element={<UserManagementPage />} />
            <Route path="audit-logs" element={<AuditLogsPage />} />
            <Route path="app-support" element={<AppSupportPage />} />
            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </Suspense>
      </div>

      {/* Command Palette */}
      <Suspense fallback={null}>
        <CommandPalette
          isOpen={showCommandPalette}
          onClose={() => setShowCommandPalette(false)}
        />
      </Suspense>

      {/* Help Modal */}
      <Suspense fallback={null}>
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
        />
      </Suspense>

      {/* Session Expiry Notification */}
      <Suspense fallback={null}>
        <SessionExpiryNotification />
      </Suspense>

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            fontSize: '14px',
            fontWeight: '500',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            padding: '12px 16px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
          loading: {
            iconTheme: {
              primary: '#2196f3',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

// Root App component with Context Providers and Routing
const App: React.FC = () => {
  // Optional: Set defaultFirmId for development/testing
  // In production, firm ID will come from authenticated user's profile
  // Set via environment variable or remove for production
  const defaultFirmId = process.env.REACT_APP_DEFAULT_FIRM_ID || undefined;

  return (
    <Routes>
      {/* Public marketing routes - Default landing page */}
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/support" element={<SupportPage />} />
      <Route path="/compliance" element={<CompliancePage />} />

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected app routes */}
      <Route
        path="/app/*"
        element={
          <ProtectedRoute>
            <ThemeProvider>
              <AppProvider enablePersistence={true}>
                <FirmProvider defaultFirmId={defaultFirmId}>
                  <ImpersonationProvider>
                    <SearchProvider>
                      <AppContent />
                    </SearchProvider>
                  </ImpersonationProvider>
                </FirmProvider>
              </AppProvider>
            </ThemeProvider>
          </ProtectedRoute>
        }
      />

      {/* Super Admin Dashboard Route */}
      <Route
        path="/super-admin"
        element={
          <ProtectedRoute>
            <ImpersonationProvider>
              <Suspense fallback={<LoadingSkeleton type="page" />}>
                <SuperAdminDashboard />
              </Suspense>
            </ImpersonationProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;