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
 * Helper function to show a toast based on an API response
 * @param response - API response with error and data properties
 * @param successMessage - Message to show on success
 * @param errorPrefix - Prefix for error message (will append response.error)
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
  messages: TOAST_MESSAGES,
};
