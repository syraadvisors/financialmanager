import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile, UserRole, PermissionName } from '../types/User';
import { loggers } from '../utils/logger';
import { setSentryUser, clearSentryUser } from '../lib/sentry';

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
  sessionRefreshFailed: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<Date | null>(null);
  const [sessionRefreshFailed, setSessionRefreshFailed] = useState(false);

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const expiryWarningShownRef = useRef(false);
  const sessionRef = useRef<Session | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Keep sessionRef updated
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const loadUserProfile = async (userId: string, sessionToUse?: Session | null) => {
    const authLogger = loggers.auth;
    authLogger.debug('Loading user profile', { userId });

    // Use the session from parameter if provided, otherwise use the ref
    const currentSession = sessionToUse || sessionRef.current;

    if (!currentSession) {
      authLogger.error('No session found in ref or parameter');
      setUserProfile(null);
      return;
    }

    try {
      // Attempt to use Supabase client first
      // If this hangs, we'll fall back to direct REST API
      const supabaseQuery = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Set a timeout to detect if Supabase client hangs
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase query timeout')), 5000);
      });

      let profileData;
      try {
        const result = await Promise.race([
          supabaseQuery,
          timeoutPromise
        ]);

        // If we get here, the query completed (didn't timeout)
        const { data, error } = result as { data: any; error: any };

        if (error) {
          throw error;
        }

        profileData = data;
        authLogger.debug('Profile loaded via Supabase client');
      } catch (supabaseError: any) {
        // If Supabase client times out or fails, use direct REST API
        authLogger.warn('Supabase client query failed, using direct REST API', { error: supabaseError.message });

        const response = await fetch(
          `${supabaseUrl}/rest/v1/user_profiles?id=eq.${userId}&select=*`,
          {
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${currentSession.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation'
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          authLogger.error('REST API fetch error', { status: response.status, error: errorText });
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        profileData = Array.isArray(data) && data.length > 0 ? data[0] : null;
        authLogger.debug('Profile loaded via REST API');
      }

      if (!profileData) {
        authLogger.warn('No profile data returned');
        setUserProfile(null);
      } else {
        // Convert snake_case to camelCase and ensure Date objects
        const profile: UserProfile = {
          id: profileData.id,
          firmId: profileData.firm_id,
          email: profileData.email,
          fullName: profileData.full_name,
          role: profileData.role,
          status: profileData.status,
          avatarUrl: profileData.avatar_url,
          jobTitle: profileData.job_title,
          department: profileData.department,
          phoneNumber: profileData.phone_number,
          bio: profileData.bio,
          emailVerified: profileData.email_verified,
          mfaEnabled: profileData.mfa_enabled || false,
          preferences: profileData.preferences,
          lastLoginAt: profileData.last_login_at ? new Date(profileData.last_login_at) : null,
          loginCount: profileData.login_count,
          createdAt: new Date(profileData.created_at),
          updatedAt: new Date(profileData.updated_at)
        };
        setUserProfile(profile);
        authLogger.info('User profile loaded successfully');
        
        // Set Sentry user context
        setSentryUser({
          id: profile.id,
          email: profile.email,
          username: profile.fullName || undefined,
          firmId: profile.firmId || undefined,
        });
      }
    } catch (error) {
      authLogger.error('Exception loading user profile', error);
      // On timeout or exception, try to set minimal profile from auth user
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          authLogger.info('Setting minimal profile from auth user after exception');
          const minimalProfile: UserProfile = {
            id: userId,
            firmId: null,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || user.email || '',
            role: 'user' as UserRole,
            status: 'active',
            avatarUrl: user.user_metadata?.avatar_url || null,
            jobTitle: null,
            department: null,
            phoneNumber: null,
            bio: null,
            emailVerified: user.email_confirmed_at ? true : false,
            mfaEnabled: false,
            preferences: null,
            lastLoginAt: null,
            loginCount: 0,
            createdAt: user.created_at ? new Date(user.created_at) : new Date(),
            updatedAt: user.updated_at ? new Date(user.updated_at) : new Date()
          };
          setUserProfile(minimalProfile);
          
          // Set Sentry user context with minimal profile
          setSentryUser({
            id: minimalProfile.id,
            email: minimalProfile.email,
            username: minimalProfile.fullName || undefined,
            firmId: minimalProfile.firmId || undefined,
          });
        } else {
          setUserProfile(null);
          clearSentryUser();
        }
      } catch (fallbackError) {
        authLogger.error('Fallback profile creation also failed', fallbackError);
        setUserProfile(null);
      }
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

    const authLogger = loggers.auth;
    authLogger.debug('Session token refresh scheduled', {
      expiresAt: expiresAt.toLocaleString(),
      refreshInMinutes: Math.floor(refreshTime / 1000 / 60)
    });

    if (refreshTime > 0) {
      refreshTimerRef.current = setTimeout(async () => {
        authLogger.debug('Refreshing session token');
        try {
          const { data, error } = await supabase.auth.refreshSession();
          if (error) {
            authLogger.error('Error refreshing session', error);
            // Mark refresh as failed
            setSessionRefreshFailed(true);
            // Session expired, sign out
            await signOut('expired');
          } else if (data.session) {
            authLogger.debug('Session refreshed successfully');
            setSessionRefreshFailed(false);
            setSession(data.session);
            setupTokenRefresh(data.session);
          }
        } catch (err) {
          authLogger.error('Exception refreshing session', err);
          setSessionRefreshFailed(true);
          await signOut('error');
        }
      }, refreshTime);
    } else if (expiresIn > 0) {
      // Session expires very soon, show warning
      if (!expiryWarningShownRef.current) {
        expiryWarningShownRef.current = true;
        authLogger.warn('Session expires in less than 5 minutes');

        // Try immediate refresh
        supabase.auth.refreshSession().then(({ data, error }) => {
          if (error || !data.session) {
            authLogger.error('Unable to refresh expiring session', error);
            setSessionRefreshFailed(true);
          } else {
            expiryWarningShownRef.current = false;
            setSessionRefreshFailed(false);
            setupTokenRefresh(data.session);
          }
        });
      }
    } else {
      // Session already expired
      authLogger.warn('Session already expired');
      setSessionRefreshFailed(true);
      signOut('expired');
    }
  }, []);

  // Setup inactivity timeout (30 minutes)
  const setupInactivityTimeout = useCallback(() => {
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Update last activity time
      lastActivityRef.current = Date.now();

      // Set new timer
      inactivityTimerRef.current = setTimeout(() => {
        loggers.auth.info('User inactive for 30 minutes, logging out');
        signOut('expired');
      }, INACTIVITY_TIMEOUT);
    };

    // Activity event handlers
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      window.addEventListener(event, handleActivity, true);
    });

    // Start the initial timer
    resetInactivityTimer();

    // Cleanup function
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      events.forEach(event => {
        window.removeEventListener(event, handleActivity, true);
      });
    };
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

  // Setup inactivity timeout when user is logged in
  useEffect(() => {
    if (user) {
      const cleanup = setupInactivityTimeout();
      return cleanup;
    } else {
      // Clear inactivity timer when user logs out
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
    }
  }, [user, setupInactivityTimeout]);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id, session);
      }

      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserProfile(session.user.id, session);
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
      loggers.auth.error('Error signing in with Google', error);
      throw error;
    }
  };

  const signOut = async (reason: 'manual' | 'expired' | 'error' = 'manual') => {
    // Clear refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    // Clear inactivity timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    // Clear Sentry user context
    clearSentryUser();

    const authLogger = loggers.auth;
    
    // Show appropriate message based on reason
    if (reason === 'expired') {
      authLogger.info('Session expired, logging out');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'expired');
      }
    } else if (reason === 'error') {
      authLogger.info('Authentication error, logging out');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('logout_reason', 'error');
      }
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      authLogger.error('Error signing out', error);
      // Still clear local state even if signOut fails
      setUser(null);
      setSession(null);
      setUserProfile(null);
      setSessionExpiresAt(null);
    }

    // Redirect to home page
    if (typeof window !== 'undefined') {
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
    sessionRefreshFailed,
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
