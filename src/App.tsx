import React from 'react';
import './App.css';
import { PageType } from './types/NavigationTypes';
import { AppProvider, useAppContext } from './contexts/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import OverviewPage from './pages/OverviewPage';
import ImportPage from './pages/ImportPage';
import BalanceDataPage from './pages/BalanceDataPage';
import PositionsDataPage from './pages/PositionsDataPage';
import AnalyticsPage from './pages/AnalyticsPage';
import HistoryPage from './pages/HistoryPage';
import ErrorTest from './components/ErrorTest';

// Main App component that uses the context
const AppContent: React.FC = () => {
  const { state, setCurrentPage, handleDataImported } = useAppContext();

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

        {renderCurrentPage()}
      </div>
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