import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Firm {
  id: string;
  firmName: string;
  firmDomain: string;
  firmStatus: string;
  subscriptionTier: string;
  subscriptionStatus: string;
}

interface FirmContextType {
  firmId: string | null;
  firm: Firm | null;
  loading: boolean;
  setFirmId: (id: string) => void;
  loadFirm: (id: string) => Promise<void>;
}

const FirmContext = createContext<FirmContextType>({
  firmId: null,
  firm: null,
  loading: true,
  setFirmId: () => {},
  loadFirm: async () => {},
});

export const useFirm = () => {
  const context = useContext(FirmContext);
  if (!context) {
    throw new Error('useFirm must be used within a FirmProvider');
  }
  return context;
};

interface FirmProviderProps {
  children: React.ReactNode;
  // For development, you can hardcode your test firm ID here
  // In production, this will come from the authenticated user's JWT
  defaultFirmId?: string;
}

export const FirmProvider: React.FC<FirmProviderProps> = ({
  children,
  defaultFirmId
}) => {
  const { userProfile } = useAuth();
  const [firmId, setFirmIdState] = useState<string | null>(defaultFirmId || null);
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);

  // Load firm data from Supabase
  const loadFirm = async (id: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('firms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading firm:', error);
        return;
      }

      if (data) {
        setFirm({
          id: data.id,
          firmName: data.firm_name,
          firmDomain: data.firm_domain,
          firmStatus: data.firm_status,
          subscriptionTier: data.subscription_tier,
          subscriptionStatus: data.subscription_status,
        });
      }
    } catch (err) {
      console.error('Error loading firm:', err);
    } finally {
      setLoading(false);
    }
  };

  // Set firm ID and load firm data
  const setFirmId = (id: string) => {
    setFirmIdState(id);
    loadFirm(id);
  };

  // Load firm from user profile
  useEffect(() => {
    if (userProfile?.firmId) {
      setFirmIdState(userProfile.firmId);
      loadFirm(userProfile.firmId);
    } else if (defaultFirmId) {
      // Fallback to default for development
      loadFirm(defaultFirmId);
    } else if (userProfile && !userProfile.firmId) {
      // User profile loaded but no firm_id - this is an error state
      console.error('[FirmContext] User profile loaded but has no firm_id');
      setLoading(false);
    }
    // If userProfile is still null, keep loading state until it loads
  }, [userProfile, defaultFirmId]);

  // Listen for sign out to reset firm
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setFirmIdState(null);
        setFirm(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <FirmContext.Provider value={{ firmId, firm, loading, setFirmId, loadFirm }}>
      {children}
    </FirmContext.Provider>
  );
};
