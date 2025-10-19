import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Info, Shield, Zap, Cpu, Settings } from 'lucide-react';
import { FileType } from '../types/DataTypes';
import { useCsvImporter } from '../hooks/useCsvImporter';
import { APP_CONFIG } from '../config/constants';
import EnhancedErrorDisplay from './EnhancedErrorDisplay';

interface CsvImporterProps {
  onDataImported: (data: any[], fileType: FileType, summary: any) => void;
}

const CsvImporter: React.FC<CsvImporterProps> = ({ onDataImported }) => {
  const {
    preview,
    fileName,
    error,
    fileType,
    validationResult,
    enhancedValidation,
    recoveryResult,
    showRecoveryOptions,
    isProcessing,
    useWebWorker,
    workerProgress,
    workerState,
    processFile,
    proceedWithWarnings,
    attemptRecovery,
    acceptRecoveredData,
    toggleWebWorker
  } = useCsvImporter(onDataImported);

  // Column display name mapping
  const columnDisplayNames: Record<string, string> = {
    asOfBusinessDate: 'Balance Date',
    accountNumber: 'Account Number',
    accountName: 'Account Name',
    netMarketValue: 'Net Market Value',
    portfolioValue: 'Portfolio Value',
    marketValueShort: 'Market Value Short',
    totalCash: 'Total Cash',
    cashAccountBalanceNetCreditOrDebit: 'Balance Debit',
    cashAccountBalanceNetMarketValue: 'Balance Value',
    cashAccountBalanceMoneyMarketFunds: 'Balance Funds',
    equityPercentage: 'Equity Percentage',
    optionRequirements: 'Option Requirements',
    monthEndDivPayout: 'Balance Payout',
    marginAccountBalanceCreditOrDebit: 'Balance Debit',
    marginAccountBalanceMarketValueLong: 'Balance Long',
    marginAccountBalanceMarketValueShort: 'Balance Short',
    marginAccountBalanceEquityIncludingOptions: 'Balance Options',
    marginAccountBalanceMarginCashAvailable: 'Balance Available',
    marginAccountBalanceEquityExcludingOptions: 'Balance Options',
    marginBuyingPower: 'Margin Buying Power',
    mtdMarginInterest: 'Mtd Margin Interest',
  };

  // Columns to display in preview
  const previewColumns = ['asOfBusinessDate', 'accountNumber', 'accountName', 'portfolioValue', 'totalCash'];

  const getDisplayName = (key: string): string => {
    return columnDisplayNames[key] || key;
  };

  const formatCellValue = (key: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
      return '';
    }

    // Format date fields as MM/DD/YYYY
    if (key === 'asOfBusinessDate') {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const year = date.getFullYear();
          return `${month}/${day}/${year}`;
        }
      } catch {
        return value.toString();
      }
    }

    // Format currency fields
    if (key === 'portfolioValue' || key === 'totalCash') {
      const numValue = typeof value === 'number' ? value : parseFloat(value);
      if (!isNaN(numValue)) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(numValue);
      }
    }

    // Default formatting
    return typeof value === 'number' ? value.toLocaleString() : value.toString();
  };

  const handleDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      processFile(file);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      'text/csv': APP_CONFIG.FILE.SUPPORTED_FILE_TYPES,
    },
    maxFiles: APP_CONFIG.FILE.MAX_FILES
  });

  return (
    <div className="csv-importer">
      {/* Web Worker Settings */}
      <div style={{
        marginBottom: '20px',
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Settings size={20} style={{ marginRight: '8px', color: '#6c757d' }} />
            <span style={{ fontWeight: '600', color: '#495057' }}>Performance Settings</span>
          </div>
          <button
            onClick={toggleWebWorker}
            style={{
              padding: '6px 12px',
              backgroundColor: useWebWorker ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Cpu size={14} />
            Web Worker: {useWebWorker ? 'ON' : 'OFF'}
          </button>
        </div>
        <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
          {useWebWorker
            ? 'Using background processing for better performance with large files'
            : 'Using main thread processing (may cause UI freezing with large files)'
          }
        </div>
        {workerState && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#6c757d' }}>
            Worker Status: {workerState.isReady ? '✅ Ready' : '⏳ Loading'} |
            Processing: {workerState.isProcessing ? '🔄 Active' : '✅ Idle'}
            {workerState.error && (
              <span style={{ color: '#dc3545', marginLeft: '8px' }}>⚠️ {workerState.error}</span>
            )}
          </div>
        )}
      </div>

      <div 
        {...getRootProps()} 
        style={{
          border: '2px dashed #ccc',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? '#f0f0f0' : '#fafafa',
          marginBottom: '20px'
        }}
      >
        <input {...getInputProps()} />
        <Upload size={48} style={{ margin: '0 auto', color: '#666' }} />
        <p style={{ marginTop: '12px', fontSize: '16px' }}>
          {isProcessing
            ? (
              <div>
                <div>Processing file...</div>
                {useWebWorker && workerProgress > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{
                      width: '200px',
                      height: '6px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '3px',
                      margin: '0 auto',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${workerProgress}%`,
                        height: '100%',
                        backgroundColor: '#007bff',
                        transition: 'width 0.3s ease-in-out'
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '4px', color: '#6c757d' }}>
                      {Math.round(workerProgress)}% complete
                    </div>
                  </div>
                )}
              </div>
            )
            : isDragActive
            ? 'Drop the CSV file here...'
            : 'Drag and drop a Balance or Positions CSV file here, or click to select'}
        </p>

        {!isProcessing && (
          <div style={{
            marginTop: '12px',
            fontSize: '12px',
            color: '#666',
            lineHeight: '1.4'
          }}>
            <strong>Flexible Import:</strong> Files with missing columns or blank cells are supported.<br/>
            • Balance files: 7-21 columns (essential: account, portfolio value, cash)<br/>
            • Positions files: 5-12 columns (essential: account, symbol, shares)<br/>
            • <strong>Enhanced Date Support:</strong> M/D/YYYY, MM/DD/YYYY, YYYY-MM-DD, and 15+ other formats
          </div>
        )}
      </div>

      {fileName && (
        <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <FileText size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          <span>File: <strong>{fileName}</strong></span>
          {fileType && (
            <span style={{ 
              marginLeft: '20px', 
              padding: '4px 12px', 
              backgroundColor: fileType === FileType.ACCOUNT_BALANCE ? '#e3f2fd' : '#f3e5f5',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}>
              {fileType === FileType.ACCOUNT_BALANCE ? 'Balance File' : 'Positions File'}
            </span>
          )}
        </div>
      )}

      {error && !enhancedValidation && (
        <div style={{
          color: '#d32f2f',
          marginBottom: '20px',
          padding: '12px',
          backgroundColor: '#ffebee',
          borderRadius: '4px',
          border: '1px solid #ffcdd2'
        }}>
          <AlertCircle size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {/* Enhanced Error Display */}
      {enhancedValidation && (
        <EnhancedErrorDisplay
          validationResult={enhancedValidation}
          recoveryResult={recoveryResult}
          onProceedWithWarnings={proceedWithWarnings}
          onRetry={() => window.location.reload()}
        />
      )}

      {/* Recovery Options */}
      {showRecoveryOptions && !recoveryResult && (
        <div style={{
          padding: '16px',
          backgroundColor: '#fff3e0',
          borderRadius: '8px',
          border: '1px solid #ffcc02',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <Shield size={20} style={{ color: '#f57c00', marginRight: '8px' }} />
            <h3 style={{ margin: 0, color: '#e65100' }}>Data Recovery Available</h3>
          </div>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            The data contains errors but may be recoverable. Would you like to attempt automatic data recovery?
          </p>
          <button
            onClick={attemptRecovery}
            disabled={isProcessing}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Zap size={16} />
            {isProcessing ? 'Attempting Recovery...' : 'Attempt Recovery'}
          </button>
        </div>
      )}

      {/* Recovery Results */}
      {recoveryResult && (
        <div style={{
          padding: '16px',
          backgroundColor: recoveryResult.success ? '#e8f5e9' : '#ffebee',
          borderRadius: '8px',
          border: `1px solid ${recoveryResult.success ? '#c8e6c9' : '#ffcdd2'}`,
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <Shield size={20} style={{
              color: recoveryResult.success ? '#4caf50' : '#f44336',
              marginRight: '8px'
            }} />
            <h3 style={{
              margin: 0,
              color: recoveryResult.success ? '#2e7d32' : '#c62828'
            }}>
              Recovery {recoveryResult.success ? 'Successful' : 'Failed'}
            </h3>
          </div>

          {recoveryResult.success ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <strong>Recovered:</strong> {recoveryResult.recoveredData.length} rows<br />
                <strong>Discarded:</strong> {recoveryResult.discardedRows} rows<br />
                <strong>Quality Score:</strong> {recoveryResult.qualityScore}%<br />
                <strong>Recovery Actions:</strong> {recoveryResult.recoveryActions.length}
              </div>

              <button
                onClick={acceptRecoveredData}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  marginRight: '12px'
                }}
              >
                Accept Recovered Data
              </button>
            </>
          ) : (
            <div style={{ color: '#666' }}>
              Recovery was not possible. Please review and fix the data manually.
            </div>
          )}
        </div>
      )}

      {/* Legacy Validation Display (for backward compatibility) */}
      {validationResult && !enhancedValidation && (
        <div style={{ marginBottom: '20px' }}>
          {/* Keep the existing legacy validation display for fallback */}
          <div style={{
            padding: '12px',
            backgroundColor: validationResult.valid ? '#e8f5e9' : '#fff3e0',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: '0 0 10px 0' }}>
              <Info size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              File Summary
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>Total Rows: <strong>{validationResult.summary.totalRows}</strong></div>
              <div>Unique Accounts: <strong>{validationResult.summary.uniqueAccounts}</strong></div>
              <div>Valid Rows: <strong>{validationResult.validRowCount}</strong></div>
              {validationResult.summary.dateRange && (
                <div style={{ gridColumn: 'span 3' }}>
                  Date Range: <strong>{validationResult.summary.dateRange}</strong>
                </div>
              )}
            </div>
          </div>

          {validationResult.errors.length > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#c62828' }}>
                <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Errors ({validationResult.errors.length})
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationResult.errors.map((err: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '14px', marginBottom: '4px' }}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div style={{
              padding: '12px',
              backgroundColor: '#fff8e1',
              borderRadius: '4px',
              marginBottom: '10px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>
                <AlertCircle size={18} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                Warnings ({validationResult.warnings.length})
              </h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {validationResult.warnings.map((warn: string, idx: number) => (
                  <li key={idx} style={{ fontSize: '14px', marginBottom: '4px' }}>{warn}</li>
                ))}
              </ul>
              {validationResult.errors.length === 0 && (
                <button
                  onClick={proceedWithWarnings}
                  style={{
                    marginTop: '10px',
                    padding: '8px 16px',
                    backgroundColor: '#ff9800',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Proceed with Warnings
                </button>
              )}
            </div>
          )}

          {validationResult.valid && (
            <div style={{
              padding: '12px',
              backgroundColor: '#e8f5e9',
              borderRadius: '4px'
            }}>
              <CheckCircle size={20} style={{ display: 'inline', marginRight: '8px', color: '#4caf50', verticalAlign: 'middle' }} />
              <span style={{ color: '#2e7d32', fontWeight: 'bold' }}>Validation successful!</span>
            </div>
          )}
        </div>
      )}

      {preview.length > 0 && (
        <div style={{
          marginTop: '20px',
          border: '1px solid #e0e0e0',
          borderRadius: '8px',
          backgroundColor: 'white',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '16px',
            backgroundColor: '#f8f9fa',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
              Data Preview (first {APP_CONFIG.FILE.PREVIEW_ROWS} rows)
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              Scroll horizontally or vertically to view all data
            </p>
          </div>
          <div style={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: '500px',
            maxWidth: '100%'
          }}>
            <table style={{
              minWidth: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead style={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#f0f0f0',
                zIndex: 1
              }}>
                <tr>
                  {previewColumns
                    .filter(col => preview[0].hasOwnProperty(col))
                    .map(key => (
                      <th key={key} style={{
                        border: '1px solid #ddd',
                        padding: '8px 12px',
                        textAlign: 'left',
                        whiteSpace: 'nowrap',
                        fontWeight: '600',
                        color: '#333',
                        backgroundColor: '#f0f0f0'
                      }}>
                        {getDisplayName(key)}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index} style={{
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    {previewColumns
                      .filter(col => row.hasOwnProperty(col))
                      .map(key => (
                        <td key={key} style={{
                          border: '1px solid #ddd',
                          padding: '8px 12px',
                          whiteSpace: 'nowrap',
                          color: '#495057'
                        }}>
                          {formatCellValue(key, row[key])}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvImporter;