/**
 * Standardized API Response Types
 *
 * This module provides type-safe API response structures with HTTP status codes
 * and standardized error handling for consistent error management across the application.
 *
 * Features:
 * - HTTP status code support for better error categorization
 * - Standardized error shapes with codes and details
 * - Type-safe success and error responses
 * - Support for pagination metadata
 * - Validation error details
 */

/**
 * HTTP Status Codes
 * Common status codes used throughout the application
 */
export enum HttpStatusCode {
  // Success 2xx
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // Client Errors 4xx
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // Server Errors 5xx
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Standard Error Codes
 * Application-specific error codes for better error handling
 */
export enum ApiErrorCode {
  // Authentication & Authorization
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',

  // Validation Errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Resource Errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',

  // Business Logic Errors
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  DEPENDENCY_ERROR = 'DEPENDENCY_ERROR',

  // Database Errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_ERROR = 'QUERY_ERROR',
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  // Network & System Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Validation Error Detail
 * Provides field-specific validation error information
 */
export interface ValidationErrorDetail {
  field: string;
  message: string;
  code?: string;
  value?: any;
}

/**
 * API Error Structure
 * Standardized error format for all API responses
 */
export interface ApiError {
  /** Error code for programmatic handling */
  code: ApiErrorCode;

  /** Human-readable error message */
  message: string;

  /** HTTP status code */
  statusCode: HttpStatusCode;

  /** Additional error details */
  details?: Record<string, any>;

  /** Field-specific validation errors */
  validationErrors?: ValidationErrorDetail[];

  /** Original error for debugging (not sent to client in production) */
  originalError?: any;

  /** Timestamp of the error */
  timestamp?: string;

  /** Request ID for tracking */
  requestId?: string;
}

/**
 * Pagination Metadata
 * Information about paginated results
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of items across all pages */
  totalItems: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Success API Response
 * Generic type for successful API responses
 */
export interface ApiSuccessResponse<T> {
  /** Indicates success */
  success: true;

  /** Response data */
  data: T;

  /** HTTP status code */
  statusCode: HttpStatusCode;

  /** Optional success message */
  message?: string;

  /** Pagination metadata (for list responses) */
  meta?: PaginationMeta;

  /** Timestamp of the response */
  timestamp?: string;
}

/**
 * Error API Response
 * Generic type for error API responses
 */
export interface ApiErrorResponse {
  /** Indicates failure */
  success: false;

  /** Error information */
  error: ApiError;

  /** HTTP status code */
  statusCode: HttpStatusCode;

  /** Timestamp of the response */
  timestamp?: string;
}

/**
 * Combined API Response Type
 * Union type that can be either success or error
 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Legacy API Response (for backward compatibility)
 * Simple response format used by existing services
 */
export interface LegacyApiResponse<T> {
  data?: T | null;
  error?: string | null;
  message?: string;
}

/**
 * Type guard to check if response is successful
 */
export function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is ApiSuccessResponse<T> {
  return response.success === true;
}

/**
 * Type guard to check if response is an error
 */
export function isErrorResponse<T>(
  response: ApiResponse<T>
): response is ApiErrorResponse {
  return response.success === false;
}

/**
 * Helper to create a success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    message?: string;
    statusCode?: HttpStatusCode;
    meta?: PaginationMeta;
  }
): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    statusCode: options?.statusCode || HttpStatusCode.OK,
    message: options?.message,
    meta: options?.meta,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to create an error response
 */
export function createErrorResponse(
  code: ApiErrorCode,
  message: string,
  options?: {
    statusCode?: HttpStatusCode;
    details?: Record<string, any>;
    validationErrors?: ValidationErrorDetail[];
    originalError?: any;
    requestId?: string;
  }
): ApiErrorResponse {
  return {
    success: false,
    statusCode: options?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
    error: {
      code,
      message,
      statusCode: options?.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
      details: options?.details,
      validationErrors: options?.validationErrors,
      originalError: options?.originalError,
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Convert legacy response to new format
 */
export function convertLegacyResponse<T>(
  legacyResponse: LegacyApiResponse<T>
): ApiResponse<T> {
  if (legacyResponse.error) {
    return createErrorResponse(
      ApiErrorCode.UNKNOWN_ERROR,
      legacyResponse.error,
      {
        statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
      }
    );
  }

  return createSuccessResponse(
    legacyResponse.data as T,
    {
      message: legacyResponse.message,
    }
  );
}

/**
 * Map HTTP status code to appropriate error code
 */
export function mapStatusCodeToErrorCode(statusCode: number): ApiErrorCode {
  switch (statusCode) {
    case HttpStatusCode.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHENTICATED;
    case HttpStatusCode.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatusCode.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatusCode.CONFLICT:
      return ApiErrorCode.CONFLICT;
    case HttpStatusCode.UNPROCESSABLE_ENTITY:
      return ApiErrorCode.VALIDATION_ERROR;
    case HttpStatusCode.TOO_MANY_REQUESTS:
      return ApiErrorCode.RATE_LIMIT_EXCEEDED;
    case HttpStatusCode.BAD_GATEWAY:
    case HttpStatusCode.SERVICE_UNAVAILABLE:
    case HttpStatusCode.GATEWAY_TIMEOUT:
      return ApiErrorCode.SERVICE_UNAVAILABLE;
    case HttpStatusCode.BAD_REQUEST:
      return ApiErrorCode.INVALID_INPUT;
    default:
      return ApiErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * Extract error message from various error types
 */
export function extractErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.error) {
    return extractErrorMessage(error.error);
  }

  return 'An unexpected error occurred';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.toLowerCase().includes('network') ||
    error?.message?.toLowerCase().includes('fetch') ||
    error instanceof TypeError
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  const authCodes = [
    ApiErrorCode.UNAUTHENTICATED,
    ApiErrorCode.UNAUTHORIZED,
    ApiErrorCode.TOKEN_EXPIRED,
    ApiErrorCode.INVALID_CREDENTIALS,
  ];

  return (
    authCodes.includes(error?.code) ||
    error?.statusCode === HttpStatusCode.UNAUTHORIZED ||
    error?.statusCode === HttpStatusCode.FORBIDDEN
  );
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return (
    error?.code === ApiErrorCode.VALIDATION_ERROR ||
    error?.statusCode === HttpStatusCode.UNPROCESSABLE_ENTITY ||
    Array.isArray(error?.validationErrors)
  );
}
