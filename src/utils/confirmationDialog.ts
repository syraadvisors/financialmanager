/**
 * Confirmation Dialog Utilities
 *
 * Helper functions and types for using the ConfirmationDialog component.
 *
 * Usage Example:
 *
 * ```typescript
 * import { useState } from 'react';
 * import ConfirmationDialog from '../components/ConfirmationDialog';
 * import { ConfirmationState, createConfirmationState } from '../utils/confirmationDialog';
 *
 * const MyComponent = () => {
 *   const [confirmation, setConfirmation] = useState<ConfirmationState>(
 *     createConfirmationState()
 *   );
 *
 *   const handleDelete = () => {
 *     setConfirmation({
 *       isOpen: true,
 *       title: 'Delete Item',
 *       message: 'Are you sure you want to delete this item?',
 *       onConfirm: async () => {
 *         await deleteItem();
 *         setConfirmation(createConfirmationState());
 *       },
 *       variant: 'danger',
 *     });
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleDelete}>Delete</button>
 *       <ConfirmationDialog
 *         {...confirmation}
 *         onClose={() => setConfirmation(createConfirmationState())}
 *       />
 *     </>
 *   );
 * };
 * ```
 */

import { ConfirmationDialogVariant } from '../components/ConfirmationDialog';

export interface ConfirmationState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmationDialogVariant;
  onConfirm: () => void | Promise<void>;
}

/**
 * Creates an initial confirmation state (closed)
 */
export const createConfirmationState = (): ConfirmationState => ({
  isOpen: false,
  title: '',
  message: '',
  onConfirm: () => {},
});

/**
 * Common confirmation dialog configurations
 */
export const CONFIRMATION_PRESETS = {
  DELETE: {
    title: 'Confirm Deletion',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    variant: 'danger' as ConfirmationDialogVariant,
  },
  UNSAVED_CHANGES: {
    title: 'Unsaved Changes',
    message: 'You have unsaved changes. Are you sure you want to leave?',
    confirmText: 'Leave',
    cancelText: 'Stay',
    variant: 'warning' as ConfirmationDialogVariant,
  },
  ROLE_CHANGE: {
    title: 'Confirm Role Change',
    confirmText: 'Change Role',
    cancelText: 'Cancel',
    variant: 'warning' as ConfirmationDialogVariant,
  },
  USER_SUSPEND: {
    title: 'Confirm User Suspension',
    confirmText: 'Suspend User',
    cancelText: 'Cancel',
    variant: 'danger' as ConfirmationDialogVariant,
  },
  USER_ACTIVATE: {
    title: 'Confirm User Activation',
    confirmText: 'Activate User',
    cancelText: 'Cancel',
    variant: 'success' as ConfirmationDialogVariant,
  },
  ARCHIVE: {
    title: 'Confirm Archive',
    confirmText: 'Archive',
    cancelText: 'Cancel',
    variant: 'warning' as ConfirmationDialogVariant,
  },
  RESTORE: {
    title: 'Confirm Restore',
    confirmText: 'Restore',
    cancelText: 'Cancel',
    variant: 'info' as ConfirmationDialogVariant,
  },
};

/**
 * Helper to create a delete confirmation
 */
export const createDeleteConfirmation = (
  itemName: string,
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.DELETE,
  message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
  onConfirm,
});

/**
 * Helper to create a role change confirmation
 */
export const createRoleChangeConfirmation = (
  userName: string,
  currentRole: string,
  newRole: string,
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.ROLE_CHANGE,
  message: `Are you sure you want to change ${userName}'s role from "${currentRole}" to "${newRole}"? This will affect their access permissions.`,
  onConfirm,
});

/**
 * Helper to create a user suspension confirmation
 */
export const createSuspendUserConfirmation = (
  userName: string,
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.USER_SUSPEND,
  message: `Are you sure you want to suspend ${userName}? They will lose access to the system until reactivated.`,
  onConfirm,
});

/**
 * Helper to create a user activation confirmation
 */
export const createActivateUserConfirmation = (
  userName: string,
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.USER_ACTIVATE,
  message: `Are you sure you want to activate ${userName}? They will regain access to the system.`,
  onConfirm,
});

/**
 * Helper to create an unsaved changes confirmation
 */
export const createUnsavedChangesConfirmation = (
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.UNSAVED_CHANGES,
  onConfirm,
});

/**
 * Helper to create an archive confirmation
 */
export const createArchiveConfirmation = (
  itemName: string,
  onConfirm: () => void | Promise<void>
): ConfirmationState => ({
  isOpen: true,
  ...CONFIRMATION_PRESETS.ARCHIVE,
  message: `Are you sure you want to archive "${itemName}"? You can restore it later if needed.`,
  onConfirm,
});

/**
 * Helper to create a custom confirmation
 */
export const createCustomConfirmation = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  variant: ConfirmationDialogVariant = 'warning',
  confirmText: string = 'Confirm',
  cancelText: string = 'Cancel'
): ConfirmationState => ({
  isOpen: true,
  title,
  message,
  confirmText,
  cancelText,
  variant,
  onConfirm,
});

export default {
  create: createConfirmationState,
  presets: CONFIRMATION_PRESETS,
  delete: createDeleteConfirmation,
  roleChange: createRoleChangeConfirmation,
  suspendUser: createSuspendUserConfirmation,
  activateUser: createActivateUserConfirmation,
  unsavedChanges: createUnsavedChangesConfirmation,
  archive: createArchiveConfirmation,
  custom: createCustomConfirmation,
};
