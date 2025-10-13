# Environment Variables Guide

This document explains the environment variable configuration system for FeeMGR and how to set up your development environment.

## Overview

FeeMGR uses environment variables for configuration to:
- Keep sensitive credentials out of source code
- Allow different configurations for development, staging, and production
- Enable optional features without code changes
- Improve security and deployment flexibility

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local` with your actual credentials:**
   - Get Supabase credentials from: https://app.supabase.com → Your Project → Settings → API
   - Add optional API keys as needed

3. **Restart your development server:**
   ```bash
   npm start
   ```

## Required Variables

### REACT_APP_SUPABASE_URL

**Required:** Yes
**Description:** Your Supabase project URL
**Format:** `https://your-project-id.supabase.co`

**How to get it:**
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to: Settings → API
4. Copy the "Project URL"

**Example:**
```env
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

**Validation:**
- Must be a valid HTTPS URL
- Must contain "supabase" in the hostname
- Application will not start without this

### REACT_APP_SUPABASE_ANON_KEY

**Required:** Yes
**Description:** Supabase anonymous/public API key
**Format:** JWT token (starts with `eyJ...`)

**How to get it:**
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to: Settings → API
4. Copy the "anon" / "public" key (the long one, not the service role key)

**Example:**
```env
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6...
```

**Validation:**
- Must be a valid JWT token format (3 parts separated by dots)
- Must be at least 100 characters long
- Application will not start without this

**Security Note:** The anon key is safe to expose in client-side code. It provides read-only access controlled by Row Level Security (RLS) policies in your database.

## Optional Variables

### REACT_APP_GOOGLE_MAPS_API_KEY

**Required:** No
**Description:** Google Maps API key for address autocomplete
**Format:** API key string

**How to get it:**
1. Go to: https://console.cloud.google.com
2. Create or select a project
3. Enable these APIs:
   - Places API
   - Maps JavaScript API
4. Create an API key in: APIs & Services → Credentials
5. **Important:** Restrict the key to your domain for security

**Example:**
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
```

**Without this variable:**
- Address fields will still work
- Auto-complete suggestions will not be available
- Users will need to type addresses manually

**Validation:**
- Must be at least 20 characters long
- Warning shown if invalid, but app will still run

### REACT_APP_SENTRY_DSN

**Required:** No
**Description:** Sentry DSN for error tracking and monitoring
**Format:** `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

**How to get it:**
1. Go to: https://sentry.io
2. Create an account and project
3. Copy the DSN from project settings

**Example:**
```env
REACT_APP_SENTRY_DSN=https://1234567890abcdef@o123456.ingest.sentry.io/123456
```

**Without this variable:**
- Errors will only be logged to browser console
- No centralized error tracking
- No production error monitoring

**Validation:**
- Must be a valid HTTPS URL
- Must contain "sentry" in the hostname
- Warning shown if invalid, but app will still run

### REACT_APP_VERSION

**Required:** No (has default)
**Description:** Application version number
**Format:** Semantic versioning (e.g., `1.2.3`)
**Default:** `0.0.0`

**Example:**
```env
REACT_APP_VERSION=0.1.0
```

**Used for:**
- Displaying version in UI (Help → About)
- Error reports
- Debugging and support

**Validation:**
- Should match pattern: `x.y.z` (e.g., `1.0.0`)
- Warning shown if invalid format, but app will still run

## Environment Variable Validation

The application validates environment variables at startup before rendering any UI. This provides:

### 1. Early Error Detection
- Catches missing or invalid configuration immediately
- Prevents runtime errors from bad configuration
- Shows helpful error messages instead of cryptic failures

### 2. User-Friendly Error Screen
If validation fails, you'll see a detailed error screen with:
- Which variables are missing or invalid
- Specific error messages for each issue
- Step-by-step setup instructions
- Copy-to-clipboard functionality
- Example `.env.local` configuration
- Links to relevant documentation

### 3. Development Helpers
In development mode, the console shows:
- Which environment variables are configured
- Validation status for each variable
- Warnings for optional features that are disabled
- Redacted values for security

**Example console output:**
```
🔧 Environment Configuration
Mode: development
Version: 0.1.0

Configured Variables:
  ✓ REACT_APP_SUPABASE_URL: https://abc...co
  ✓ REACT_APP_SUPABASE_ANON_KEY: eyJhbGciOi...nopq
  ○ REACT_APP_GOOGLE_MAPS_API_KEY: (not set)
  ○ REACT_APP_SENTRY_DSN: (not set)
  ✓ REACT_APP_VERSION: 0.1.0

✅ Environment configuration validated successfully
```

## File Locations

### `.env.local` (Your configuration - DO NOT COMMIT)
- Contains your actual credentials
- Lives in project root
- **Must be in `.gitignore`** (it is by default)
- Created by copying `.env.local.example`

### `.env.local.example` (Template - committed to Git)
- Template with example values
- Contains documentation and instructions
- Safe to commit (no real credentials)
- Used as reference for new developers

### `.env` (NOT USED - avoid this)
- Create-React-App can use this file
- We use `.env.local` instead because:
  - It has higher precedence
  - It's explicitly for local overrides
  - It's more clearly excluded from Git

## Environment-Specific Variables

React supports different `.env` files for different environments:

| File | Environment | Loaded By |
|------|-------------|-----------|
| `.env` | All | Always (lowest priority) |
| `.env.local` | All (except test) | Always (overrides `.env`) |
| `.env.development` | Development | `npm start` |
| `.env.development.local` | Development | `npm start` (overrides `.env.development`) |
| `.env.production` | Production | `npm run build` |
| `.env.production.local` | Production | `npm run build` (overrides `.env.production`) |
| `.env.test` | Test | `npm test` |
| `.env.test.local` | Test | `npm test` (overrides `.env.test`) |

**We recommend:**
- Use `.env.local` for local development (already configured)
- Use hosting platform's environment variables for production
- Don't commit any `.local` files

## React Environment Variable Rules

### 1. Must Start with `REACT_APP_`
```env
# ✅ Correct - accessible in React
REACT_APP_SUPABASE_URL=https://...

# ❌ Wrong - will NOT be accessible
SUPABASE_URL=https://...
```

**Why?** Create-React-App only exposes variables starting with `REACT_APP_` to prevent accidentally exposing server secrets to the client.

### 2. Requires Server Restart
Changes to environment variables require restarting the development server:

```bash
# Stop the server (Ctrl+C)
# Then start it again:
npm start
```

**Why?** Environment variables are embedded at build time, not runtime.

### 3. No Quotes Needed
```env
# ✅ Correct
REACT_APP_SUPABASE_URL=https://example.supabase.co

# ❌ Wrong (quotes will be included in the value)
REACT_APP_SUPABASE_URL="https://example.supabase.co"
```

### 4. No Spaces Around `=`
```env
# ✅ Correct
REACT_APP_SUPABASE_URL=https://example.supabase.co

# ❌ Wrong
REACT_APP_SUPABASE_URL = https://example.supabase.co
```

## Production Deployment

### Don't Use `.env.local` in Production

For production deployments, set environment variables in your hosting platform:

#### Vercel
1. Go to your project settings
2. Navigate to: Environment Variables
3. Add each variable (without `export` or quotes)
4. Redeploy

#### Netlify
1. Go to: Site Settings → Build & Deploy → Environment
2. Add each variable
3. Trigger a new deploy

#### AWS Amplify
1. Go to: App Settings → Environment Variables
2. Add each variable
3. Redeploy

#### Docker
```dockerfile
# In your Dockerfile or docker-compose.yml
ENV REACT_APP_SUPABASE_URL=https://your-project.supabase.co
ENV REACT_APP_SUPABASE_ANON_KEY=your-key-here
```

Or use `--env-file`:
```bash
docker run --env-file .env.production your-image
```

## Security Best Practices

### ✅ Safe to Expose (Client-Side)
- `REACT_APP_SUPABASE_URL` - Public URL
- `REACT_APP_SUPABASE_ANON_KEY` - Protected by RLS policies
- `REACT_APP_GOOGLE_MAPS_API_KEY` - Restrict by domain
- `REACT_APP_VERSION` - Not sensitive

### ❌ NEVER Expose (Server-Side Only)
- Database passwords
- Supabase `service_role` key
- API secret keys
- Private keys
- Authentication secrets

**Remember:** Anything in `REACT_APP_*` is embedded in the client-side JavaScript bundle and visible to users. Only use public/anon keys.

## Troubleshooting

### Problem: "Environment Configuration Error" screen

**Solution:**
1. Check that `.env.local` exists in project root
2. Verify variables are spelled correctly (including `REACT_APP_` prefix)
3. Check for typos in variable names
4. Ensure no extra spaces around `=`
5. Restart development server (`Ctrl+C`, then `npm start`)

### Problem: Variables are `undefined` in code

**Causes:**
1. Variable doesn't start with `REACT_APP_`
2. Server wasn't restarted after adding variable
3. Typo in variable name
4. Using wrong `.env` file

**Solution:**
```bash
# Stop server (Ctrl+C)
# Verify your .env.local file:
cat .env.local  # (Mac/Linux)
type .env.local  # (Windows)

# Restart server:
npm start
```

### Problem: "Invalid Supabase URL" error

**Check:**
- URL starts with `https://`
- URL ends with `.supabase.co`
- No trailing slash
- No quotes around the value
- Copied from correct field in Supabase dashboard

### Problem: Google Maps not working

**Possible causes:**
1. API key not set (autocomplete disabled, but not an error)
2. API not enabled in Google Cloud Console
3. Key restrictions blocking local development
4. Billing not enabled on Google Cloud project

**Solution:**
1. Enable Places API and Maps JavaScript API
2. For development, use unrestricted key or add `localhost` to restrictions
3. For production, restrict key to your domain

## Advanced Usage

### Accessing Environment Variables in Code

```typescript
// ✅ Recommended: Use validation utility
import { getEnvironmentConfig } from './utils/envValidation';

const config = getEnvironmentConfig();
console.log(config.supabaseUrl);
console.log(config.googleMapsApiKey); // May be undefined

// ✅ Direct access (for custom variables)
const customVar = process.env.REACT_APP_CUSTOM_VAR;

// ❌ Avoid: Direct access without validation for required vars
const url = process.env.REACT_APP_SUPABASE_URL; // May be undefined!
```

### Checking Environment

```typescript
import { isDevelopment, isProduction } from './utils/envValidation';

if (isDevelopment()) {
  console.log('Development mode - verbose logging enabled');
}

if (isProduction()) {
  // Enable production optimizations
}
```

### Adding New Environment Variables

1. **Add to validation** ([src/utils/envValidation.ts](../src/utils/envValidation.ts)):
   ```typescript
   const ENV_VAR_CONFIGS: EnvVarConfig[] = [
     // ... existing configs
     {
       key: 'REACT_APP_NEW_VARIABLE',
       required: false,
       description: 'Description of what this does',
       validator: (value) => value.length > 0,
       errorMessage: 'Invalid format',
       setupInstructions: `
         1. Setup step 1
         2. Setup step 2
       `
     }
   ];
   ```

2. **Add to EnvironmentConfig interface:**
   ```typescript
   export interface EnvironmentConfig {
     // ... existing fields
     newVariable?: string;
   }
   ```

3. **Update `.env.local.example`** with documentation

4. **Use in your code:**
   ```typescript
   import { getEnvironmentConfig } from './utils/envValidation';

   const config = getEnvironmentConfig();
   if (config.newVariable) {
     // Use the variable
   }
   ```

## Reference Links

- [Create React App - Environment Variables](https://create-react-app.dev/docs/adding-custom-environment-variables/)
- [Supabase - API Settings](https://supabase.com/docs/guides/api)
- [Google Maps Platform - Get API Key](https://developers.google.com/maps/documentation/javascript/get-api-key)
- [Sentry - Getting Started](https://docs.sentry.io/platforms/javascript/guides/react/)

## Support

If you encounter issues:
1. Check this documentation
2. Review error messages in the error screen
3. Check browser console for warnings
4. Verify all steps in the Quick Start guide
5. See [SETUP.md](../SETUP.md) for full setup instructions
