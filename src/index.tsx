import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import EnvironmentErrorScreen from './components/EnvironmentErrorScreen';
import { validateEnvironment, printEnvironmentInfo } from './utils/envValidation';

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
          // In a production app, you would send this to an error tracking service
          console.error('Application Error:', error, errorInfo);

          // Optional: Send to error tracking service
          // Example: Sentry, LogRocket, Bugsnag, etc.
          // errorTrackingService.captureException(error, { extra: errorInfo });
        }}
      >
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
