import React, { useState } from 'react';
import {
  Download,
  FileText,
  Grid3X3,
  Database,
  Calendar,
  Settings,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  ExportFormat,
  exportToCSV,
  exportToExcel,
  exportToJSON,
  exportBalanceDataWithSummary,
  exportPositionsDataWithAnalysis,
  ExportOptions
} from '../utils/exportUtils';
import { APP_CONFIG } from '../config/constants';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  dataType: 'balance' | 'positions' | 'mixed';
  title: string;
}

interface ExportPreset {
  id: string;
  name: string;
  description: string;
  format: ExportFormat;
  icon: React.ReactNode;
  color: string;
  advanced?: boolean;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  dataType,
  title
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(ExportFormat.CSV);
  const [filename, setFilename] = useState('');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const exportPresets: ExportPreset[] = [
    {
      id: 'csv-basic',
      name: 'CSV File',
      description: 'Simple comma-separated values file',
      format: ExportFormat.CSV,
      icon: <FileText size={20} />,
      color: '#4caf50'
    },
    {
      id: 'excel-formatted',
      name: 'Excel Workbook',
      description: 'Formatted Excel file with multiple sheets',
      format: ExportFormat.EXCEL,
      icon: <Grid3X3 size={20} />,
      color: '#2196f3'
    },
    {
      id: 'json-backup',
      name: 'JSON Data',
      description: 'Structured data for backup or integration',
      format: ExportFormat.JSON,
      icon: <Database size={20} />,
      color: '#ff9800'
    }
  ];

  // Add advanced presets based on data type
  if (dataType === 'balance') {
    exportPresets.push({
      id: 'balance-report',
      name: 'Balance Report',
      description: 'Comprehensive balance analysis with summaries',
      format: ExportFormat.EXCEL,
      icon: <Settings size={20} />,
      color: '#9c27b0',
      advanced: true
    });
  }

  if (dataType === 'positions') {
    exportPresets.push({
      id: 'positions-analysis',
      name: 'Positions Analysis',
      description: 'Detailed positions breakdown with analytics',
      format: ExportFormat.EXCEL,
      icon: <Settings size={20} />,
      color: '#ff5722',
      advanced: true
    });
  }

  const handleExport = async () => {
    if (!data || data.length === 0) {
      setExportStatus('error');
      setErrorMessage('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportStatus('idle');
    setErrorMessage('');

    try {
      const options: ExportOptions = {
        filename: filename || getDefaultFilename(),
        includeTimestamp,
        includeMetadata,
        format: selectedFormat
      };

      const selectedPreset = exportPresets.find(p => p.format === selectedFormat);

      switch (selectedPreset?.id) {
        case 'csv-basic':
          await exportToCSV(data, options);
          break;

        case 'excel-formatted':
          await exportToExcel(data, options);
          break;

        case 'json-backup':
          await exportToJSON(data, options);
          break;

        case 'balance-report':
          await exportBalanceDataWithSummary(data, options);
          break;

        case 'positions-analysis':
          await exportPositionsDataWithAnalysis(data, options);
          break;

        default:
          // Fallback to basic export
          if (selectedFormat === ExportFormat.CSV) {
            await exportToCSV(data, options);
          } else if (selectedFormat === ExportFormat.EXCEL) {
            await exportToExcel(data, options);
          } else {
            await exportToJSON(data, options);
          }
      }

      setExportStatus('success');

      // Auto-close dialog after successful export
      setTimeout(() => {
        onClose();
        setExportStatus('idle');
      }, 2000);

    } catch (error) {
      setExportStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const getDefaultFilename = (): string => {
    const base = dataType === 'balance' ? 'balance_data' :
                 dataType === 'positions' ? 'positions_data' :
                 'financial_data';
    return base;
  };

  const getPresetByFormat = (format: ExportFormat) => {
    return exportPresets.find(p => p.format === format) || exportPresets[0];
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <Download size={24} />
              Export {title}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
            }}>
              {data.length} records ready for export
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              padding: '8px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#666',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Export Format Selection */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '12px',
          }}>
            Choose Export Format
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
          }}>
            {exportPresets.map(preset => (
              <button
                key={preset.id}
                onClick={() => setSelectedFormat(preset.format)}
                style={{
                  padding: '16px',
                  backgroundColor: selectedFormat === preset.format ? preset.color + '20' : '#f8f9fa',
                  border: selectedFormat === preset.format ? `2px solid ${preset.color}` : '2px solid transparent',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedFormat !== preset.format) {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFormat !== preset.format) {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px',
                }}>
                  <div style={{ color: preset.color }}>
                    {preset.icon}
                  </div>
                  <span style={{
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px',
                  }}>
                    {preset.name}
                  </span>
                  {preset.advanced && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: preset.color,
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '8px',
                    }}>
                      PRO
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  lineHeight: '1.3',
                }}>
                  {preset.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Export Options */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: '#333',
            marginBottom: '12px',
          }}>
            Export Options
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
          }}>
            {/* Filename */}
            <div style={{ gridColumn: 'span 2' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#333',
                marginBottom: '6px',
              }}>
                Filename
              </label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder={getDefaultFilename()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              />
            </div>

            {/* Include Timestamp */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#333',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={includeTimestamp}
                  onChange={(e) => setIncludeTimestamp(e.target.checked)}
                />
                <Calendar size={16} />
                Include Date
              </label>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px',
              }}>
                Add current date to filename
              </div>
            </div>

            {/* Include Metadata */}
            <div>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#333',
                cursor: 'pointer',
              }}>
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                />
                <Settings size={16} />
                Include Metadata
              </label>
              <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px',
              }}>
                Add export info and statistics
              </div>
            </div>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus !== 'idle' && (
          <div style={{
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            backgroundColor: exportStatus === 'success' ? APP_CONFIG.UI.COLORS.SUCCESS : APP_CONFIG.UI.COLORS.ERROR,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            {exportStatus === 'success' ? (
              <CheckCircle size={16} style={{ color: '#4caf50' }} />
            ) : (
              <AlertCircle size={16} style={{ color: '#f44336' }} />
            )}
            <span style={{
              fontSize: '14px',
              color: exportStatus === 'success' ? '#2e7d32' : '#d32f2f',
            }}>
              {exportStatus === 'success'
                ? 'Export completed successfully!'
                : `Export failed: ${errorMessage}`}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            disabled={isExporting}
            style={{
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              cursor: isExporting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              color: '#666',
              opacity: isExporting ? 0.5 : 1,
            }}
          >
            Cancel
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: isExporting ? '#ccc' : getPresetByFormat(selectedFormat).color,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: (isExporting || data.length === 0) ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: (isExporting || data.length === 0) ? 0.7 : 1,
            }}
          >
            {isExporting ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} />
                Export {getPresetByFormat(selectedFormat).name}
              </>
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ExportDialog;