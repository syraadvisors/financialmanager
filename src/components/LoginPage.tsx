import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, BarChart3 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '450px',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        padding: '48px',
        textAlign: 'center'
      }}>
        {/* Logo/Brand */}
        <div style={{
          width: '80px',
          height: '80px',
          margin: '0 auto 24px',
          backgroundColor: '#2196f3',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <BarChart3 size={40} color="white" />
        </div>

        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#1a202c',
          marginBottom: '8px'
        }}>
          FeeMGR
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#718096',
          marginBottom: '32px'
        }}>
          Comprehensive fee management platform
        </p>

        {/* Features */}
        <div style={{
          marginBottom: '32px',
          textAlign: 'left'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
            padding: '12px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px'
          }}>
            <Shield size={20} color="#2196f3" />
            <span style={{ fontSize: '14px', color: '#4a5568' }}>
              Secure authentication with Google
            </span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px'
          }}>
            <BarChart3 size={20} color="#2196f3" />
            <span style={{ fontSize: '14px', color: '#4a5568' }}>
              Enterprise-grade client management
            </span>
          </div>
        </div>

        {/* Sign In Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px 24px',
            backgroundColor: loading ? '#cbd5e0' : 'white',
            color: '#1a202c',
            border: '2px solid #e2e8f0',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = '#f7fafc';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2196f3',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite'
              }} />
              Signing in...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#fff5f5',
            border: '1px solid #feb2b2',
            borderRadius: '8px',
            color: '#c53030',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <p style={{
          marginTop: '24px',
          fontSize: '12px',
          color: '#a0aec0'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
