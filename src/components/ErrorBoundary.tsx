import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';
import { APP_CONFIG } from '../config/constants';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      eventId: Date.now().toString(36) + Math.random().toString(36).substr(2),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      eventId: this.state.eventId,
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a production app, you would report this to an error tracking service
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI based on error level
      const { level = 'component' } = this.props;

      if (level === 'page') {
        return this.renderPageLevelError();
      } else if (level === 'section') {
        return this.renderSectionLevelError();
      } else {
        return this.renderComponentLevelError();
      }
    }

    return this.props.children;
  }

  private renderPageLevelError() {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fafafa',
        padding: '20px',
      }}>
        <div style={{
          maxWidth: '600px',
          width: '100%',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}>
          <AlertTriangle
            size={64}
            style={{
              color: APP_CONFIG.UI.COLORS.ERROR.replace('#ffebee', '#f44336'),
              marginBottom: '20px'
            }}
          />

          <h1 style={{
            color: '#333',
            marginBottom: '16px',
            fontSize: '24px'
          }}>
            Something went wrong
          </h1>

          <p style={{
            color: '#666',
            marginBottom: '24px',
            lineHeight: '1.5'
          }}>
            The application encountered an unexpected error. Please try reloading the page or contact support if the problem persists.
          </p>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196f3',
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
              Try Again
            </button>

            <button
              onClick={this.handleReload}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ff9800',
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
              Reload Page
            </button>
          </div>

          {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}
        </div>
      </div>
    );
  }

  private renderSectionLevelError() {
    return (
      <div style={{
        padding: '20px',
        margin: '20px 0',
        backgroundColor: APP_CONFIG.UI.COLORS.ERROR,
        border: `1px solid #ffcdd2`,
        borderRadius: '8px',
        textAlign: 'center',
      }}>
        <AlertTriangle
          size={32}
          style={{
            color: '#d32f2f',
            marginBottom: '12px'
          }}
        />

        <h3 style={{
          color: '#d32f2f',
          marginBottom: '8px',
          fontSize: '16px'
        }}>
          Section Error
        </h3>

        <p style={{
          color: '#666',
          marginBottom: '16px',
          fontSize: '14px'
        }}>
          This section encountered an error and couldn't load properly.
        </p>

        <button
          onClick={this.handleRetry}
          style={{
            padding: '8px 16px',
            backgroundColor: '#d32f2f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <RefreshCw size={14} />
          Retry
        </button>

        {process.env.NODE_ENV === 'development' && this.renderErrorDetails()}
      </div>
    );
  }

  private renderComponentLevelError() {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: '#fff3e0',
        border: '1px solid #ffcc02',
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <Bug size={20} style={{ color: '#f57c00', flexShrink: 0 }} />

        <div style={{ flex: 1 }}>
          <p style={{
            color: '#e65100',
            margin: '0 0 4px 0',
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            Component Error
          </p>
          <p style={{
            color: '#666',
            margin: 0,
            fontSize: '12px'
          }}>
            This component failed to load.
          </p>
        </div>

        <button
          onClick={this.handleRetry}
          style={{
            padding: '6px 12px',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px',
            flexShrink: 0,
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  private renderErrorDetails() {
    const { error, errorInfo, eventId } = this.state;

    return (
      <details style={{
        marginTop: '24px',
        textAlign: 'left',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        padding: '16px',
      }}>
        <summary style={{
          cursor: 'pointer',
          fontWeight: 'bold',
          color: '#666',
          marginBottom: '12px',
        }}>
          Error Details (Development Mode)
        </summary>

        <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Event ID:</strong> {eventId}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <strong>Error:</strong> {error?.message}
          </div>

          {error?.stack && (
            <div style={{ marginBottom: '8px' }}>
              <strong>Stack Trace:</strong>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '11px',
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                {error.stack}
              </pre>
            </div>
          )}

          {errorInfo?.componentStack && (
            <div>
              <strong>Component Stack:</strong>
              <pre style={{
                whiteSpace: 'pre-wrap',
                fontSize: '11px',
                backgroundColor: 'white',
                padding: '8px',
                borderRadius: '4px',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  }
}

export default ErrorBoundary;