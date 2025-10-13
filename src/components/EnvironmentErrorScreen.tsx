import React from 'react';
import { AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';
import { ValidationResult } from '../utils/envValidation';

interface EnvironmentErrorScreenProps {
  validationResult: ValidationResult;
}

const EnvironmentErrorScreen: React.FC<EnvironmentErrorScreenProps> = ({ validationResult }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const exampleEnvContent = `# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google Maps API (for address autocomplete)
# REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Optional: Sentry (for error tracking)
# REACT_APP_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Application Version
REACT_APP_VERSION=0.1.0
`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8f9fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        width: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <AlertTriangle size={32} />
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>
              Environment Configuration Error
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
              Required environment variables are missing or invalid
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Errors */}
          {validationResult.errors.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#dc3545'
              }}>
                Missing Required Variables
              </h2>

              {validationResult.errors.map((error, index) => (
                <div key={error.key} style={{
                  backgroundColor: '#fff5f5',
                  border: '1px solid #fed7d7',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: index < validationResult.errors.length - 1 ? '16px' : '0'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <code style={{
                        backgroundColor: '#feb2b2',
                        color: '#742a2a',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}>
                        {error.key}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(error.key, error.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        color: '#742a2a',
                        fontSize: '12px'
                      }}
                      title="Copy variable name"
                    >
                      {copiedKey === error.key ? (
                        <>
                          <Check size={14} />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p style={{
                    margin: '8px 0',
                    fontSize: '14px',
                    color: '#742a2a',
                    fontWeight: '500'
                  }}>
                    {error.errorMessage}
                  </p>

                  <p style={{
                    margin: '4px 0',
                    fontSize: '13px',
                    color: '#9b2c2c'
                  }}>
                    {error.description}
                  </p>

                  {error.setupInstructions && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      backgroundColor: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#4a5568'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        marginBottom: '8px',
                        color: '#2d3748'
                      }}>
                        Setup Instructions:
                      </div>
                      <pre style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        lineHeight: '1.6'
                      }}>
                        {error.setupInstructions.trim()}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {validationResult.warnings.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                color: '#f59e0b'
              }}>
                Optional Configuration Warnings
              </h2>

              <div style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '16px'
              }}>
                <p style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  color: '#92400e'
                }}>
                  These features will be disabled:
                </p>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  color: '#92400e',
                  fontSize: '13px'
                }}>
                  {validationResult.warnings.map((warning) => (
                    <li key={warning.key} style={{ marginBottom: '4px' }}>
                      <code style={{
                        backgroundColor: '#fde68a',
                        padding: '2px 6px',
                        borderRadius: '3px'
                      }}>
                        {warning.key}
                      </code>
                      {' - '}
                      {warning.description}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Quick Start Guide */}
          <div style={{
            backgroundColor: '#f0f9ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: '600',
              color: '#1e40af'
            }}>
              Quick Start Guide
            </h3>

            <ol style={{
              margin: 0,
              paddingLeft: '20px',
              color: '#1e40af',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              <li>
                Create a file named <code style={{
                  backgroundColor: '#dbeafe',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontWeight: '600'
                }}>.env.local</code> in your project root
              </li>
              <li>
                Copy the example configuration below
              </li>
              <li>
                Fill in your actual Supabase credentials
              </li>
              <li>
                Restart your development server (<code style={{
                  backgroundColor: '#dbeafe',
                  padding: '2px 6px',
                  borderRadius: '3px'
                }}>npm start</code>)
              </li>
            </ol>
          </div>

          {/* Example .env.local */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '14px',
                fontWeight: '600',
                color: '#4a5568'
              }}>
                Example .env.local file:
              </h3>
              <button
                onClick={() => copyToClipboard(exampleEnvContent, 'env-example')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: '500'
                }}
              >
                {copiedKey === 'env-example' ? (
                  <>
                    <Check size={16} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy to Clipboard
                  </>
                )}
              </button>
            </div>

            <pre style={{
              backgroundColor: '#1e293b',
              color: '#e2e8f0',
              padding: '16px',
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '12px',
              lineHeight: '1.6',
              margin: 0,
              fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
            }}>
              {exampleEnvContent}
            </pre>
          </div>

          {/* Help Links */}
          <div style={{
            borderTop: '1px solid #e5e7eb',
            paddingTop: '20px',
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <ExternalLink size={16} />
              Open Supabase Dashboard
            </a>

            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#3b82f6',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <ExternalLink size={16} />
              Setup Documentation
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentErrorScreen;
