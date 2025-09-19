import React, { useState } from 'react';
import { Upload, CheckCircle, AlertTriangle, FileText, Clock } from 'lucide-react';
import { FileType } from '../types/DataTypes';
import { AppState } from '../types/NavigationTypes';
import CsvImporter from '../components/CsvImporter';
import ErrorBoundary from '../components/ErrorBoundary';
import { CsvImportErrorFallback } from '../components/ErrorFallbacks';
import { APP_CONFIG } from '../config/constants';

interface ImportPageProps {
  appState: AppState;
  onDataImported: (data: any[], fileType: FileType, summary: any) => void;
}

const ImportPage: React.FC<ImportPageProps> = ({ appState, onDataImported }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDataImported = (data: any[], fileType: FileType, summary: any) => {
    setIsProcessing(false);
    onDataImported(data, fileType, summary);
  };

  const StatusCard: React.FC<{
    title: string;
    count: number;
    isLoaded: boolean;
    fileType: string;
    lastUpdate?: string;
  }> = ({ title, count, isLoaded, fileType, lastUpdate }) => (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '20px',
      border: '1px solid #e0e0e0',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
      }}>
        {isLoaded ? (
          <CheckCircle size={20} style={{ color: '#4caf50' }} />
        ) : (
          <AlertTriangle size={20} style={{ color: '#ff9800' }} />
        )}
      </div>

      <div style={{
        marginBottom: '12px',
      }}>
        <FileText size={24} style={{
          color: isLoaded ? '#4caf50' : '#999',
          marginBottom: '8px',
        }} />
        <h3 style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 4px 0',
        }}>
          {title}
        </h3>
        <p style={{
          fontSize: '12px',
          color: '#666',
          margin: 0,
        }}>
          {fileType}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '8px',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: '24px',
          fontWeight: 'bold',
          color: isLoaded ? '#333' : '#999',
        }}>
          {count.toLocaleString()}
        </span>
        <span style={{
          fontSize: '14px',
          color: '#666',
        }}>
          records
        </span>
      </div>

      {lastUpdate && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: '#999',
        }}>
          <Clock size={12} />
          {lastUpdate}
        </div>
      )}

      {!isLoaded && (
        <div style={{
          fontSize: '12px',
          color: '#ff9800',
          marginTop: '8px',
        }}>
          No data loaded
        </div>
      )}
    </div>
  );

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 8px 0',
        }}>
          Data Import
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0,
        }}>
          Import your CSV files to analyze balance and position data
        </p>
      </div>

      {/* Current Status */}
      <div style={{
        marginBottom: '32px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '16px',
        }}>
          Current Data Status
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          <StatusCard
            title="Balance Data"
            count={appState.balanceData.length}
            isLoaded={appState.balanceData.length > 0}
            fileType={`Expected: ${APP_CONFIG.FILE.BALANCE_FILE_COLUMNS} columns`}
            lastUpdate={
              appState.lastImport.type === 'ACCOUNT_BALANCE'
                ? new Date(appState.lastImport.timestamp).toLocaleString()
                : undefined
            }
          />

          <StatusCard
            title="Positions Data"
            count={appState.positionsData.length}
            isLoaded={appState.positionsData.length > 0}
            fileType={`Expected: ${APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS} columns`}
            lastUpdate={
              appState.lastImport.type === 'POSITIONS'
                ? new Date(appState.lastImport.timestamp).toLocaleString()
                : undefined
            }
          />
        </div>

        {/* Ready for Processing Message */}
        {appState.balanceData.length > 0 && appState.positionsData.length > 0 && (
          <div style={{
            padding: '20px',
            backgroundColor: '#e8f5e9',
            borderRadius: '12px',
            border: '1px solid #c8e6c9',
            textAlign: 'center',
          }}>
            <CheckCircle size={32} style={{ color: '#4caf50', marginBottom: '12px' }} />
            <h3 style={{
              margin: '0 0 8px 0',
              color: '#2e7d32',
              fontSize: '18px',
            }}>
              ✅ Ready for Analysis
            </h3>
            <p style={{
              margin: 0,
              color: '#388e3c',
              fontSize: '14px',
            }}>
              Both balance and positions data are loaded. You can now proceed with analytics and fee calculations.
            </p>
          </div>
        )}
      </div>

      {/* File Import Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid #e0e0e0',
        marginBottom: '24px',
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <Upload size={20} />
          Import New Data
        </h2>

        <ErrorBoundary
          level="section"
          fallback={
            <CsvImportErrorFallback
              title="CSV Import Error"
              message="The CSV import component encountered an error. Please refresh the page and try again."
              onRetry={() => window.location.reload()}
            />
          }
        >
          <CsvImporter onDataImported={handleDataImported} />
        </ErrorBoundary>
      </div>

      {/* Import Guidelines */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e0e0e0',
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '16px',
        }}>
          Import Guidelines
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#1976d2',
              marginBottom: '8px',
            }}>
              Balance Files
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.5',
            }}>
              <li>Must have exactly {APP_CONFIG.FILE.BALANCE_FILE_COLUMNS} columns</li>
              <li>Uses columns 1, 2, 3, 5, and 7 for processing</li>
              <li>Account numbers: 8-9 digits, cannot start with 0</li>
              <li>Expected {APP_CONFIG.VALIDATION.EXPECTED_COUNTS.BALANCE_ACCOUNTS_MIN}-{APP_CONFIG.VALIDATION.EXPECTED_COUNTS.BALANCE_ACCOUNTS_MAX} accounts</li>
            </ul>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#ff9800',
              marginBottom: '8px',
            }}>
              Position Files
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.5',
            }}>
              <li>Must have exactly {APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS} columns</li>
              <li>All columns are processed</li>
              <li>Expected {APP_CONFIG.VALIDATION.EXPECTED_COUNTS.POSITIONS_MIN}+ positions</li>
              <li>Should match account numbers from balance data</li>
            </ul>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: '#4caf50',
              marginBottom: '8px',
            }}>
              General Requirements
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#666',
              lineHeight: '1.5',
            }}>
              <li>Files must be in CSV format (.csv extension)</li>
              <li>Maximum file size: {APP_CONFIG.FILE.MAX_FILE_SIZE_MB}MB</li>
              <li>Files should not contain headers (data starts from first row)</li>
              <li>Secure local processing - data never leaves your computer</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPage;