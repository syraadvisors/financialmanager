import React, { useState, Suspense, lazy } from 'react';
import './App.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import ErrorTest from './components/ErrorTest';
import LoadingSkeleton from './components/LoadingSkeleton';

// Lazy load all page components for code splitting
const OverviewPage = lazy(() => import('./pages/OverviewPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const BalanceDataPage = lazy(() => import('./pages/BalanceDataPage'));
const PositionsDataPage = lazy(() => import('./pages/PositionsDataPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));
const PerformanceDashboard = lazy(() => import('./components/PerformanceDashboard'));

// Main App component that uses the context
const AppContent: React.FC = () => {
  const { state, setCurrentPage, handleDataImported } = useAppContext();
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(
    process.env.NODE_ENV === 'development'
  );

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
    </div>
  );
};

// Root App component with Context Provider
const App: React.FC = () => {
  return (
    <AppProvider enablePersistence={true}>
      <AppContent />
    </AppProvider>
  );
};

export default App;