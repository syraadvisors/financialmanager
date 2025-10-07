import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

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

  // Load firm on mount if defaultFirmId is provided
  useEffect(() => {
    if (defaultFirmId) {
      loadFirm(defaultFirmId);
    } else {
      setLoading(false);
    }
  }, [defaultFirmId]);

  // In the future, this will check the authenticated user's JWT for firm_id
  // For now, we're using defaultFirmId for development
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.app_metadata?.firm_id) {
        // User is authenticated and has a firm_id
        const authFirmId = user.app_metadata.firm_id;
        setFirmIdState(authFirmId);
        loadFirm(authFirmId);
      } else if (!defaultFirmId) {
        // No authenticated user and no default firm
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.app_metadata?.firm_id) {
        const authFirmId = session.user.app_metadata.firm_id;
        setFirmIdState(authFirmId);
        loadFirm(authFirmId);
      } else if (event === 'SIGNED_OUT') {
        setFirmIdState(defaultFirmId || null);
        setFirm(null);
        if (defaultFirmId) {
          loadFirm(defaultFirmId);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [defaultFirmId]);

  return (
    <FirmContext.Provider value={{ firmId, firm, loading, setFirmId, loadFirm }}>
      {children}
    </FirmContext.Provider>
  );
};
