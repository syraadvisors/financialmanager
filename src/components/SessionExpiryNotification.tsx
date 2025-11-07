import React, { useEffect, useState } from 'react';
import { Clock, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SessionExpiryNotification: React.FC = () => {
  const { sessionExpiresAt, signOut, sessionRefreshFailed } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [showWarning, setShowWarning] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!sessionExpiresAt || dismissed) {
      setShowWarning(false);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const expiresAt = sessionExpiresAt.getTime();
      const remaining = expiresAt - now;

      // Only show warning if:
      // 1. Less than 3 minutes remaining (critical time)
      // 2. AND the session refresh has failed (indicating a real problem)
      if (remaining > 0 && remaining < 3 * 60 * 1000 && sessionRefreshFailed) {
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }

      // Auto-logout if expired
      if (remaining <= 0) {
        signOut('expired');
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [sessionExpiresAt, signOut, dismissed, sessionRefreshFailed]);

  if (!showWarning) return null;

  const handleDismiss = () => {
    setDismissed(true);
    setShowWarning(false);
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        maxWidth: '400px',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffc107',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        padding: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideIn 0.3s ease-out',
      }}
    >
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>

      <AlertCircle size={24} color="#ff9800" style={{ flexShrink: 0, marginTop: '2px' }} />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Clock size={16} color="#ff9800" />
          <strong style={{ color: '#856404', fontSize: '14px' }}>
            Session Expiring Soon
          </strong>
        </div>
        <p style={{ margin: '0 0 12px 0', color: '#856404', fontSize: '13px', lineHeight: '1.4' }}>
          Your session could not be refreshed and will expire in <strong>{timeRemaining}</strong>.
          Please save your work. You will need to log in again.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleDismiss}
            style={{
              padding: '6px 12px',
              backgroundColor: '#ff9800',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f57c00'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff9800'}
          >
            Dismiss
          </button>
        </div>
      </div>

      <button
        onClick={handleDismiss}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#856404',
          flexShrink: 0,
        }}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default SessionExpiryNotification;
