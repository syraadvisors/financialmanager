/**
 * Error Tracking with Sentry
 *
 * Setup Instructions:
 * 1. Install Sentry: npm install --save @sentry/react
 * 2. Sign up at https://sentry.io/signup/ (free tier: 5,000 errors/month)
 * 3. Create a new React project in Sentry dashboard
 * 4. Copy your DSN from the project settings
 * 5. Add to .env.local:
 *    REACT_APP_SENTRY_DSN=https://your-project-dsn@sentry.io/project-id
 *    REACT_APP_VERSION=0.1.0
 * 6. Uncomment the code below after installing @sentry/react
 * 7. In App.tsx, call initializeErrorTracking() in useEffect
 * 8. Wrap your app with <Sentry.ErrorBoundary>
 */

// Uncomment after installing @sentry/react:
/*
import * as Sentry from '@sentry/react';

export const initializeErrorTracking = () => {
  // Only initialize in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN, // Add to .env.local
      environment: process.env.NODE_ENV,

      // Set sample rate for production (25% of errors)
      sampleRate: 0.25,

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Release tracking
      release: `feemgr@${process.env.REACT_APP_VERSION || '0.1.0'}`,

      // Enhanced error context
      beforeSend(event, hint) {
        // Add custom context
        const error = hint.originalException as Error;

        // Filter out network errors in development
        if (error?.message?.includes('Network')) {
          return null; // Don't send
        }

        return event;
      },

      // Integrations
      integrations: [
        new Sentry.BrowserTracing({
          // Track navigation
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            // Add React Router history if using
          ),
        }),
        new Sentry.Replay({
          // Session replay for debugging
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }
};

// Helper to manually track errors
export const logError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
};

// Track custom events
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(eventName, {
      level: 'info',
      extra: data,
    });
  }
};
*/

// Temporary placeholders until Sentry is installed
export const initializeErrorTracking = () => {
  console.log('Error tracking not yet configured. Install @sentry/react to enable.');
};

export const logError = (error: Error, context?: Record<string, any>) => {
  console.error('Error:', error, context);
};

export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  console.log('Event:', eventName, data);
};

/**
 * Integration with App.tsx:
 *
 * After installing @sentry/react, update App.tsx:
 *
 * import { initializeErrorTracking } from './utils/errorTracking';
 * import * as Sentry from '@sentry/react';
 *
 * // Initialize at app start
 * useEffect(() => {
 *   initializeErrorTracking();
 * }, []);
 *
 * // Wrap your app with Sentry ErrorBoundary
 * const App: React.FC = () => {
 *   return (
 *     <Sentry.ErrorBoundary
 *       fallback={<ErrorFallback />}
 *       showDialog
 *     >
 *       <AppProvider enablePersistence={true}>
 *         <SearchProvider>
 *           <AppContent />
 *         </SearchProvider>
 *       </AppProvider>
 *     </Sentry.ErrorBoundary>
 *   );
 * };
 */
