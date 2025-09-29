import React, { useState, useEffect, Suspense, lazy } from 'react';
import './App.css';
import './styles/searchHighlighting.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { SearchProvider } from './contexts/SearchContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import LoadingSkeleton from './components/LoadingSkeleton';
import {
  createLazyComponent,
  initializeBundleOptimization,
  BundleMetricsDisplay
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

const PerformanceDashboard = createLazyComponent(
  () => import('./components/PerformanceDashboard'),
  'PerformanceDashboard'
);

// Lazy load heavy components that are conditionally rendered
const GlobalSearch = lazy(() => import('./components/GlobalSearch'));
const AdvancedFilters = lazy(() => import('./components/AdvancedFilters'));
const QuickFilters = lazy(() => import('./components/QuickFilters'));
const SearchPerformanceMonitor = lazy(() => import('./components/SearchPerformanceMonitor'));
const SearchBenchmarkDashboard = lazy(() => import('./components/SearchBenchmarkDashboard'));
const CommandPalette = lazy(() => import('./components/CommandPalette'));
const HelpModal = lazy(() => import('./components/HelpModal'));
const ErrorTest = lazy(() => import('./components/ErrorTest'));

// Main App component that uses the context
const AppContent: React.FC = () => {
  const { state, setCurrentPage, handleDataImported } = useAppContext();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(
    process.env.NODE_ENV === 'development'
  );
  const [showSearchPerformanceMonitor, setShowSearchPerformanceMonitor] = useState(
    process.env.NODE_ENV === 'development'
  );
  const [showBenchmarkDashboard, setShowBenchmarkDashboard] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBundleMetrics, setShowBundleMetrics] = useState(false);

  // Initialize keyboard shortcuts
  useFinancialAppShortcuts();

  // Initialize bundle optimization
  useEffect(() => {
    initializeBundleOptimization();
  }, []);

  // Handle custom events from keyboard shortcuts
  useEffect(() => {
    const handleOpenCommandPalette = () => setShowCommandPalette(true);
    const handleTogglePerformanceDashboard = () => setShowPerformanceDashboard(prev => !prev);
    const handleToggleSearchMonitor = () => setShowSearchPerformanceMonitor(prev => !prev);
    const handleShowHelp = () => setShowHelpModal(true);
    const handleGlobalEscape = () => {
      setShowCommandPalette(false);
      setShowBenchmarkDashboard(false);
      setShowHelpModal(false);
      setShowBundleMetrics(false);
      // Clear search could be handled here
    };

    document.addEventListener('openCommandPalette', handleOpenCommandPalette);
    document.addEventListener('togglePerformanceDashboard', handleTogglePerformanceDashboard);
    document.addEventListener('toggleSearchMonitor', handleToggleSearchMonitor);
    document.addEventListener('showHelp', handleShowHelp);
    document.addEventListener('globalEscape', handleGlobalEscape);

    return () => {
      document.removeEventListener('openCommandPalette', handleOpenCommandPalette);
      document.removeEventListener('togglePerformanceDashboard', handleTogglePerformanceDashboard);
      document.removeEventListener('toggleSearchMonitor', handleToggleSearchMonitor);
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
      case PageType.FEE_MANAGEMENT:
        return (
          <FeeManagementPage />
        );
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
      />

      {/* Main Content */}
      <div style={{ marginLeft: '280px', flex: 1 }}>
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

        {/* Development only - Error Boundary Test */}
        {process.env.NODE_ENV === 'development' && (
          <ErrorBoundary level="section">
            <Suspense fallback={null}>
              <ErrorTest />
            </Suspense>
          </ErrorBoundary>
        )}

        <Suspense fallback={<LoadingSkeleton type="page" />}>
          {renderCurrentPage()}
        </Suspense>
      </div>

      {/* Performance Dashboard */}
      <Suspense fallback={null}>
        <PerformanceDashboard
          isVisible={showPerformanceDashboard}
          position="bottom-right"
        />
      </Suspense>

      {/* Search Performance Monitor */}
      <Suspense fallback={null}>
        <SearchPerformanceMonitor
          isVisible={showSearchPerformanceMonitor}
          position="bottom-left"
          onClose={() => setShowSearchPerformanceMonitor(false)}
        />
      </Suspense>

      {/* Benchmark Dashboard */}
      <Suspense fallback={null}>
        <SearchBenchmarkDashboard
          isVisible={showBenchmarkDashboard}
          onClose={() => setShowBenchmarkDashboard(false)}
        />
      </Suspense>

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

      {/* Bundle Metrics Display */}
      <BundleMetricsDisplay
        isVisible={showBundleMetrics}
        onClose={() => setShowBundleMetrics(false)}
      />

      {/* Toggle button for performance dashboard */}
      <button
        onClick={() => setShowPerformanceDashboard(!showPerformanceDashboard)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: showPerformanceDashboard ? '340px' : '20px',
          zIndex: 999,
          padding: '8px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '12px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'right 0.3s ease',
        }}
        title="Toggle Performance Dashboard"
      >
        📊
      </button>

      {/* Toggle button for search performance monitor */}
      <button
        onClick={() => setShowSearchPerformanceMonitor(!showSearchPerformanceMonitor)}
        style={{
          position: 'fixed',
          bottom: '70px',
          left: showSearchPerformanceMonitor ? '320px' : '20px',
          zIndex: 999,
          padding: '8px',
          backgroundColor: '#9c27b0',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '12px',
          width: '36px',
          height: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          transition: 'left 0.3s ease',
        }}
        title="Toggle Search Performance Monitor"
      >
        🔍
      </button>

      {/* Development only - Benchmark Dashboard Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowBenchmarkDashboard(!showBenchmarkDashboard)}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 999,
            padding: '8px',
            backgroundColor: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          title="Toggle Benchmark Dashboard"
        >
          📊
        </button>
      )}

      {/* Development only - Bundle Metrics Toggle */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowBundleMetrics(!showBundleMetrics)}
          style={{
            position: 'fixed',
            top: '70px',
            right: '20px',
            zIndex: 999,
            padding: '8px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '12px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
          title="Toggle Bundle Metrics"
        >
          📦
        </button>
      )}
    </div>
  );
};

// Root App component with Context Providers
const App: React.FC = () => {
  return (
    <AppProvider enablePersistence={true}>
      <SearchProvider>
        <AppContent />
      </SearchProvider>
    </AppProvider>
  );
};

export default App;