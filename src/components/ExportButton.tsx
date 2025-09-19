import React, { useState } from 'react';
import { Download, ChevronDown } from 'lucide-react';
import ExportDialog from './ExportDialog';
import {
  exportToCSV,
  exportToExcel,
  exportToJSON,
  ExportOptions
} from '../utils/exportUtils';

interface ExportButtonProps {
  data: any[];
  dataType: 'balance' | 'positions' | 'mixed';
  title?: string;
  variant?: 'button' | 'dropdown' | 'dialog';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  className?: string;
}

const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  dataType,
  title = 'Data',
  variant = 'dialog',
  size = 'medium',
  disabled = false,
  className = ''
}) => {
  const [showDialog, setShowDialog] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { padding: '6px 12px', fontSize: '12px' };
      case 'large':
        return { padding: '12px 24px', fontSize: '16px' };
      default:
        return { padding: '8px 16px', fontSize: '14px' };
    }
  };

  const quickExport = async (format: 'csv' | 'excel' | 'json') => {
    if (!data || data.length === 0) return;

    const options: ExportOptions = {
      filename: dataType === 'balance' ? 'balance_data' :
                dataType === 'positions' ? 'positions_data' :
                'financial_data',
      includeTimestamp: true,
      includeMetadata: true
    };

    try {
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
      setShowDropdown(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={() => quickExport('csv')}
        disabled={disabled || data.length === 0}
        className={className}
        style={{
          ...getSizeStyles(),
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: (disabled || data.length === 0) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: (disabled || data.length === 0) ? 0.6 : 1,
        }}
      >
        <Download size={16} />
        Export CSV
      </button>
    );
  }

  if (variant === 'dropdown') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={disabled || data.length === 0}
          className={className}
          style={{
            ...getSizeStyles(),
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: (disabled || data.length === 0) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            opacity: (disabled || data.length === 0) ? 0.6 : 1,
          }}
        >
          <Download size={16} />
          Export
          <ChevronDown size={14} />
        </button>

        {showDropdown && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            backgroundColor: 'white',
            border: '1px solid #e0e0e0',
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 100,
            minWidth: '150px',
            marginTop: '4px',
          }}>
            <button
              onClick={() => quickExport('csv')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '6px 6px 0 0',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Export as CSV
            </button>
            <button
              onClick={() => quickExport('excel')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Export as Excel
            </button>
            <button
              onClick={() => quickExport('json')}
              style={{
                width: '100%',
                padding: '8px 12px',
                backgroundColor: 'transparent',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                borderRadius: '0 0 6px 6px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Export as JSON
            </button>
          </div>
        )}

        {/* Click outside to close dropdown */}
        {showDropdown && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99,
            }}
            onClick={() => setShowDropdown(false)}
          />
        )}
      </div>
    );
  }

  // Default: dialog variant
  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        disabled={disabled || data.length === 0}
        className={className}
        style={{
          ...getSizeStyles(),
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: (disabled || data.length === 0) ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          opacity: (disabled || data.length === 0) ? 0.6 : 1,
        }}
      >
        <Download size={16} />
        Export {title}
      </button>

      <ExportDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        data={data}
        dataType={dataType}
        title={title}
      />
    </>
  );
};

export default ExportButton;