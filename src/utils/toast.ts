/**
 * Toast Notification Utilities
 *
 * Provides consistent toast notifications across the application using react-hot-toast.
 *
 * Usage Examples:
 *
 * 1. Simple success message:
 *    import { showSuccess } from '../utils/toast';
 *    showSuccess('User created successfully!');
 *
 * 2. Error message:
 *    import { showError } from '../utils/toast';
 *    showError('Failed to save data');
 *
 * 3. Loading operation:
 *    import { showLoadingToast } from '../utils/toast';
 *    const toastId = showLoadingToast('Saving...');
 *    // ... perform operation
 *    showSuccess('Saved!', toastId); // Updates the loading toast
 *
 * 4. Promise-based operation:
 *    import { showPromiseToast } from '../utils/toast';
 *    showPromiseToast(
 *      saveData(),
 *      'Saving data...',
 *      'Data saved successfully!',
 *      'Failed to save data'
 *    );
 */

import toast from 'react-hot-toast';
import {
  ApiResponse,
  ApiErrorResponse,
  isSuccessResponse,
  isErrorResponse,
  ApiErrorCode,
  HttpStatusCode,
} from '../types/api';

/**
 * Show a success toast notification
 * @param message - The success message to display
 * @param id - Optional toast ID to update an existing toast
 */
export const showSuccess = (message: string, id?: string) => {
  if (id) {
    toast.success(message, { id });
  } else {
    toast.success(message);
  }
};

/**
 * Show an error toast notification
 * @param message - The error message to display
 * @param id - Optional toast ID to update an existing toast
 */
export const showError = (message: string, id?: string) => {
  if (id) {
    toast.error(message, { id });
  } else {
    toast.error(message);
  }
};

/**
 * Show a loading toast notification
 * @param message - The loading message to display
 * @returns The toast ID that can be used to update the toast later
 */
export const showLoadingToast = (message: string): string => {
  return toast.loading(message);
};

/**
 * Show an info toast notification
 * @param message - The info message to display
 * @param id - Optional toast ID to update an existing toast
 */
export const showInfo = (message: string, id?: string) => {
  if (id) {
    toast(message, { id, icon: 'ℹ️' });
  } else {
    toast(message, { icon: 'ℹ️' });
  }
};

/**
 * Show a warning toast notification
 * @param message - The warning message to display
 * @param id - Optional toast ID to update an existing toast
 */
export const showWarning = (message: string, id?: string) => {
  if (id) {
    toast(message, {
      id,
      icon: '⚠️',
      style: {
        background: '#fff3cd',
        color: '#856404',
      }
    });
  } else {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#fff3cd',
        color: '#856404',
      }
    });
  }
};

/**
 * Dismiss a specific toast or all toasts
 * @param id - Optional toast ID to dismiss. If not provided, dismisses all toasts.
 */
export const dismissToast = (id?: string) => {
  if (id) {
    toast.dismiss(id);
  } else {
    toast.dismiss();
  }
};

/**
 * Show a toast for a promise-based operation
 * @param promise - The promise to track
 * @param loadingMessage - Message to show while loading
 * @param successMessage - Message to show on success
 * @param errorMessage - Message to show on error
 */
export const showPromiseToast = <T,>(
  promise: Promise<T>,
  loadingMessage: string,
  successMessage: string,
  errorMessage: string
): Promise<T> => {
  return toast.promise(promise, {
    loading: loadingMessage,
    success: successMessage,
    error: errorMessage,
  });
};

/**
 * Show a custom toast with custom options
 * @param message - The message to display
 * @param options - Custom toast options
 */
export const showCustomToast = (
  message: string,
  options?: Parameters<typeof toast>[1]
) => {
  toast(message, options);
};

/**
 * Common toast messages for reuse
 */
export const TOAST_MESSAGES = {
  // Success messages
  SAVE_SUCCESS: 'Changes saved successfully!',
  DELETE_SUCCESS: 'Item deleted successfully!',
  CREATE_SUCCESS: 'Item created successfully!',
  UPDATE_SUCCESS: 'Item updated successfully!',
  UPLOAD_SUCCESS: 'File uploaded successfully!',

  // Error messages
  SAVE_ERROR: 'Failed to save changes',
  DELETE_ERROR: 'Failed to delete item',
  CREATE_ERROR: 'Failed to create item',
  UPDATE_ERROR: 'Failed to update item',
  UPLOAD_ERROR: 'Failed to upload file',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  PERMISSION_ERROR: 'You don\'t have permission to perform this action',

  // Loading messages
  SAVING: 'Saving...',
  DELETING: 'Deleting...',
  LOADING: 'Loading...',
  UPLOADING: 'Uploading...',
  PROCESSING: 'Processing...',
};

/**
 * Helper function to show a toast based on an API response (Legacy format)
 * @param response - API response with error and data properties
 * @param successMessage - Message to show on success
 * @param errorPrefix - Prefix for error message (will append response.error)
 * @deprecated Use showApiResponseToastV2 for new API response format
 */
export const showApiResponseToast = (
  response: { error?: string; data?: any },
  successMessage: string,
  errorPrefix: string = 'Error'
) => {
  if (response.error) {
    showError(`${errorPrefix}: ${response.error}`);
  } else {
    showSuccess(successMessage);
  }
};

/**
 * Helper function to show a toast based on new standardized API response
 * @param response - New standardized API response with success flag
 * @param successMessage - Message to show on success (overrides response message)
 * @param errorPrefix - Prefix for error message
 */
export const showApiResponseToastV2 = <T>(
  response: ApiResponse<T>,
  successMessage?: string,
  errorPrefix?: string
) => {
  if (isSuccessResponse(response)) {
    showSuccess(successMessage || response.message || TOAST_MESSAGES.SAVE_SUCCESS);
  } else if (isErrorResponse(response)) {
    const message = errorPrefix
      ? `${errorPrefix}: ${response.error.message}`
      : response.error.message;
    showError(message);
  }
};

/**
 * Show detailed error toast with error code and status
 * Useful for debugging or detailed error reporting
 * @param error - API error response
 * @param showDetails - Whether to show error code and status code
 */
export const showDetailedErrorToast = (
  error: ApiErrorResponse,
  showDetails: boolean = process.env.NODE_ENV === 'development'
) => {
  let message = error.error.message;

  if (showDetails) {
    message += `\n[${error.error.code}]`;
    if (error.error.details) {
      message += `\n${JSON.stringify(error.error.details, null, 2)}`;
    }
  }

  showError(message);
};

/**
 * Show validation error toast with field-specific errors
 * @param error - API error response with validation errors
 */
export const showValidationErrorToast = (error: ApiErrorResponse) => {
  if (error.error.validationErrors && error.error.validationErrors.length > 0) {
    const fieldErrors = error.error.validationErrors
      .map(ve => `${ve.field}: ${ve.message}`)
      .join('\n');

    showError(`Validation failed:\n${fieldErrors}`);
  } else {
    showError(error.error.message);
  }
};

/**
 * Get user-friendly message based on error code
 */
export const getErrorMessageForCode = (code: ApiErrorCode): string => {
  const errorMessages: Record<ApiErrorCode, string> = {
    [ApiErrorCode.UNAUTHENTICATED]: 'Please log in to continue',
    [ApiErrorCode.UNAUTHORIZED]: 'You are not authorized to perform this action',
    [ApiErrorCode.FORBIDDEN]: 'Access denied',
    [ApiErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please log in again',
    [ApiErrorCode.INVALID_CREDENTIALS]: 'Invalid username or password',
    [ApiErrorCode.VALIDATION_ERROR]: 'Please check your input and try again',
    [ApiErrorCode.INVALID_INPUT]: 'Invalid input provided',
    [ApiErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',
    [ApiErrorCode.INVALID_FORMAT]: 'Invalid format',
    [ApiErrorCode.NOT_FOUND]: 'The requested resource was not found',
    [ApiErrorCode.ALREADY_EXISTS]: 'This resource already exists',
    [ApiErrorCode.CONFLICT]: 'A conflict occurred',
    [ApiErrorCode.RESOURCE_LOCKED]: 'This resource is currently locked',
    [ApiErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action',
    [ApiErrorCode.QUOTA_EXCEEDED]: 'You have exceeded your quota',
    [ApiErrorCode.OPERATION_NOT_ALLOWED]: 'This operation is not allowed',
    [ApiErrorCode.DEPENDENCY_ERROR]: 'Cannot complete operation due to dependencies',
    [ApiErrorCode.DATABASE_ERROR]: 'A database error occurred',
    [ApiErrorCode.QUERY_ERROR]: 'Query failed',
    [ApiErrorCode.CONSTRAINT_VIOLATION]: 'Operation violates a constraint',
    [ApiErrorCode.NETWORK_ERROR]: 'Network error. Please check your connection',
    [ApiErrorCode.TIMEOUT]: 'The request timed out',
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 'Service is currently unavailable',
    [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
    [ApiErrorCode.UNKNOWN_ERROR]: 'An unexpected error occurred',
  };

  return errorMessages[code] || 'An error occurred';
};

/**
 * Smart error toast that chooses the best display method based on error type
 * @param error - API error response
 */
export const showSmartErrorToast = (error: ApiErrorResponse) => {
  // Show validation errors with field details
  if (
    error.error.code === ApiErrorCode.VALIDATION_ERROR &&
    error.error.validationErrors &&
    error.error.validationErrors.length > 0
  ) {
    showValidationErrorToast(error);
    return;
  }

  // Use user-friendly message for common errors
  const userFriendlyMessage = getErrorMessageForCode(error.error.code);

  // In development, show detailed error
  if (process.env.NODE_ENV === 'development') {
    showDetailedErrorToast(error, true);
  } else {
    showError(userFriendlyMessage);
  }
};

export default {
  success: showSuccess,
  error: showError,
  loading: showLoadingToast,
  info: showInfo,
  warning: showWarning,
  dismiss: dismissToast,
  promise: showPromiseToast,
  custom: showCustomToast,
  apiResponse: showApiResponseToast,
  apiResponseV2: showApiResponseToastV2,
  smartError: showSmartErrorToast,
  validationError: showValidationErrorToast,
  detailedError: showDetailedErrorToast,
  messages: TOAST_MESSAGES,
};
