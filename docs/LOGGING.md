# Logging System Guide

This document explains the logging system implemented in FeeMGR and how to use it effectively.

## Overview

FeeMGR uses a custom logging system that provides:
- **Multiple log levels** (debug, info, warn, error)
- **Automatic production silencing** of debug/info logs
- **Structured logging** with context
- **Performance tracking** capabilities
- **Integration-ready** for error tracking services
- **Development-friendly** output with timestamps and colors

## Why Not console.log?

### Problems with console.log
1. ❌ **No log levels** - Everything has equal importance
2. ❌ **Not environment-aware** - Logs everything in production
3. ❌ **No structure** - Hard to filter and search
4. ❌ **No context** - Difficult to trace log sources
5. ❌ **Performance impact** - Adds overhead in production
6. ❌ **Security risk** - May leak sensitive data

### Benefits of the Logger
1. ✅ **Log levels** - Debug, info, warn, error
2. ✅ **Environment-aware** - Silent in production
3. ✅ **Structured** - Consistent format with context
4. ✅ **Trackable** - Know which component logged what
5. ✅ **Fast** - No-op in production
6. ✅ **Safe** - Controlled output

## Quick Start

### Basic Usage

```typescript
import { createLogger } from '../utils/logger';

// Create a logger for your component/module
const logger = createLogger('MyComponent');

// Log at different levels
logger.debug('Detailed debug info', { userId: 123 });
logger.info('User action completed');
logger.warn('Something unexpected happened');
logger.error('Operation failed', error);
```

### Using Pre-configured Loggers

```typescript
import { loggers } from '../utils/logger';

// Use specialized loggers
loggers.auth.info('User logged in');
loggers.api.error('API call failed', error);
loggers.performance.warn('Slow operation detected');
```

## Log Levels

### DEBUG (Level 0)
**When to use:** Detailed information for debugging
**Visible:** Development only
**Example:**
```typescript
logger.debug('Search query executed', { query, resultsCount, duration });
logger.debug('Cache hit', { key, ttl });
```

### INFO (Level 1)
**When to use:** Important application events
**Visible:** Development only
**Example:**
```typescript
logger.info('User authenticated successfully');
logger.info('Data loaded', { recordCount: 150 });
```

### WARN (Level 2)
**When to use:** Unexpected situations that aren't errors
**Visible:** All environments
**Example:**
```typescript
logger.warn('API rate limit approaching');
logger.warn('Using fallback value', { requested, fallback });
```

### ERROR (Level 3)
**When to use:** Error conditions
**Visible:** All environments
**Example:**
```typescript
logger.error('Failed to save user profile', error);
logger.error('Network request failed', { url, status: 500 });
```

## Creating Loggers

### Simple Logger
```typescript
import { createLogger } from '../utils/logger';

const logger = createLogger('ComponentName');
```

### Nested Context
```typescript
const parentLogger = createLogger('ParentComponent');
const childLogger = parentLogger.child('ChildModule');

childLogger.info('Hello'); // Logs: [ParentComponent:ChildModule] Hello
```

## Pre-configured Loggers

```typescript
import { loggers } from '../utils/logger';

// Available loggers
loggers.app          // General application logs
loggers.auth         // Authentication/authorization
loggers.api          // API calls and responses
loggers.ui           // UI interactions
loggers.search       // Search operations
loggers.storage      // LocalStorage/SessionStorage
loggers.performance  // Performance metrics
loggers.worker       // Web Worker operations
loggers.navigation   // Route changes
```

## Helper Functions

### Log Auth Events
```typescript
import { logAuthEvent } from '../utils/logger';

logAuthEvent('login', { userId, email });
logAuthEvent('logout');
logAuthEvent('session-expired');
logAuthEvent('auth-error', { error });
```

### Log API Calls
```typescript
import { logApiCall } from '../utils/logger';

// Success
logApiCall('GET', '/api/users', 245); // duration in ms

// Error
logApiCall('POST', '/api/users', undefined, error);
```

### Log Performance
```typescript
import { logPerformance } from '../utils/logger';

const start = performance.now();
// ... do work ...
const duration = performance.now() - start;

logPerformance('Data processing', duration, { records: 1000 });
```

### Log Search Operations
```typescript
import { logSearch } from '../utils/logger';

logSearch('john smith', 42, 125); // query, results, duration
```

### Log Navigation
```typescript
import { logNavigation } from '../utils/logger';

logNavigation('/dashboard', '/settings');
```

## Advanced Features

### Grouped Logs
```typescript
logger.group('User Profile Update');
logger.info('Validating input');
logger.info('Calling API');
logger.info('Updating UI');
logger.groupEnd();
```

### Tables (Development Only)
```typescript
logger.table([
  { name: 'John', age: 30 },
  { name: 'Jane', age: 25 }
]);
```

### Timing Operations
```typescript
logger.time('expensive-operation');
// ... do work ...
logger.timeEnd('expensive-operation');
// Logs: [Context] expensive-operation: 1234.56ms
```

## Configuration

### Change Minimum Log Level
```typescript
import { configureLogger, LogLevel } from '../utils/logger';

// Only show warnings and errors
configureLogger({
  minLevel: LogLevel.WARN
});
```

### Disable Timestamps
```typescript
configureLogger({
  enableTimestamps: false
});
```

### Add Global Context
```typescript
configureLogger({
  context: 'ProdServer1'
});

// All logs will now include this context
```

### Reset to Defaults
```typescript
import { resetLogger } from '../utils/logger';

resetLogger();
```

## Production Behavior

In production (`NODE_ENV=production`):

1. **console.debug** and **console.log** are disabled (no-op)
2. **Only WARN and ERROR** levels are logged
3. **No timestamps** by default
4. **No colors** (terminal-only feature anyway)
5. **React warnings** are suppressed (console.warn override)

This keeps production logs clean and performant.

## Migration from console.log

### Before
```typescript
console.log('User logged in:', user.email);
console.error('Failed to save:', error);
console.warn('Rate limit exceeded');
```

### After
```typescript
import { createLogger } from '../utils/logger';
const logger = createLogger('Auth');

logger.info('User logged in', { email: user.email });
logger.error('Failed to save', error);
logger.warn('Rate limit exceeded');
```

## Examples by Use Case

### Component Lifecycle
```typescript
const logger = createLogger('MyComponent');

useEffect(() => {
  logger.debug('Component mounted');

  return () => {
    logger.debug('Component unmounting');
  };
}, []);
```

### API Calls
```typescript
const logger = createLogger('UsersService');

async function fetchUsers() {
  logger.debug('Fetching users');

  const start = performance.now();

  try {
    const response = await api.get('/users');
    const duration = performance.now() - start;

    logger.info('Users fetched', { count: response.data.length, duration });
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch users', error);
    throw error;
  }
}
```

### Form Submission
```typescript
const logger = createLogger('UserForm');

async function handleSubmit(data: FormData) {
  logger.debug('Form submitted', { data });

  try {
    await saveUser(data);
    logger.info('User saved successfully', { userId: data.id });
  } catch (error) {
    logger.error('Failed to save user', error);
    toast.error('Save failed');
  }
}
```

### Search Operations
```typescript
const logger = createLogger('Search');

function handleSearch(query: string) {
  logger.debug('Search initiated', { query });

  const start = performance.now();
  const results = performSearch(query);
  const duration = performance.now() - start;

  logger.info('Search completed', {
    query,
    results: results.length,
    duration: `${duration.toFixed(2)}ms`
  });

  if (duration > 500) {
    logger.warn('Slow search detected', { query, duration });
  }

  return results;
}
```

### Error Boundaries
```typescript
const logger = createLogger('ErrorBoundary');

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.error('Component error caught', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack
  });

  // Optionally send to error tracking service
  if (isProduction()) {
    sendToSentry(error, errorInfo);
  }
}
```

## Best Practices

### ✅ DO

1. **Create one logger per component/module**
   ```typescript
   const logger = createLogger('UserProfile');
   ```

2. **Use appropriate log levels**
   ```typescript
   logger.debug('Cache details', { ...cacheInfo });  // Development only
   logger.info('User action completed');              // Important events
   logger.warn('Unexpected state', { ...state });     // Warnings
   logger.error('Operation failed', error);           // Errors
   ```

3. **Include context in data objects**
   ```typescript
   logger.info('User updated', {
     userId: user.id,
     fields: changedFields,
     timestamp: new Date().toISOString()
   });
   ```

4. **Log errors with the error object**
   ```typescript
   logger.error('API call failed', error);  // Includes stack trace
   ```

5. **Use timing for performance-critical operations**
   ```typescript
   logger.time('data-processing');
   processLargeDataset();
   logger.timeEnd('data-processing');
   ```

### ❌ DON'T

1. **Don't use console.log directly**
   ```typescript
   // ❌ Bad
   console.log('User logged in');

   // ✅ Good
   logger.info('User logged in');
   ```

2. **Don't log sensitive data**
   ```typescript
   // ❌ Bad
   logger.info('User credentials', { password: user.password });

   // ✅ Good
   logger.info('User authenticated', { userId: user.id });
   ```

3. **Don't over-log**
   ```typescript
   // ❌ Bad - logs on every render
   logger.debug('Rendering component');

   // ✅ Good - log important events only
   logger.info('User action completed');
   ```

4. **Don't construct expensive log messages for debug level**
   ```typescript
   // ❌ Bad - expensive operation even if not logged
   logger.debug('Data:', JSON.stringify(hugeObject));

   // ✅ Good - pass object directly
   logger.debug('Data:', hugeObject);
   ```

5. **Don't use logger before it's initialized**
   ```typescript
   // ❌ Bad - at module level
   const logger = createLogger('MyModule');
   logger.info('Module loaded');  // Runs at import time!

   // ✅ Good - in function
   const logger = createLogger('MyModule');
   function init() {
     logger.info('Module initialized');
   }
   ```

## Integration with Error Tracking

The logger is designed to integrate with error tracking services:

```typescript
// src/utils/logger.ts (already configured)
error(message: string, error?: any): void {
  log(LogLevel.ERROR, message, this.context, error);

  // Send to error tracking service if configured
  if (isProduction() && error) {
    // TODO: Integrate with Sentry
    // Sentry.captureException(error, {
    //   contexts: { logger: { context: this.context, message } }
    // });
  }
}
```

To enable Sentry integration:
1. Add Sentry SDK: `npm install @sentry/react`
2. Configure in `src/index.tsx`
3. Uncomment error tracking code in logger
4. Add `REACT_APP_SENTRY_DSN` to `.env.local`

## Debugging Tips

### View All Logs in Development
All log levels are visible in development. Open browser console.

### Filter Logs by Context
```javascript
// In browser console
// Show only Auth logs:
localStorage.setItem('debug', 'Auth:*');

// Show only API logs:
localStorage.setItem('debug', 'API:*');

// Show all:
localStorage.removeItem('debug');
```

### Temporarily Enable Debug Logs
```typescript
import { configureLogger, LogLevel } from '../utils/logger';

// Enable all logs
configureLogger({ minLevel: LogLevel.DEBUG });

// Your debugging code here

// Reset
resetLogger();
```

### Check Logger Configuration
```typescript
import { loggers } from '../utils/logger';

// In browser console
loggers.app.debug('Test message');
```

## Performance Considerations

The logger is designed for minimal performance impact:

1. **Production**: `console.log` and `console.debug` are replaced with no-ops
2. **Lazy evaluation**: Data objects are only serialized if the log level is enabled
3. **No timestamps in production**: Saves processing time
4. **Minimal overhead**: Simple checks before expensive operations

## Summary

- ✅ Use `createLogger()` for each module
- ✅ Choose appropriate log levels
- ✅ Include context in log data
- ✅ Replace all `console.log` with logger
- ✅ Test in both development and production modes
- ❌ Don't log sensitive data
- ❌ Don't over-log
- ❌ Don't use console methods directly

## See Also

- [Environment Variables Guide](./ENVIRONMENT_VARIABLES.md)
- [Error Tracking](./ERROR_TRACKING.md)
- [Performance Monitoring](./PERFORMANCE.md)
