/**
 * Environment Variable Validation Utility
 *
 * This module validates all required environment variables at application startup
 * and provides helpful error messages for missing or invalid configuration.
 */

// Define all environment variables used in the application
export interface EnvironmentConfig {
  // Required
  supabaseUrl: string;
  supabaseAnonKey: string;

  // Optional
  googleMapsApiKey?: string;
  sentryDsn?: string;
  version?: string;
}

// Define validation rules for each environment variable
interface EnvVarConfig {
  key: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
  setupInstructions?: string;
}

const ENV_VAR_CONFIGS: EnvVarConfig[] = [
  {
    key: 'REACT_APP_SUPABASE_URL',
    required: true,
    description: 'Supabase project URL',
    validator: (value) => {
      // Validate URL format and that it's a Supabase URL
      try {
        const url = new URL(value);
        return url.protocol === 'https:' &&
               (url.hostname.endsWith('.supabase.co') || url.hostname.includes('supabase'));
      } catch {
        return false;
      }
    },
    errorMessage: 'Invalid Supabase URL format. Expected: https://your-project-id.supabase.co',
    setupInstructions: `
1. Go to your Supabase project dashboard (https://app.supabase.com)
2. Navigate to: Settings → API
3. Copy the "Project URL" (e.g., https://xxxxx.supabase.co)
4. Add to .env.local: REACT_APP_SUPABASE_URL=https://xxxxx.supabase.co`
  },
  {
    key: 'REACT_APP_SUPABASE_ANON_KEY',
    required: true,
    description: 'Supabase anonymous/public key',
    validator: (value) => {
      // Validate JWT token format (basic check)
      const parts = value.split('.');
      return parts.length === 3 && value.length > 100;
    },
    errorMessage: 'Invalid Supabase anon key format. Expected a JWT token (eyJ...)',
    setupInstructions: `
1. Go to your Supabase project dashboard (https://app.supabase.com)
2. Navigate to: Settings → API
3. Copy the "anon" / "public" key (starts with eyJ...)
4. Add to .env.local: REACT_APP_SUPABASE_ANON_KEY=eyJ...`
  },
  {
    key: 'REACT_APP_GOOGLE_MAPS_API_KEY',
    required: false,
    description: 'Google Maps API key (optional - for address autocomplete)',
    validator: (value) => value.length > 20,
    errorMessage: 'Invalid Google Maps API key format',
    setupInstructions: `
1. Go to Google Cloud Console: https://console.cloud.google.com
2. Navigate to: APIs & Services → Credentials
3. Create or select an API key
4. Enable: Places API, Maps JavaScript API
5. Restrict the key to your domain for security
6. Add to .env.local: REACT_APP_GOOGLE_MAPS_API_KEY=your-key-here

Note: This is optional. Address autocomplete will use basic text input without it.`
  },
  {
    key: 'REACT_APP_SENTRY_DSN',
    required: false,
    description: 'Sentry DSN (optional - for error tracking)',
    validator: (value) => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && url.hostname.includes('sentry');
      } catch {
        return false;
      }
    },
    errorMessage: 'Invalid Sentry DSN format',
    setupInstructions: `
1. Go to sentry.io and create an account/project
2. Copy the DSN from project settings
3. Add to .env.local: REACT_APP_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

Note: This is optional. Error tracking will be disabled without it.`
  },
  {
    key: 'REACT_APP_VERSION',
    required: false,
    description: 'Application version',
    validator: (value) => /^\d+\.\d+\.\d+/.test(value),
    errorMessage: 'Invalid version format. Expected: x.y.z (e.g., 1.0.0)',
  }
];

// Validation result types
export interface ValidationError {
  key: string;
  description: string;
  value: string | undefined;
  errorMessage: string;
  setupInstructions?: string;
}

export interface ValidationResult {
  valid: boolean;
  config: Partial<EnvironmentConfig>;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Validates all environment variables
 */
export function validateEnvironment(): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const config: Partial<EnvironmentConfig> = {};

  for (const envConfig of ENV_VAR_CONFIGS) {
    const value = process.env[envConfig.key];

    // Check if required variable is missing
    if (envConfig.required && !value) {
      errors.push({
        key: envConfig.key,
        description: envConfig.description,
        value: undefined,
        errorMessage: `Required environment variable ${envConfig.key} is missing`,
        setupInstructions: envConfig.setupInstructions
      });
      continue;
    }

    // Skip validation for optional missing variables
    if (!value) {
      continue;
    }

    // Validate the value if validator is provided
    if (envConfig.validator && !envConfig.validator(value)) {
      const error: ValidationError = {
        key: envConfig.key,
        description: envConfig.description,
        value: value.substring(0, 20) + '...', // Show only first 20 chars for security
        errorMessage: envConfig.errorMessage || `Invalid value for ${envConfig.key}`,
        setupInstructions: envConfig.setupInstructions
      };

      if (envConfig.required) {
        errors.push(error);
      } else {
        warnings.push(error);
      }
      continue;
    }

    // Add to config (map to camelCase keys)
    const configKey = envConfig.key
      .replace('REACT_APP_', '')
      .split('_')
      .map((part, index) =>
        index === 0
          ? part.toLowerCase()
          : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      )
      .join('') as keyof EnvironmentConfig;

    (config as any)[configKey] = value;
  }

  return {
    valid: errors.length === 0,
    config,
    errors,
    warnings
  };
}

/**
 * Gets a formatted error message for display
 */
export function getValidationErrorMessage(result: ValidationResult): string {
  if (result.valid) {
    return '';
  }

  const lines: string[] = [
    '❌ Environment Configuration Error',
    '',
    'Missing or invalid environment variables detected.',
    'Please create or update your .env.local file with the following variables:',
    ''
  ];

  for (const error of result.errors) {
    lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`Variable: ${error.key}`);
    lines.push(`Description: ${error.description}`);
    lines.push(`Error: ${error.errorMessage}`);

    if (error.setupInstructions) {
      lines.push('');
      lines.push('Setup Instructions:');
      lines.push(error.setupInstructions.trim());
    }
    lines.push('');
  }

  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('⚠️  Warnings (optional features may not work):');
    lines.push('');

    for (const warning of result.warnings) {
      lines.push(`- ${warning.key}: ${warning.errorMessage}`);
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('Quick Start:');
  lines.push('1. Copy .env.local.example to .env.local');
  lines.push('2. Fill in your Supabase credentials');
  lines.push('3. Restart your development server (npm start)');
  lines.push('');
  lines.push('For detailed setup instructions, see: SETUP.md');

  return lines.join('\n');
}

/**
 * Throws an error if environment validation fails
 * This should be called at application startup
 */
export function assertValidEnvironment(): EnvironmentConfig {
  const result = validateEnvironment();

  if (!result.valid) {
    const message = getValidationErrorMessage(result);
    console.error(message);
    throw new Error('Environment validation failed. Check console for details.');
  }

  // Log warnings if present
  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment Configuration Warnings:');
    for (const warning of result.warnings) {
      console.warn(`  - ${warning.key}: ${warning.errorMessage}`);
    }
  }

  // Log success
  console.log('✅ Environment configuration validated successfully');

  return result.config as EnvironmentConfig;
}

/**
 * Gets environment configuration (validates if not already done)
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getEnvironmentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = assertValidEnvironment();
  }
  return cachedConfig;
}

/**
 * Checks if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if running in test mode
 */
export function isTest(): boolean {
  return process.env.NODE_ENV === 'test';
}

/**
 * Gets the application version
 */
export function getAppVersion(): string {
  return process.env.REACT_APP_VERSION || '0.0.0';
}

/**
 * Development helper: Prints all environment variables (redacted)
 */
export function printEnvironmentInfo(): void {
  if (!isDevelopment()) {
    return;
  }

  console.group('🔧 Environment Configuration');
  console.log('Mode:', process.env.NODE_ENV);
  console.log('Version:', getAppVersion());
  console.log('');
  console.log('Configured Variables:');

  for (const envConfig of ENV_VAR_CONFIGS) {
    const value = process.env[envConfig.key];
    if (value) {
      // Redact sensitive values
      const displayValue = envConfig.key.includes('KEY') || envConfig.key.includes('DSN')
        ? value.substring(0, 10) + '...' + value.substring(value.length - 4)
        : value;
      console.log(`  ✓ ${envConfig.key}: ${displayValue}`);
    } else {
      console.log(`  ${envConfig.required ? '✗' : '○'} ${envConfig.key}: (not set)`);
    }
  }
  console.groupEnd();
}

const envValidation = {
  validateEnvironment,
  assertValidEnvironment,
  getEnvironmentConfig,
  getValidationErrorMessage,
  isDevelopment,
  isProduction,
  isTest,
  getAppVersion,
  printEnvironmentInfo
};

export default envValidation;
