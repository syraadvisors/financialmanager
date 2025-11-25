# Sentry Error Tracking Setup Guide

## Overview

Sentry has been integrated into the application for comprehensive error tracking, performance monitoring, and user session tracking. This guide explains how to set it up and use it.

## Features

✅ **Error Tracking**
- Automatic error capture from ErrorBoundary
- React component error tracking
- Unhandled promise rejections
- Network error filtering

✅ **Performance Monitoring**
- Web Vitals tracking (CLS, FID, FCP, LCP, TTFB)
- API request performance
- Transaction tracing

✅ **User Context**
- Automatic user identification
- Firm ID tracking
- Session context

✅ **Error Filtering**
- Filters out known non-critical errors
- Browser extension errors ignored
- Network errors configurable

## Setup Instructions

### 1. Create a Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for a free account (or use existing)
3. Create a new project
4. Select **React** as the platform

### 2. Get Your DSN

1. In your Sentry project, go to **Settings → Client Keys (DSN)**
2. Copy the DSN (it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 3. Configure Environment Variable

Add to your `.env.local` file:

```env
REACT_APP_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Note:** The DSN is safe to expose in client-side code. It's a public key that only allows sending errors, not reading data.

### 4. Restart Development Server

```bash
npm start
```

You should see in the console:
```
✅ Sentry error tracking initialized
```

If you don't see this message, check that:
- The DSN is correctly set in `.env.local`
- The server was restarted after adding the variable
- The DSN format is correct (starts with `https://`)

## How It Works

### Automatic Error Capture

Errors are automatically captured from:

1. **ErrorBoundary** - React component errors
2. **Unhandled Errors** - JavaScript errors not caught
3. **Promise Rejections** - Unhandled promise rejections
4. **Network Errors** - API request failures (configurable)

### User Context

User context is automatically set when:
- User logs in (from AuthContext)
- User profile loads
- User logs out (context is cleared)

The following information is tracked:
- User ID
- Email
- Full Name (username)
- Firm ID

### Performance Monitoring

Web Vitals are automatically tracked:
- **CLS** (Cumulative Layout Shift)
- **FID** (First Input Delay)
- **FCP** (First Contentful Paint)
- **LCP** (Largest Contentful Paint)
- **TTFB** (Time to First Byte)

## Configuration

### Error Filtering

The following errors are filtered out by default:

- Browser extension errors
- ResizeObserver loop errors (harmless)
- Network errors (configurable in `src/lib/sentry.ts`)

To modify filtering, edit `src/lib/sentry.ts`:

```typescript
beforeSend(event, hint) {
  // Add your custom filtering logic
  return event; // Return null to ignore
}
```

### Performance Sampling

- **Development**: 100% of transactions tracked
- **Production**: 10% of transactions tracked (configurable)

To change sampling rate, edit `src/lib/sentry.ts`:

```typescript
tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
```

### Session Replay (Optional)

Session replay is disabled by default. To enable:

1. Edit `src/lib/sentry.ts`
2. Update replay sample rates:

```typescript
replaysSessionSampleRate: 0.1, // 10% of sessions
replaysOnErrorSampleRate: 1.0, // 100% of error sessions
```

**Note:** Session replay may impact performance and privacy. Enable only if needed.

## Manual Error Reporting

You can manually capture errors or messages:

```typescript
import { captureException, captureMessage } from '../lib/sentry';

// Capture an exception
try {
  // Some code
} catch (error) {
  captureException(error, {
    extra: {
      userId: user.id,
      action: 'createAccount',
    },
  });
}

// Capture a message
captureMessage('Something important happened', 'info');
```

## Adding Breadcrumbs

Add breadcrumbs for debugging:

```typescript
import { addSentryBreadcrumb } from '../lib/sentry';

addSentryBreadcrumb('User clicked save button', 'user-action', 'info');
```

## Production Deployment

### Environment Variables

Set the Sentry DSN in your hosting platform:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add `REACT_APP_SENTRY_DSN` with your DSN
3. Redeploy

**Netlify:**
1. Go to Site Settings → Build & Deploy → Environment
2. Add `REACT_APP_SENTRY_DSN` with your DSN
3. Trigger new deploy

**Other Platforms:**
Set `REACT_APP_SENTRY_DSN` as an environment variable in your deployment configuration.

### Release Tracking

Releases are automatically tracked using `REACT_APP_VERSION`:

```env
REACT_APP_VERSION=1.0.0
```

This helps you:
- Track which version has errors
- See error trends over releases
- Filter errors by version

## Viewing Errors in Sentry

1. Go to your Sentry project dashboard
2. Navigate to **Issues** to see all errors
3. Click on an error to see:
   - Stack trace
   - User context
   - Browser/device info
   - Breadcrumbs (user actions before error)
   - Performance data

## Best Practices

1. **Don't Over-Filter**: Keep some network errors for debugging
2. **Use Tags**: Add tags to categorize errors
3. **Set User Context**: Always set user context (already done automatically)
4. **Monitor Performance**: Check Web Vitals regularly
5. **Review Errors**: Check Sentry dashboard regularly

## Troubleshooting

### Sentry Not Initializing

**Check:**
- DSN is set in `.env.local`
- Server was restarted
- DSN format is correct
- Check browser console for errors

### Errors Not Appearing in Sentry

**Check:**
- DSN is correct
- Network requests to Sentry are not blocked
- Error is not being filtered out
- Check Sentry project settings

### Too Many Errors

**Solutions:**
- Adjust error filtering in `src/lib/sentry.ts`
- Add more errors to `ignoreErrors` array
- Adjust `beforeSend` to filter more aggressively

## Security

- **DSN is Public**: The DSN is embedded in client code (this is safe)
- **No Sensitive Data**: Don't send passwords, tokens, or PII
- **User Privacy**: User context is set automatically (email, name, firm ID)
- **Error Data**: Error messages may contain user data - review before sharing

## Support

For Sentry-specific issues:
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/react/)
- [Sentry Support](https://sentry.io/support/)

For application-specific issues:
- Check `src/lib/sentry.ts` for configuration
- Review error filtering logic
- Check environment variable setup



