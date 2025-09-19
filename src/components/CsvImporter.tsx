import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { FileType } from '../types/DataTypes';
import { useCsvImporter } from '../hooks/useCsvImporter';
import { APP_CONFIG } from '../config/constants';

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
    isProcessing,
    processFile,
    proceedWithWarnings
  } = useCsvImporter(onDataImported);

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
        <p style={{ marginTop: '16px', fontSize: '16px' }}>
          {isProcessing
            ? 'Processing file...'
            : isDragActive
            ? 'Drop the CSV file here...'
            : 'Drag and drop a Balance or Positions CSV file here, or click to select'}
        </p>
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

      {error && (
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

      {validationResult && (
        <div style={{ marginBottom: '20px' }}>
          {/* Summary */}
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

          {/* Errors */}
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

          {/* Warnings */}
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

          {/* Success */}
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
        <div>
          <h3>Data Preview (first {APP_CONFIG.FILE.PREVIEW_ROWS} rows):</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0' }}>
                  {Object.keys(preview[0]).map(key => (
                    <th key={key} style={{ 
                      border: '1px solid #ddd', 
                      padding: '8px', 
                      textAlign: 'left',
                      whiteSpace: 'nowrap'
                    }}>
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value: any, idx) => (
                      <td key={idx} style={{ 
                        border: '1px solid #ddd', 
                        padding: '8px',
                        whiteSpace: 'nowrap'
                      }}>
                        {typeof value === 'number' ? value.toLocaleString() : value}
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