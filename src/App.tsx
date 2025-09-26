import React, { useState, useEffect, Suspense, lazy } from 'react';
import './App.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import { SearchProvider } from './contexts/SearchContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import ErrorTest from './components/ErrorTest';
import LoadingSkeleton from './components/LoadingSkeleton';
import GlobalSearch from './components/GlobalSearch';
import AdvancedFilters from './components/AdvancedFilters';
import QuickFilters from './components/QuickFilters';
import SearchPerformanceMonitor from './components/SearchPerformanceMonitor';
import SearchBenchmarkDashboard from './components/SearchBenchmarkDashboard';
import CommandPalette from './components/CommandPalette';
import HelpModal from './components/HelpModal';
import { useFinancialAppShortcuts } from './hooks/useKeyboardShortcuts';

// Lazy load all page components for code splitting
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const BalanceDataPage = lazy(() => import('./pages/EnhancedBalanceDataPage'));
const PositionsDataPage = lazy(() => import('./pages/EnhancedPositionsDataPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const PerformanceDashboard = lazy(() => import('./components/PerformanceDashboard'));

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

  // Initialize keyboard shortcuts
  useFinancialAppShortcuts();

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
      case PageType.OVERVIEW:
      default:
        return (
          <OverviewPage
            onExportData={(format) => {
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
          <GlobalSearch
            placeholder="Search accounts, positions, symbols..."
            showResultsCount={true}
            autoFocus={false}
            size="medium"
          />
          <AdvancedFilters />

          {/* Quick Filters */}
          <div style={{ marginTop: '12px' }}>
            <QuickFilters
              variant="horizontal"
              maxItems={8}
              showCategories={false}
            />
          </div>
        </div>

        {/* Development only - Error Boundary Test */}
        {process.env.NODE_ENV === 'development' && (
          <ErrorBoundary level="section">
            <ErrorTest />
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
      <SearchPerformanceMonitor
        isVisible={showSearchPerformanceMonitor}
        position="bottom-left"
        onClose={() => setShowSearchPerformanceMonitor(false)}
      />

      {/* Benchmark Dashboard */}
      <SearchBenchmarkDashboard
        isVisible={showBenchmarkDashboard}
        onClose={() => setShowBenchmarkDashboard(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
      />

      {/* Help Modal */}
      <HelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
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