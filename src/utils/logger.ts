/**
 * Logging Utility
 *
 * A structured logging system that:
 * - Provides different log levels (debug, info, warn, error)
 * - Automatically disables debug/info logs in production
 * - Supports structured logging with context
 * - Groups related logs together
 * - Integrates with error tracking services
 * - Formats output consistently
 */

import { isDevelopment, isProduction, getAppVersion } from './envValidation';

// Log levels in order of severity
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

// Configuration interface
interface LoggerConfig {
  minLevel: LogLevel;
  enableTimestamps: boolean;
  enableColors: boolean;
  enableStackTrace: boolean;
  context?: string; // Global context prefix
}

// Default configuration based on environment
const defaultConfig: LoggerConfig = {
  minLevel: isProduction() ? LogLevel.WARN : LogLevel.DEBUG,
  enableTimestamps: isDevelopment(),
  enableColors: isDevelopment(),
  enableStackTrace: isDevelopment(),
  context: undefined
};

// Current configuration
let config: LoggerConfig = { ...defaultConfig };

/**
 * Configure the logger
 */
export function configureLogger(options: Partial<LoggerConfig>): void {
  config = { ...config, ...options };
}

/**
 * Reset logger to default configuration
 */
export function resetLogger(): void {
  config = { ...defaultConfig };
}

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Console styling for browser
const styles = {
  debug: 'color: #6b7280; font-weight: normal;',
  info: 'color: #3b82f6; font-weight: normal;',
  warn: 'color: #f59e0b; font-weight: bold;',
  error: 'color: #ef4444; font-weight: bold;',
  context: 'color: #8b5cf6; font-weight: bold;',
  timestamp: 'color: #9ca3af; font-weight: normal;'
};

/**
 * Format timestamp
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toISOString();
}

/**
 * Get log level name
 */
function getLevelName(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG: return 'DEBUG';
    case LogLevel.INFO: return 'INFO';
    case LogLevel.WARN: return 'WARN';
    case LogLevel.ERROR: return 'ERROR';
    default: return 'UNKNOWN';
  }
}

/**
 * Get color for log level (terminal)
 */
function getLevelColor(level: LogLevel): string {
  if (!config.enableColors) return '';

  switch (level) {
    case LogLevel.DEBUG: return colors.gray;
    case LogLevel.INFO: return colors.blue;
    case LogLevel.WARN: return colors.yellow;
    case LogLevel.ERROR: return colors.red;
    default: return colors.white;
  }
}

/**
 * Get style for log level (browser)
 */
function getLevelStyle(level: LogLevel): string {
  switch (level) {
    case LogLevel.DEBUG: return styles.debug;
    case LogLevel.INFO: return styles.info;
    case LogLevel.WARN: return styles.warn;
    case LogLevel.ERROR: return styles.error;
    default: return '';
  }
}

/**
 * Format a log message
 */
function formatMessage(
  level: LogLevel,
  message: string,
  context?: string,
  data?: any
): { formatted: string; args: any[] } {
  const parts: string[] = [];
  const args: any[] = [];

  // Timestamp
  if (config.enableTimestamps) {
    parts.push(`[${getTimestamp()}]`);
  }

  // Level
  const levelName = getLevelName(level).padEnd(5);
  parts.push(`[${levelName}]`);

  // Context
  const fullContext = [config.context, context].filter(Boolean).join(':');
  if (fullContext) {
    parts.push(`[${fullContext}]`);
  }

  // Message
  parts.push(message);

  const formatted = parts.join(' ');

  // Add data if present
  if (data !== undefined) {
    args.push(data);
  }

  return { formatted, args };
}

/**
 * Core logging function
 */
function log(
  level: LogLevel,
  message: string,
  context?: string,
  data?: any
): void {
  // Check if this level should be logged
  if (level < config.minLevel) {
    return;
  }

  const { formatted, args } = formatMessage(level, message, context, data);

  // Use appropriate console method
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatted, ...args);
      break;
    case LogLevel.INFO:
      console.info(formatted, ...args);
      break;
    case LogLevel.WARN:
      console.warn(formatted, ...args);
      break;
    case LogLevel.ERROR:
      console.error(formatted, ...args);
      if (config.enableStackTrace && data instanceof Error) {
        console.error(data.stack);
      }
      break;
  }
}

/**
 * Logger class with context
 */
export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  /**
   * Log debug message (development only)
   */
  debug(message: string, data?: any): void {
    log(LogLevel.DEBUG, message, this.context, data);
  }

  /**
   * Log info message
   */
  info(message: string, data?: any): void {
    log(LogLevel.INFO, message, this.context, data);
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: any): void {
    log(LogLevel.WARN, message, this.context, data);
  }

  /**
   * Log error message
   */
  error(message: string, error?: any): void {
    log(LogLevel.ERROR, message, this.context, error);

    // Send to error tracking service if configured
    if (isProduction() && error) {
      // TODO: Integrate with Sentry or other error tracking
      // sendToErrorTracking(error, { context: this.context, message });
    }
  }

  /**
   * Create a grouped section of logs
   */
  group(label: string): void {
    if (isDevelopment()) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  /**
   * End a grouped section
   */
  groupEnd(): void {
    if (isDevelopment()) {
      console.groupEnd();
    }
  }

  /**
   * Create a child logger with nested context
   */
  child(childContext: string): Logger {
    return new Logger(`${this.context}:${childContext}`);
  }

  /**
   * Log a table (development only)
   */
  table(data: any): void {
    if (isDevelopment()) {
      console.log(`[${this.context}] Data table:`);
      console.table(data);
    }
  }

  /**
   * Time a function execution
   */
  time(label: string): void {
    if (isDevelopment()) {
      console.time(`[${this.context}] ${label}`);
    }
  }

  /**
   * End timing
   */
  timeEnd(label: string): void {
    if (isDevelopment()) {
      console.timeEnd(`[${this.context}] ${label}`);
    }
  }
}

/**
 * Create a logger instance for a specific context
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = createLogger('App');

/**
 * Common logger instances for different parts of the app
 */
export const loggers = {
  app: createLogger('App'),
  auth: createLogger('Auth'),
  api: createLogger('API'),
  ui: createLogger('UI'),
  search: createLogger('Search'),
  storage: createLogger('Storage'),
  performance: createLogger('Performance'),
  worker: createLogger('Worker'),
  navigation: createLogger('Navigation')
};

/**
 * Log application startup info
 */
export function logStartup(): void {
  if (isDevelopment()) {
    logger.group('Application Starting');
    logger.info('Environment', {
      mode: process.env.NODE_ENV,
      version: getAppVersion(),
      production: isProduction(),
      development: isDevelopment()
    });
    logger.groupEnd();
  }
}

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  details?: Record<string, any>
): void {
  const perfLogger = loggers.performance;

  if (duration > 1000) {
    perfLogger.warn(`Slow operation: ${operation} took ${duration.toFixed(2)}ms`, details);
  } else if (isDevelopment()) {
    perfLogger.debug(`${operation} completed in ${duration.toFixed(2)}ms`, details);
  }
}

/**
 * Log API calls
 */
export function logApiCall(
  method: string,
  endpoint: string,
  duration?: number,
  error?: any
): void {
  const apiLogger = loggers.api;

  if (error) {
    apiLogger.error(`${method} ${endpoint} failed`, error);
  } else if (isDevelopment() && duration !== undefined) {
    apiLogger.debug(`${method} ${endpoint} - ${duration.toFixed(2)}ms`);
  }
}

/**
 * Log authentication events
 */
export function logAuthEvent(
  event: string,
  details?: Record<string, any>
): void {
  const authLogger = loggers.auth;

  switch (event) {
    case 'login':
      authLogger.info('User logged in', details);
      break;
    case 'logout':
      authLogger.info('User logged out');
      break;
    case 'session-refresh':
      authLogger.debug('Session refreshed');
      break;
    case 'session-expired':
      authLogger.warn('Session expired');
      break;
    case 'auth-error':
      authLogger.error('Authentication error', details);
      break;
    default:
      authLogger.debug(event, details);
  }
}

/**
 * Log navigation events
 */
export function logNavigation(from: string, to: string): void {
  if (isDevelopment()) {
    loggers.navigation.debug(`Navigating from ${from} to ${to}`);
  }
}

/**
 * Log search operations
 */
export function logSearch(
  query: string,
  results: number,
  duration: number
): void {
  const searchLogger = loggers.search;

  if (duration > 500) {
    searchLogger.warn(
      `Slow search: "${query}" returned ${results} results in ${duration.toFixed(2)}ms`
    );
  } else if (isDevelopment()) {
    searchLogger.debug(
      `Search: "${query}" returned ${results} results in ${duration.toFixed(2)}ms`
    );
  }
}

/**
 * Suppress console methods in production
 * This removes console.log/debug calls from production builds
 */
export function suppressConsoleLogs(): void {
  if (isProduction()) {
    // Override console methods to no-op in production
    console.debug = () => {};
    console.log = () => {};

    // Keep warn and error but make them quieter
    const originalWarn = console.warn;
    const originalError = console.error;

    console.warn = function(...args: any[]) {
      // Only log if it's not a React warning
      if (!args[0]?.toString().includes('Warning: ')) {
        originalWarn.apply(console, args);
      }
    };

    console.error = function(...args: any[]) {
      originalError.apply(console, args);
    };
  }
}

// Automatically suppress logs in production
if (isProduction()) {
  suppressConsoleLogs();
}

export default logger;
