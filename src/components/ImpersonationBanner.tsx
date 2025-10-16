/**
 * Impersonation Banner Component
 *
 * Displays a prominent banner when a super admin is impersonating another user.
 * Shows who is being impersonated and provides a button to end the impersonation.
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useImpersonation } from '../contexts/ImpersonationContext';

const ImpersonationBanner: React.FC = () => {
  const { impersonationSession, isImpersonating, endImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonationSession) {
    return null;
  }

  const handleEndImpersonation = async () => {
    await endImpersonation();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '12px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      zIndex: 9999,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      fontWeight: 500
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <AlertTriangle size={20} />
        <div>
          <span style={{ fontWeight: 600 }}>Impersonation Mode Active:</span>
          {' '}
          Viewing as <strong>{impersonationSession.impersonatedUserEmail}</strong>
          {impersonationSession.reason && (
            <span style={{
              marginLeft: '12px',
              fontSize: '13px',
              opacity: 0.9,
              fontStyle: 'italic'
            }}>
              ({impersonationSession.reason})
            </span>
          )}
        </div>
      </div>

      <button
        onClick={handleEndImpersonation}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 16px',
          backgroundColor: 'white',
          color: '#dc2626',
          border: 'none',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fee2e2';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
        }}
      >
        <X size={16} />
        End Impersonation
      </button>
    </div>
  );
};

export default ImpersonationBanner;
