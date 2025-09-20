import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Shield,
  Zap,
  Clock,
  TrendingUp
} from 'lucide-react';
import { EnhancedValidationResult, ValidationError, ValidationWarning } from '../utils/enhancedValidation';
import { RecoveryResult, RecoveryAction } from '../utils/dataRecovery';
import { NetworkError } from '../utils/networkErrorHandler';

interface EnhancedErrorDisplayProps {
  validationResult?: EnhancedValidationResult;
  recoveryResult?: RecoveryResult<any>;
  networkError?: NetworkError;
  onRetry?: () => void;
  onProceedWithWarnings?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
}

const EnhancedErrorDisplay: React.FC<EnhancedErrorDisplayProps> = ({
  validationResult,
  recoveryResult,
  networkError,
  onRetry,
  onProceedWithWarnings,
  onDismiss,
  showDetails = false
}) => {
  const [showDetailedView, setShowDetailedView] = useState(showDetails);
  const [activeTab, setActiveTab] = useState<'errors' | 'warnings' | 'recovery' | 'recommendations'>('errors');

  // Determine overall status and styling
  const getDisplayConfig = () => {
    if (networkError) {
      return {
        type: 'network' as const,
        severity: 'error' as const,
        title: 'Network Error',
        subtitle: networkError.message,
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#ffcdd2',
        icon: <AlertTriangle size={24} />
      };
    }

    if (validationResult?.criticalErrors && validationResult.criticalErrors.length > 0) {
      return {
        type: 'critical' as const,
        severity: 'error' as const,
        title: 'Critical Data Errors',
        subtitle: `${validationResult.criticalErrors.length} critical errors prevent data processing`,
        color: '#d32f2f',
        bgColor: '#ffebee',
        borderColor: '#ffcdd2',
        icon: <AlertTriangle size={24} />
      };
    }

    if (validationResult && !validationResult.valid) {
      return {
        type: 'validation' as const,
        severity: 'warning' as const,
        title: 'Data Quality Issues',
        subtitle: `${validationResult.errors.length} errors, ${validationResult.warnings.length} warnings`,
        color: '#f57c00',
        bgColor: '#fff8e1',
        borderColor: '#ffcc02',
        icon: <AlertCircle size={24} />
      };
    }

    if (recoveryResult && recoveryResult.success) {
      return {
        type: 'recovery' as const,
        severity: 'success' as const,
        title: 'Data Recovered',
        subtitle: `${recoveryResult.recoveredData.length} rows recovered with quality score ${recoveryResult.qualityScore}%`,
        color: '#388e3c',
        bgColor: '#e8f5e9',
        borderColor: '#c8e6c9',
        icon: <Shield size={24} />
      };
    }

    return {
      type: 'info' as const,
      severity: 'info' as const,
      title: 'Information',
      subtitle: 'Processing complete',
      color: '#1976d2',
      bgColor: '#e3f2fd',
      borderColor: '#90caf9',
      icon: <Info size={24} />
    };
  };

  const config = getDisplayConfig();

  const downloadErrorReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      validation: validationResult,
      recovery: recoveryResult,
      network: networkError,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const ErrorList: React.FC<{ errors: ValidationError[] }> = ({ errors }) => (
    <div className="error-list">
      {errors.slice(0, showDetailedView ? errors.length : 5).map((error, index) => (
        <div
          key={index}
          style={{
            padding: '8px 12px',
            margin: '4px 0',
            backgroundColor: error.type === 'critical' ? '#ffebee' : '#fff3e0',
            borderLeft: `4px solid ${error.type === 'critical' ? '#d32f2f' : '#f57c00'}`,
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px' }}>
            Row {error.row} {error.column && `- ${error.column}`}: {error.message}
          </div>
          {error.value && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              Value: <code>{JSON.stringify(error.value)}</code>
            </div>
          )}
          {error.suggestion && (
            <div style={{ color: '#1976d2', fontSize: '12px', marginTop: '4px' }}>
              💡 {error.suggestion}
            </div>
          )}
        </div>
      ))}
      {!showDetailedView && errors.length > 5 && (
        <div style={{ textAlign: 'center', padding: '8px', color: '#666' }}>
          ... and {errors.length - 5} more errors
        </div>
      )}
    </div>
  );

  const WarningList: React.FC<{ warnings: ValidationWarning[] }> = ({ warnings }) => (
    <div className="warning-list">
      {warnings.slice(0, showDetailedView ? warnings.length : 5).map((warning, index) => (
        <div
          key={index}
          style={{
            padding: '8px 12px',
            margin: '4px 0',
            backgroundColor: warning.impact === 'high' ? '#fff3e0' : '#f3e5f5',
            borderLeft: `4px solid ${warning.impact === 'high' ? '#f57c00' : '#9c27b0'}`,
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {warning.impact === 'high' && <AlertTriangle size={16} style={{ color: '#f57c00' }} />}
            {warning.impact === 'medium' && <AlertCircle size={16} style={{ color: '#ff9800' }} />}
            {warning.impact === 'low' && <Info size={16} style={{ color: '#2196f3' }} />}
            Row {warning.row} {warning.column && `- ${warning.column}`}: {warning.message}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            Impact: {warning.impact}
          </div>
        </div>
      ))}
      {!showDetailedView && warnings.length > 5 && (
        <div style={{ textAlign: 'center', padding: '8px', color: '#666' }}>
          ... and {warnings.length - 5} more warnings
        </div>
      )}
    </div>
  );

  const RecoveryActionsList: React.FC<{ actions: RecoveryAction[] }> = ({ actions }) => (
    <div className="recovery-actions">
      {actions.map((action, index) => (
        <div
          key={index}
          style={{
            padding: '8px 12px',
            margin: '4px 0',
            backgroundColor: action.type === 'fix' ? '#e8f5e9' :
                           action.type === 'discard' ? '#ffebee' : '#e3f2fd',
            borderLeft: `4px solid ${action.type === 'fix' ? '#4caf50' :
                                   action.type === 'discard' ? '#f44336' : '#2196f3'}`,
            borderRadius: '4px',
            fontSize: '14px'
          }}
        >
          <div style={{ fontWeight: '600', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {action.type === 'fix' && <CheckCircle size={16} style={{ color: '#4caf50' }} />}
            {action.type === 'discard' && <X size={16} style={{ color: '#f44336' }} />}
            {action.type === 'substitute' && <RefreshCw size={16} style={{ color: '#ff9800' }} />}
            {action.type === 'interpolate' && <TrendingUp size={16} style={{ color: '#2196f3' }} />}
            Row {action.row} {action.column && `- ${action.column}`}
          </div>
          <div style={{ marginBottom: '4px' }}>{action.description}</div>
          {action.originalValue !== action.newValue && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              <code>{JSON.stringify(action.originalValue)}</code> → <code>{JSON.stringify(action.newValue)}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div
      style={{
        border: `1px solid ${config.borderColor}`,
        borderRadius: '8px',
        backgroundColor: config.bgColor,
        margin: '16px 0',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${config.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: config.color }}>
            {config.icon}
          </div>
          <div>
            <h3 style={{ margin: 0, color: config.color, fontSize: '18px' }}>
              {config.title}
            </h3>
            <p style={{ margin: '4px 0 0', color: '#666', fontSize: '14px' }}>
              {config.subtitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {validationResult && (
            <div
              style={{
                padding: '4px 8px',
                backgroundColor: validationResult.dataQualityScore >= 80 ? '#e8f5e9' :
                                validationResult.dataQualityScore >= 60 ? '#fff8e1' : '#ffebee',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}
            >
              Quality: {validationResult.dataQualityScore}%
            </div>
          )}

          {onDismiss && (
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: '#666',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {validationResult && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${config.borderColor}`,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px'
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#333' }}>
              {validationResult.summary.totalRows}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Rows</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4caf50' }}>
              {validationResult.validRowCount}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Valid Rows</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f44336' }}>
              {validationResult.errors.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Errors</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ff9800' }}>
              {validationResult.warnings.length}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>Warnings</div>
          </div>

          {validationResult.summary.processingTime && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#2196f3' }}>
                {validationResult.summary.processingTime}ms
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Processing Time</div>
            </div>
          )}
        </div>
      )}

      {/* Network Error Details */}
      {networkError && (
        <div style={{ padding: '16px 20px' }}>
          <div style={{ marginBottom: '12px' }}>
            <strong>Error Type:</strong> {networkError.type}
          </div>
          {networkError.status && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Status:</strong> {networkError.status}
            </div>
          )}
          {networkError.endpoint && (
            <div style={{ marginBottom: '12px' }}>
              <strong>Endpoint:</strong> <code>{networkError.endpoint}</code>
            </div>
          )}
          <div style={{ marginBottom: '12px' }}>
            <strong>Time:</strong> {networkError.timestamp.toLocaleString()}
          </div>
          {networkError.retryAfter && (
            <div>
              <strong>Retry After:</strong> {networkError.retryAfter} seconds
            </div>
          )}
        </div>
      )}

      {/* Detailed View Toggle */}
      {(validationResult || recoveryResult) && (
        <div style={{ borderBottom: `1px solid ${config.borderColor}` }}>
          <button
            onClick={() => setShowDetailedView(!showDetailedView)}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: config.color
            }}
          >
            <span>Detailed Information</span>
            {showDetailedView ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      )}

      {/* Detailed Content */}
      {showDetailedView && (
        <>
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: `1px solid ${config.borderColor}`,
              backgroundColor: '#fafafa'
            }}
          >
            {validationResult?.errors && validationResult.errors.length > 0 && (
              <button
                onClick={() => setActiveTab('errors')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'errors' ? 'white' : 'transparent',
                  borderBottom: activeTab === 'errors' ? `2px solid ${config.color}` : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeTab === 'errors' ? config.color : '#666'
                }}
              >
                Errors ({validationResult.errors.length})
              </button>
            )}

            {validationResult?.warnings && validationResult.warnings.length > 0 && (
              <button
                onClick={() => setActiveTab('warnings')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'warnings' ? 'white' : 'transparent',
                  borderBottom: activeTab === 'warnings' ? `2px solid ${config.color}` : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeTab === 'warnings' ? config.color : '#666'
                }}
              >
                Warnings ({validationResult.warnings.length})
              </button>
            )}

            {recoveryResult?.recoveryActions && recoveryResult.recoveryActions.length > 0 && (
              <button
                onClick={() => setActiveTab('recovery')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'recovery' ? 'white' : 'transparent',
                  borderBottom: activeTab === 'recovery' ? `2px solid ${config.color}` : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeTab === 'recovery' ? config.color : '#666'
                }}
              >
                Recovery ({recoveryResult.recoveryActions.length})
              </button>
            )}

            {validationResult?.recommendations && validationResult.recommendations.length > 0 && (
              <button
                onClick={() => setActiveTab('recommendations')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: activeTab === 'recommendations' ? 'white' : 'transparent',
                  borderBottom: activeTab === 'recommendations' ? `2px solid ${config.color}` : 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: activeTab === 'recommendations' ? config.color : '#666'
                }}
              >
                Recommendations
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div style={{ padding: '16px 20px', maxHeight: '300px', overflowY: 'auto' }}>
            {activeTab === 'errors' && validationResult && (
              <ErrorList errors={validationResult.errors} />
            )}

            {activeTab === 'warnings' && validationResult && (
              <WarningList warnings={validationResult.warnings} />
            )}

            {activeTab === 'recovery' && recoveryResult && (
              <RecoveryActionsList actions={recoveryResult.recoveryActions} />
            )}

            {activeTab === 'recommendations' && validationResult && (
              <div>
                {validationResult.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      margin: '4px 0',
                      backgroundColor: '#e3f2fd',
                      borderLeft: '4px solid #2196f3',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    💡 {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Actions */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: '#fafafa',
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center'
        }}
      >
        <button
          onClick={downloadErrorReport}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '12px',
            color: '#666'
          }}
        >
          <Download size={14} />
          Export Report
        </button>

        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#2196f3',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <RefreshCw size={14} />
            Retry
          </button>
        )}

        {onProceedWithWarnings && validationResult && validationResult.recoverable && (
          <button
            onClick={onProceedWithWarnings}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: '#ff9800',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            <Zap size={14} />
            Proceed with Warnings
          </button>
        )}
      </div>
    </div>
  );
};

export default EnhancedErrorDisplay;