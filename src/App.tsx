import React, { useState } from 'react';
import './App.css';
import { FileType, AccountBalance, AccountPosition } from './types/DataTypes';
import { PageType, AppState } from './types/NavigationTypes';
import ErrorBoundary from './components/ErrorBoundary';
import Navigation from './components/Navigation';
import OverviewPage from './pages/OverviewPage';
import ImportPage from './pages/ImportPage';
import BalanceDataPage from './pages/BalanceDataPage';
import ErrorTest from './components/ErrorTest';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>(PageType.OVERVIEW);
  const [balanceData, setBalanceData] = useState<AccountBalance[]>([]);
  const [positionsData, setPositionsData] = useState<AccountPosition[]>([]);
  const [fileHistory, setFileHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastImport, setLastImport] = useState<{
    type: FileType | null;
    summary: any;
    timestamp: string;
  }>({ type: null, summary: null, timestamp: '' });

  const handleDataImported = (data: any[], fileType: FileType, summary: any) => {
    const timestamp = new Date().toLocaleString();

    // Add to file history
    const historyEntry = {
      id: Date.now().toString(),
      fileName: `${fileType.toLowerCase()}_data.csv`,
      fileType: fileType,
      importDate: timestamp,
      recordCount: data.length,
      summary: summary,
    };

    setFileHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

    if (fileType === FileType.ACCOUNT_BALANCE) {
      setBalanceData(data);
      setLastImport({ type: fileType, summary, timestamp });
    } else if (fileType === FileType.POSITIONS) {
      setPositionsData(data);
      setLastImport({ type: fileType, summary, timestamp });
    }
  };

  // Create app state object
  const appState: AppState = {
    currentPage,
    balanceData,
    positionsData,
    fileHistory,
    isLoading,
    lastImport,
  };

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
    switch (currentPage) {
      case PageType.IMPORT:
        return (
          <ImportPage
            appState={appState}
            onDataImported={handleDataImported}
          />
        );
      case PageType.BALANCE_DATA:
        return (
          <BalanceDataPage
            appState={appState}
            onExportData={handleExportData}
          />
        );
      case PageType.POSITIONS_DATA:
        // TODO: Create PositionsDataPage
        return <div style={{ padding: '32px' }}>Positions Data Page - Coming Soon</div>;
      case PageType.ANALYTICS:
        // TODO: Create AnalyticsPage
        return <div style={{ padding: '32px' }}>Analytics Page - Coming Soon</div>;
      case PageType.HISTORY:
        // TODO: Create HistoryPage
        return <div style={{ padding: '32px' }}>History Page - Coming Soon</div>;
      case PageType.OVERVIEW:
      default:
        return (
          <OverviewPage
            appState={appState}
            onExportData={(format) => {
              const allData = [...balanceData, ...positionsData];
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
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        appState={appState}
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
}

export default App;