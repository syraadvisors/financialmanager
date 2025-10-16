/**
 * Impersonation Context
 *
 * Manages super admin impersonation state and provides utilities for
 * impersonating users across the application.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ImpersonationSession } from '../types/User';
import { superAdminService } from '../services/api/superAdmin.service';
import { useAuth } from './AuthContext';
import { showSuccess, showError, showWarning } from '../utils/toast';
import { isErrorResponse } from '../types/api';

interface ImpersonationContextType {
  impersonationSession: ImpersonationSession | null;
  isImpersonating: boolean;
  startImpersonation: (userId: string, reason?: string) => Promise<boolean>;
  endImpersonation: () => Promise<boolean>;
  refreshImpersonation: () => Promise<void>;
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export const ImpersonationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [impersonationSession, setImpersonationSession] = useState<ImpersonationSession | null>(null);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const { userProfile, refreshProfile } = useAuth();

  // Load active impersonation session on mount
  const loadActiveImpersonation = useCallback(async () => {
    if (!userProfile || userProfile.role !== 'super_admin') {
      setImpersonationSession(null);
      setIsImpersonating(false);
      return;
    }

    try {
      const response = await superAdminService.getActiveImpersonation();
      if (response.success && response.data) {
        setImpersonationSession(response.data);
        setIsImpersonating(true);
      } else {
        setImpersonationSession(null);
        setIsImpersonating(false);
      }
    } catch (error) {
      console.error('Failed to load active impersonation:', error);
      setImpersonationSession(null);
      setIsImpersonating(false);
    }
  }, [userProfile]);

  useEffect(() => {
    loadActiveImpersonation();
  }, [loadActiveImpersonation]);

  const startImpersonation = async (userId: string, reason?: string): Promise<boolean> => {
    try {
      const response = await superAdminService.startImpersonation(userId, reason);

      if (response.success && response.data) {
        setImpersonationSession(response.data);
        setIsImpersonating(true);

        // Refresh user profile to get impersonated user's context
        await refreshProfile();

        showSuccess(`Now impersonating ${response.data.impersonatedUserEmail}`);
        return true;
      } else if (isErrorResponse(response)) {
        showError(response.error.message || 'Failed to start impersonation');
        return false;
      } else {
        showError('Failed to start impersonation');
        return false;
      }
    } catch (error: any) {
      showError(error.message || 'Failed to start impersonation');
      return false;
    }
  };

  const endImpersonation = async (): Promise<boolean> => {
    if (!impersonationSession) {
      return false;
    }

    try {
      const response = await superAdminService.endImpersonation();

      if (response.success && response.data.success) {
        const previousEmail = impersonationSession.impersonatedUserEmail;
        setImpersonationSession(null);
        setIsImpersonating(false);

        // Refresh profile to restore super admin context
        await refreshProfile();

        showSuccess(`Stopped impersonating ${previousEmail}`);
        return true;
      } else {
        showError('Failed to end impersonation');
        return false;
      }
    } catch (error: any) {
      showError(error.message || 'Failed to end impersonation');
      return false;
    }
  };

  const refreshImpersonation = async () => {
    await loadActiveImpersonation();
  };

  const value: ImpersonationContextType = {
    impersonationSession,
    isImpersonating,
    startImpersonation,
    endImpersonation,
    refreshImpersonation
  };

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  );
};

export const useImpersonation = () => {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider');
  }
  return context;
};
