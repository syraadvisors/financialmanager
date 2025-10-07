import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (data.session) {
          // Check email domain for multi-tenant access
          const email = data.session.user.email;
          if (!email) {
            throw new Error('No email found in user data');
          }

          const domain = email.split('@')[1];

          // Query firms table to check if this domain is allowed
          const { data: firmData, error: firmError } = await supabase
            .from('firms')
            .select('*')
            .eq('firm_domain', domain)
            .single();

          if (firmError || !firmData) {
            throw new Error(
              `Access denied: Email domain "${domain}" is not registered. Please contact your administrator.`
            );
          }

          // Domain is valid, user can access the app
          // The firm association will be handled by FirmContext based on email domain
          console.log('User authenticated successfully for firm:', firmData.firm_name);

          // Redirect to dashboard
          navigate('/');
        } else {
          throw new Error('No session found');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f7fafc'
      }}>
        <div style={{
          textAlign: 'center',
          maxWidth: '400px',
          padding: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            backgroundColor: '#fff5f5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f56565',
            fontSize: '32px'
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
            Authentication Failed
          </h2>
          <p style={{ fontSize: '14px', color: '#718096', marginBottom: '8px' }}>
            {error}
          </p>
          <p style={{ fontSize: '12px', color: '#a0aec0' }}>
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f7fafc'
    }}>
      <div style={{ textAlign: 'center' }}>
        <Loader size={48} color="#667eea" style={{
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }} />
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#4a5568' }}>
          Completing sign in...
        </h2>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
