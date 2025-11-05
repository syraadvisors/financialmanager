import React from 'react';
import { FileX, Upload, AlertTriangle, RefreshCw, Database } from 'lucide-react';
import { APP_CONFIG } from '../config/constants';

interface ErrorFallbackProps {
  onRetry?: () => void;
  title?: string;
  message?: string;
}

// Fallback for CSV import errors
export const CsvImportErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  title = "CSV Import Failed",
  message = "There was an error processing your CSV file. Please check the file format and try again."
}) => (
  <div style={{
    padding: '40px 20px',
    textAlign: 'center',
    backgroundColor: APP_CONFIG.UI.COLORS.ERROR,
    borderRadius: '8px',
    border: '1px solid #ffcdd2',
    margin: '20px 0',
  }}>
    <FileX size={48} style={{ color: '#d32f2f', marginBottom: '16px' }} />

    <h3 style={{
      color: '#d32f2f',
      marginBottom: '12px',
      fontSize: '18px',
    }}>
      {title}
    </h3>

    <p style={{
      color: '#666',
      marginBottom: '20px',
      lineHeight: '1.5',
      maxWidth: '400px',
      margin: '0 auto 20px',
    }}>
      {message}
    </p>

    <div style={{
      display: 'flex',
      gap: '12px',
      justifyContent: 'center',
      flexWrap: 'wrap',
    }}>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '12px 24px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw size={16} />
          Try Different File
        </button>
      )}

      <button
        onClick={() => window.location.reload()}
        style={{
          padding: '12px 24px',
          backgroundColor: '#666',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <Upload size={16} />
        Start Over
      </button>
    </div>

    <div style={{
      marginTop: '20px',
      padding: '16px',
      backgroundColor: 'white',
      borderRadius: '6px',
      textAlign: 'left',
      fontSize: '12px',
      color: '#666',
    }}>
      <strong>Troubleshooting Tips:</strong>
      <ul style={{ marginTop: '8px', paddingLeft: '20px', lineHeight: '1.4' }}>
        <li>Ensure your CSV file has {APP_CONFIG.FILE.BALANCE_FILE_COLUMNS} columns for Balance files or {APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS} columns for Position files</li>
        <li>Check that account numbers are {APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.MIN_LENGTH}-{APP_CONFIG.VALIDATION.ACCOUNT_NUMBER.MAX_LENGTH} digits</li>
        <li>Verify the file size is under {APP_CONFIG.FILE.MAX_FILE_SIZE_MB}MB</li>
        <li>Make sure the file is in CSV format</li>
      </ul>
    </div>
  </div>
);

// Fallback for data processing errors
export const DataProcessingErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  title = "Data Processing Error",
  message = "An error occurred while processing your financial data."
}) => (
  <div style={{
    padding: '24px',
    backgroundColor: APP_CONFIG.UI.COLORS.WARNING,
    borderRadius: '8px',
    border: '1px solid #ffe0b2',
    margin: '16px 0',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  }}>
    <Database size={32} style={{ color: '#f57c00', flexShrink: 0, marginTop: '4px' }} />

    <div style={{ flex: 1 }}>
      <h4 style={{
        color: '#e65100',
        marginBottom: '8px',
        fontSize: '16px',
        margin: '0 0 8px 0',
      }}>
        {title}
      </h4>

      <p style={{
        color: '#666',
        marginBottom: '16px',
        fontSize: '14px',
        lineHeight: '1.4',
        margin: '0 0 16px 0',
      }}>
        {message} Your previous data is still available.
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          Retry Processing
        </button>
      )}
    </div>
  </div>
);

// Fallback for validation errors
export const ValidationErrorFallback: React.FC<ErrorFallbackProps & { errors?: string[] }> = ({
  onRetry,
  title = "Validation Failed",
  message = "The data validation process encountered errors.",
  errors = []
}) => (
  <div style={{
    padding: '20px',
    backgroundColor: APP_CONFIG.UI.COLORS.ERROR,
    borderRadius: '8px',
    border: '1px solid #ffcdd2',
    margin: '16px 0',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
      <AlertTriangle size={24} style={{ color: '#d32f2f' }} />
      <h4 style={{
        color: '#d32f2f',
        fontSize: '16px',
        margin: 0,
      }}>
        {title}
      </h4>
    </div>

    <p style={{
      color: '#666',
      marginBottom: errors.length > 0 ? '16px' : '20px',
      fontSize: '14px',
      lineHeight: '1.4',
    }}>
      {message}
    </p>

    {errors.length > 0 && (
      <div style={{
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '4px',
        marginBottom: '16px',
      }}>
        <strong style={{ fontSize: '13px', color: '#333' }}>
          Validation Errors:
        </strong>
        <ul style={{
          marginTop: '8px',
          paddingLeft: '20px',
          fontSize: '12px',
          color: '#666',
          lineHeight: '1.4',
        }}>
          {errors.slice(0, 5).map((error, index) => (
            <li key={index}>{error}</li>
          ))}
          {errors.length > 5 && (
            <li style={{ fontStyle: 'italic' }}>
              ...and {errors.length - 5} more errors
            </li>
          )}
        </ul>
      </div>
    )}

    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#d32f2f',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <RefreshCw size={14} />
        Try Again
      </button>
    )}
  </div>
);

// Simple inline error for small components
export const InlineErrorFallback: React.FC<ErrorFallbackProps> = ({
  onRetry,
  message = "Error loading component"
}) => (
  <div style={{
    padding: '12px',
    backgroundColor: '#fff3e0',
    border: '1px solid #ffcc02',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
  }}>
    <AlertTriangle size={16} style={{ color: '#f57c00' }} />
    <span style={{ flex: 1, color: '#e65100' }}>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        style={{
          padding: '4px 8px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '3px',
          cursor: 'pointer',
          fontSize: '11px',
        }}
      >
        Retry
      </button>
    )}
  </div>
);