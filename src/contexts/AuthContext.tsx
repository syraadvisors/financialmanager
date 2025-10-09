import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile, UserRole, PermissionName } from '../types/User';
import { usersService } from '../services/api/users.service';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: (reason?: 'manual' | 'expired' | 'error') => Promise<void>;
  hasPermission: (permission: PermissionName) => boolean;
  hasRole: (role: UserRole) => boolean;
  refreshProfile: () => Promise<void>;
  sessionExpiresAt: Date | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expiryWarningShownRef = useRef(false);

  const loadUserProfile = async (userId: string) => {
    try {
      const response = await usersService.getCurrentUserProfile();
      if (response.data) {
        setUserProfile(response.data);
      } else if (response.error) {
        console.warn('[AuthContext] User profile not found:', response.error);
        setUserProfile(null);
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  // Setup automatic token refresh before expiry
  const setupTokenRefresh = useCallback((session: Session) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    if (!session.expires_at) return;

    const expiresAt = new Date(session.expires_at * 1000);
    setSessionExpiresAt(expiresAt);

    const now = Date.now();
    const expiresIn = expiresAt.getTime() - now;

    // Refresh token 5 minutes before expiry
    const refreshTime = expiresIn - (5 * 60 * 1000);

    console.log('[AuthContext] Session expires at:', expiresAt.toLocaleString());
    console.log('[AuthContext] Will refresh token in:', Math.floor(refreshTime / 1000 / 60), 'minutes');

    if (refreshTime > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        console.log('[AuthContext] Refreshing session token...');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            console.error('[AuthContext] Error refreshing session:', error);
            // Session expired, sign out
            await signOut('expired');
          } else if (data.session) {
            console.log('[AuthContext] Session refreshed successfully');
            setSession(data.session);
            setupTokenRefresh(data.session);
          }
        } catch (err) {
          console.error('[AuthContext] Exception refreshing session:', err);
          await signOut('error');
        }
      }, refreshTime);
    } else if (expiresIn > 0) {
      // Session expires very soon, show warning
      if (!expiryWarningShownRef.current) {
        expiryWarningShownRef.current = true;
        console.warn('[AuthContext] Session expires in less than 5 minutes');

        // Try immediate refresh
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error || !data.session) {
            console.error('[AuthContext] Unable to refresh expiring session');
          } else {
            expiryWarningShownRef.current = false;
            setupTokenRefresh(data.session);
          }
        });
      }
    } else {
      // Session already expired
      console.warn('[AuthContext] Session already expired');
      signOut('expired');
    }
  }, []);

  // Monitor session validity
  useEffect(() => {
    if (session) {
      setupTokenRefresh(session);
    }

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [session, setupTokenRefresh]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async (reason: 'manual' | 'expired' | 'error' = 'manual') => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Show appropriate message based on reason
    if (reason === 'expired') {
      console.log('[AuthContext] Session expired, logging out...');
      // You could show a toast notification here
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'expired');
      }
    } else if (reason === 'error') {
      console.log('[AuthContext] Authentication error, logging out...');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'error');
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      // Still clear local state even if signOut fails
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setSessionExpiresAt(null);
    }

    // Redirect to login page
    if (reason !== 'manual' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const hasPermission = (permission: PermissionName): boolean => {
    if (!userProfile) return false;
    const { roleHasPermission } = require('../types/User');
    return roleHasPermission(userProfile.role, permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!userProfile) return false;
    return userProfile.role === role;
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id);
    }
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signInWithGoogle,
    signOut,
    hasPermission,
    hasRole,
    refreshProfile,
    sessionExpiresAt,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
