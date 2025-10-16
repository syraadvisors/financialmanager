/**
 * API Error Handler Utilities
 *
 * Provides utilities for handling errors in API service calls with consistent
 * error transformation, logging, and response formatting.
 *
 * Usage Examples:
 *
 * 1. Wrap service calls:
 *    import { handleServiceError, wrapServiceCall } from '../utils/apiErrorHandler';
 *
 *    async function getUser(id: string) {
 *      return wrapServiceCall(async () => {
 *        const { data, error } = await supabase
 *          .from('users')
 *          .select('*')
 *          .eq('id', id)
 *          .single();
 *
 *        if (error) throw error;
 *        return data;
 *      }, 'User');
 *    }
 *
 * 2. Handle Supabase errors:
 *    import { handleSupabaseError } from '../utils/apiErrorHandler';
 *
 *    const { error } = await supabase.from('users').insert(data);
 *    if (error) {
 *      return handleSupabaseError(error, 'Failed to create user');
 *    }
 */

import { PostgrestError } from '@supabase/supabase-js';
import {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  HttpStatusCode,
  createSuccessResponse,
  createErrorResponse,
  extractErrorMessage,
  isNetworkError,
  ValidationErrorDetail,
} from '../types/api';

/**
 * Supabase Error Code Mapping
 * Maps Supabase/PostgreSQL error codes to our error codes
 */
const SUPABASE_ERROR_CODE_MAP: Record<string, ApiErrorCode> = {
  // PostgreSQL Error Codes
  '23505': ApiErrorCode.ALREADY_EXISTS, // unique_violation
  '23503': ApiErrorCode.DEPENDENCY_ERROR, // foreign_key_violation
  '23502': ApiErrorCode.MISSING_REQUIRED_FIELD, // not_null_violation
  '23514': ApiErrorCode.VALIDATION_ERROR, // check_violation
  '42501': ApiErrorCode.INSUFFICIENT_PERMISSIONS, // insufficient_privilege
  '42P01': ApiErrorCode.NOT_FOUND, // undefined_table
  '42703': ApiErrorCode.INVALID_INPUT, // undefined_column

  // Supabase API Error Codes
  PGRST116: ApiErrorCode.NOT_FOUND, // No rows found
  PGRST301: ApiErrorCode.VALIDATION_ERROR, // Invalid body
  PGRST204: ApiErrorCode.CONFLICT, // Multiple rows found
  '42P02': ApiErrorCode.NOT_FOUND, // undefined_parameter
};

/**
 * Get HTTP status code from Supabase error
 */
function getStatusCodeFromSupabaseError(error: PostgrestError): HttpStatusCode {
  // Check for specific error codes
  if (error.code === 'PGRST116') return HttpStatusCode.NOT_FOUND;
  if (error.code === '23505') return HttpStatusCode.CONFLICT;
  if (error.code === '42501') return HttpStatusCode.FORBIDDEN;
  if (error.code?.startsWith('23')) return HttpStatusCode.BAD_REQUEST;
  if (error.code?.startsWith('42')) return HttpStatusCode.BAD_REQUEST;

  // Default to 500 for unknown errors
  return HttpStatusCode.INTERNAL_SERVER_ERROR;
}

/**
 * Convert Supabase error to our ApiError format
 */
export function convertSupabaseError(
  error: PostgrestError,
  defaultMessage?: string
): ApiError {
  const errorCode = SUPABASE_ERROR_CODE_MAP[error.code] || ApiErrorCode.DATABASE_ERROR;
  const statusCode = getStatusCodeFromSupabaseError(error);

  return {
    code: errorCode,
    message: defaultMessage || error.message || 'Database operation failed',
    statusCode,
    details: {
      hint: error.hint,
      details: error.details,
      code: error.code,
    },
    originalError: process.env.NODE_ENV === 'development' ? error : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Handle Supabase error and return ApiErrorResponse
 */
export function handleSupabaseError<T = never>(
  error: PostgrestError,
  defaultMessage?: string
): ApiResponse<T> {
  const apiError = convertSupabaseError(error, defaultMessage);
  return createErrorResponse(apiError.code, apiError.message, {
    statusCode: apiError.statusCode,
    details: apiError.details,
    originalError: apiError.originalError,
  });
}

/**
 * Handle authentication errors
 */
export function handleAuthError<T = never>(message?: string): ApiResponse<T> {
  return createErrorResponse(
    ApiErrorCode.UNAUTHENTICATED,
    message || 'Not authenticated',
    {
      statusCode: HttpStatusCode.UNAUTHORIZED,
    }
  );
}

/**
 * Handle not found errors
 */
export function handleNotFoundError<T = never>(
  resourceType: string,
  resourceId?: string
): ApiResponse<T> {
  const message = resourceId
    ? `${resourceType} with ID '${resourceId}' not found`
    : `${resourceType} not found`;

  return createErrorResponse(ApiErrorCode.NOT_FOUND, message, {
    statusCode: HttpStatusCode.NOT_FOUND,
    details: { resourceType, resourceId },
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError<T = never>(
  message: string,
  validationErrors?: ValidationErrorDetail[]
): ApiResponse<T> {
  return createErrorResponse(ApiErrorCode.VALIDATION_ERROR, message, {
    statusCode: HttpStatusCode.UNPROCESSABLE_ENTITY,
    validationErrors,
  });
}

/**
 * Handle permission errors
 */
export function handlePermissionError<T = never>(
  action?: string
): ApiResponse<T> {
  const message = action
    ? `You don't have permission to ${action}`
    : 'Insufficient permissions';

  return createErrorResponse(ApiErrorCode.INSUFFICIENT_PERMISSIONS, message, {
    statusCode: HttpStatusCode.FORBIDDEN,
  });
}

/**
 * Handle network errors
 */
export function handleNetworkError<T = never>(
  originalError?: any
): ApiResponse<T> {
  return createErrorResponse(
    ApiErrorCode.NETWORK_ERROR,
    'Network error. Please check your connection.',
    {
      statusCode: HttpStatusCode.SERVICE_UNAVAILABLE,
      originalError: process.env.NODE_ENV === 'development' ? originalError : undefined,
    }
  );
}

/**
 * Handle rate limit errors
 */
export function handleRateLimitError<T = never>(
  retryAfter?: number
): ApiResponse<T> {
  return createErrorResponse(
    ApiErrorCode.RATE_LIMIT_EXCEEDED,
    'Too many requests. Please try again later.',
    {
      statusCode: HttpStatusCode.TOO_MANY_REQUESTS,
      details: { retryAfter },
    }
  );
}

/**
 * Handle unknown/generic errors
 */
export function handleUnknownError<T = never>(
  error: any,
  defaultMessage: string = 'An unexpected error occurred'
): ApiResponse<T> {
  const message = extractErrorMessage(error) || defaultMessage;

  return createErrorResponse(ApiErrorCode.UNKNOWN_ERROR, message, {
    statusCode: HttpStatusCode.INTERNAL_SERVER_ERROR,
    originalError: process.env.NODE_ENV === 'development' ? error : undefined,
  });
}

/**
 * Generic error handler that routes to specific handlers based on error type
 */
export function handleServiceError<T = never>(
  error: any,
  context?: {
    defaultMessage?: string;
    resourceType?: string;
    resourceId?: string;
  }
): ApiResponse<T> {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Service Error]', {
      error,
      context,
      stack: error?.stack,
    });
  }

  // Network errors
  if (isNetworkError(error)) {
    return handleNetworkError<T>(error);
  }

  // Supabase/PostgreSQL errors
  if (error?.code && error?.message && error?.details !== undefined) {
    return handleSupabaseError<T>(error as PostgrestError, context?.defaultMessage);
  }

  // Auth errors
  if (
    error?.message?.toLowerCase().includes('not authenticated') ||
    error?.status === 401
  ) {
    return handleAuthError<T>(context?.defaultMessage);
  }

  // Permission errors
  if (
    error?.message?.toLowerCase().includes('permission') ||
    error?.status === 403
  ) {
    return handlePermissionError<T>();
  }

  // Not found errors
  if (
    error?.message?.toLowerCase().includes('not found') ||
    error?.status === 404 ||
    error?.code === 'PGRST116'
  ) {
    return handleNotFoundError<T>(
      context?.resourceType || 'Resource',
      context?.resourceId
    );
  }

  // Rate limit errors
  if (error?.status === 429) {
    return handleRateLimitError<T>(error?.retryAfter);
  }

  // Default to unknown error
  return handleUnknownError<T>(error, context?.defaultMessage);
}

/**
 * Wrapper for service calls that automatically handles errors
 *
 * @param serviceCall - The async function to call
 * @param resourceType - The type of resource (for error messages)
 * @param resourceId - Optional resource ID (for error messages)
 * @returns ApiResponse with data or error
 *
 * @example
 * async function getUser(id: string) {
 *   return wrapServiceCall(
 *     async () => {
 *       const { data, error } = await supabase
 *         .from('users')
 *         .select('*')
 *         .eq('id', id)
 *         .single();
 *
 *       if (error) throw error;
 *       return data;
 *     },
 *     'User',
 *     id
 *   );
 * }
 */
export async function wrapServiceCall<T>(
  serviceCall: () => Promise<T>,
  resourceType?: string,
  resourceId?: string,
  options?: {
    successMessage?: string;
    successStatusCode?: HttpStatusCode;
  }
): Promise<ApiResponse<T>> {
  try {
    const data = await serviceCall();
    return createSuccessResponse(data, {
      message: options?.successMessage,
      statusCode: options?.successStatusCode || HttpStatusCode.OK,
    });
  } catch (error) {
    return handleServiceError<T>(error, {
      resourceType,
      resourceId,
    });
  }
}

/**
 * Check if user is authenticated and return error if not
 */
export function requireAuth(userId?: string | null): { userId: string } | ApiResponse<never> {
  if (!userId) {
    return handleAuthError();
  }
  return { userId };
}

/**
 * Validate required fields and return validation error if missing
 */
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): ValidationErrorDetail[] {
  const errors: ValidationErrorDetail[] = [];

  requiredFields.forEach((field) => {
    const value = data[field];
    if (value === undefined || value === null || value === '') {
      errors.push({
        field: String(field),
        message: `${String(field)} is required`,
        code: 'REQUIRED',
      });
    }
  });

  return errors;
}

/**
 * Create validation error response from validation errors
 */
export function createValidationErrorResponse<T = never>(
  validationErrors: ValidationErrorDetail[]
): ApiResponse<T> {
  return handleValidationError(
    'Validation failed. Please check your input.',
    validationErrors
  );
}

/**
 * Helper to safely execute a service operation with automatic error handling
 */
export async function safeServiceCall<T>(
  operation: () => Promise<{ data: T | null; error: any }>,
  context?: {
    resourceType?: string;
    resourceId?: string;
    successMessage?: string;
  }
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await operation();

    if (error) {
      return handleServiceError<T>(error, {
        resourceType: context?.resourceType,
        resourceId: context?.resourceId,
      });
    }

    if (data === null || data === undefined) {
      return handleNotFoundError<T>(
        context?.resourceType || 'Resource',
        context?.resourceId
      );
    }

    return createSuccessResponse(data, {
      message: context?.successMessage,
    });
  } catch (error) {
    return handleServiceError<T>(error, {
      resourceType: context?.resourceType,
      resourceId: context?.resourceId,
    });
  }
}

/**
 * Extract user ID from Supabase auth and validate
 */
export async function getUserId(
  supabaseAuth: any
): Promise<{ userId: string } | ApiResponse<never>> {
  try {
    const { data: { user }, error } = await supabaseAuth.getUser();

    if (error) {
      return handleAuthError('Failed to get user information');
    }

    if (!user) {
      return handleAuthError('Not authenticated');
    }

    return { userId: user.id };
  } catch (error) {
    return handleAuthError('Failed to verify authentication');
  }
}
