/**
 * Sentry Error Tracking Configuration
 * 
 * This module initializes Sentry for error tracking and performance monitoring.
 * Sentry will only be initialized if REACT_APP_SENTRY_DSN is configured.
 */

import * as Sentry from '@sentry/react';

/**
 * Initialize Sentry if DSN is configured
 */
export function initSentry(): void {
  const dsn = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  const version = process.env.REACT_APP_VERSION || '0.1.0';

  // Only initialize if DSN is provided
  if (!dsn) {
    if (environment === 'development') {
      console.log('ℹ️ Sentry error tracking is disabled (REACT_APP_SENTRY_DSN not configured)');
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment,
      release: `feemgr@${version}`,
      
      // Performance Monitoring (simplified - can be enhanced later)
      // Performance monitoring is enabled by default in @sentry/react
      tracesSampleRate: environment === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev
      
      // Session Replay (optional - can be enabled later)
      replaysSessionSampleRate: 0, // Disabled by default
      replaysOnErrorSampleRate: 0, // Disabled by default

      // Error Filtering
      beforeSend(event, hint) {
        // Filter out known non-critical errors
        const error = hint.originalException;
        
        // Ignore network errors that are expected (e.g., CORS, network failures)
        if (error instanceof Error) {
          const errorMessage = error.message.toLowerCase();
          
          // Filter out common non-critical errors
          if (
            errorMessage.includes('network error') ||
            errorMessage.includes('failed to fetch') ||
            errorMessage.includes('network request failed') ||
            errorMessage.includes('load failed')
          ) {
            // Only ignore if it's a network error without user context
            // You might want to keep these for debugging
            return null;
          }
        }

        // Add custom tags
        event.tags = {
          ...event.tags,
          component: 'react-app',
        };

        return event;
      },

      // Ignore specific errors (optional)
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'atomicFindClose',
        'fb_xd_fragment',
        'bmi_SafeAddOnload',
        'EBCallBackMessageReceived',
        // Network errors that are expected
        'NetworkError',
        'Network request failed',
        // ResizeObserver errors (common and harmless)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
      ],

      // Set user context (will be updated by AuthContext)
      initialScope: {
        tags: {
          environment,
          version,
        },
      },
    });

    console.log('✅ Sentry error tracking initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
  }
}

/**
 * Set user context for Sentry
 * Call this after user authentication
 */
export function setSentryUser(user: {
  id: string;
  email?: string;
  username?: string;
  firmId?: string;
}): void {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
    // Add custom context
    firmId: user.firmId,
  });
}

/**
 * Clear user context (on logout)
 */
export function clearSentryUser(): void {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addSentryBreadcrumb(message: string, category?: string, level?: Sentry.SeverityLevel): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'default',
    level: level || 'info',
    timestamp: Date.now() / 1000,
  });
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): string {
  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message manually
 */
export function captureMessage(message: string, level?: Sentry.SeverityLevel): string {
  return Sentry.captureMessage(message, level);
}


