import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './styles/searchHighlighting.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { SearchProvider } from './contexts/SearchContext';
import { FirmProvider } from './contexts/FirmContext';
import Navigation from './components/Navigation';
import LoadingSkeleton from './components/LoadingSkeleton';
import LoginPage from './components/LoginPage';
import AuthCallback from './components/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import {
  createLazyComponent,
  initializeBundleOptimization
} from './utils/bundleOptimization';
import { useFinancialAppShortcuts } from './hooks/useKeyboardShortcuts';

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

// Lazy load heavy components that are conditionally rendered
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const AdvancedFilters = lazy(() => import('./components/AdvancedFilters'));
const QuickFilters = lazy(() => import('./components/QuickFilters'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const HelpModal = lazy(() => import('./components/HelpModal'));

// Main App component that uses the context
const AppContent: React.FC = () => {
  const { state, setCurrentPage, handleDataImported } = useAppContext();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);

  // Initialize keyboard shortcuts
  useFinancialAppShortcuts();

  // Initialize bundle optimization
  useEffect(() => {
    initializeBundleOptimization();
  }, []);

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
      console.error('Export failed:', error);
    }
  };

  const renderCurrentPage = () => {
    switch (state.currentPage) {
      case PageType.IMPORT:
        return (
          <ImportPage
            onDataImported={handleDataImported}
          />
        );
      case PageType.BALANCE_DATA:
        return (
          <BalanceDataPage
            onExportData={handleExportData}
          />
        );
      case PageType.POSITIONS_DATA:
        return (
          <PositionsDataPage
            onExportData={handleExportData}
          />
        );
      case PageType.ANALYTICS:
        return (
          <AnalyticsPage />
        );
      case PageType.HISTORY:
        return (
          <HistoryPage />
        );
      case PageType.FEE_CALCULATOR:
      case PageType.CLIENTS:
      case PageType.ACCOUNTS:
      case PageType.MASTER_ACCOUNTS:
      case PageType.HOUSEHOLDS:
      case PageType.RELATIONSHIPS:
      case PageType.FEE_SCHEDULES:
      case PageType.BILLING_PERIODS:
      case PageType.FEE_REPORTS:
        return (
          <FeeManagementPage activeTab={
            state.currentPage === PageType.FEE_CALCULATOR ? 'calculator' :
            state.currentPage === PageType.CLIENTS ? 'clients' :
            state.currentPage === PageType.ACCOUNTS ? 'accounts' :
            state.currentPage === PageType.MASTER_ACCOUNTS ? 'master-accounts' :
            state.currentPage === PageType.HOUSEHOLDS ? 'households' :
            state.currentPage === PageType.RELATIONSHIPS ? 'relationships' :
            state.currentPage === PageType.FEE_SCHEDULES ? 'schedules' :
            state.currentPage === PageType.BILLING_PERIODS ? 'billing' :
            state.currentPage === PageType.FEE_REPORTS ? 'reports' : 'calculator'
          } />
        );
      case PageType.FIRM_SETTINGS:
        return <FirmSettingsPage />;
      case PageType.USER_MANAGEMENT:
        return <UserManagementPage />;
      case PageType.OVERVIEW:
      default:
        return (
          <OverviewPage
            onExportData={(format: 'csv' | 'json' | 'excel') => {
              const allData = [...state.balanceData, ...state.positionsData];
              handleExportData(allData, format);
            }}
          />
        );
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Navigation Sidebar */}
      <Navigation
        currentPage={state.currentPage}
        onPageChange={setCurrentPage}
        appState={state}
        isCollapsed={isNavCollapsed}
        onToggleCollapse={setIsNavCollapsed}
      />

      {/* Main Content */}
      <div style={{
        marginLeft: isNavCollapsed ? '80px' : '280px',
        flex: 1,
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Global Search Bar */}
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'white',
          borderBottom: '1px solid #e0e0e0',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <Suspense fallback={<div style={{ height: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }} />}>
            <GlobalSearch
              placeholder="Search accounts, positions, symbols... (Ctrl+F to focus)"
              showResultsCount={true}
              autoFocus={false}
              size="medium"
            />
          </Suspense>

          <Suspense fallback={null}>
            <AdvancedFilters />
          </Suspense>

          {/* Quick Filters */}
          <div style={{ marginTop: '12px' }}>
            <Suspense fallback={null}>
              <QuickFilters
                variant="horizontal"
                maxItems={8}
                showCategories={false}
              />
            </Suspense>
          </div>
        </div>

        <Suspense fallback={<LoadingSkeleton type="page" />}>
          {renderCurrentPage()}
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
    </div>
  );
};

// Root App component with Context Providers and Routing
const App: React.FC = () => {
  // TEMPORARY: Fallback firm ID for development until user profile loads
  // This ensures the app doesn't hang while waiting for auth
  const TEMP_FALLBACK_FIRM_ID = 'fb5368e4-ea10-48cc-becf-62580dca0895';

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppProvider enablePersistence={true}>
              <FirmProvider defaultFirmId={TEMP_FALLBACK_FIRM_ID}>
                <SearchProvider>
                  <AppContent />
                </SearchProvider>
              </FirmProvider>
            </AppProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;