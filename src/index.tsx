import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import EnvironmentErrorScreen from './components/EnvironmentErrorScreen';
import { validateEnvironment, printEnvironmentInfo } from './utils/envValidation';
import { queryClient } from './lib/queryClient';
import { initSentry } from './lib/sentry';

// Initialize Sentry before anything else
initSentry();

// Lazy load React Query Devtools (development only)
const LazyReactQueryDevtools = React.lazy(() =>
  import('@tanstack/react-query-devtools' as any).then((mod: any) => ({
    default: mod.ReactQueryDevtools,
  }))
);

// Validate environment variables before rendering the app
const validationResult = validateEnvironment();

// Print environment info in development
printEnvironmentInfo();

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// If validation fails, show error screen instead of app
if (!validationResult.valid) {
  root.render(
    <React.StrictMode>
      <EnvironmentErrorScreen validationResult={validationResult} />
    </React.StrictMode>
  );
} else {
  // Validation passed, render the app
  root.render(
    <React.StrictMode>
      <ErrorBoundary
        level="page"
        onError={(error, errorInfo) => {
          // Error is already captured by ErrorBoundary's componentDidCatch
          // This is just for any additional logging if needed
          console.error('Application Error:', error, errorInfo);
        }}
      >
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <App />
            </AuthProvider>
          </BrowserRouter>
          {/* React Query Devtools - only in development */}
          {process.env.NODE_ENV === 'development' && (
            <React.Suspense fallback={null}>
              <LazyReactQueryDevtools />
            </React.Suspense>
          )}
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
