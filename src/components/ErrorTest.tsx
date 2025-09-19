import React, { useState } from 'react';

// This component is for testing error boundaries
// Remove this in production
const ErrorTest: React.FC = () => {
  const [shouldThrow, setShouldThrow] = useState(false);

  if (shouldThrow) {
    throw new Error('This is a test error to verify the ErrorBoundary functionality');
  }

  return (
    <div style={{
      padding: '16px',
      backgroundColor: '#fff3e0',
      borderRadius: '6px',
      border: '1px solid #ffcc02',
      margin: '16px 0',
    }}>
      <h4 style={{ color: '#e65100', marginBottom: '8px' }}>
        Error Boundary Test Component
      </h4>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
        This component is for testing error boundaries. Click the button to trigger an error.
      </p>
      <button
        onClick={() => setShouldThrow(true)}
        style={{
          padding: '6px 12px',
          backgroundColor: '#ff9800',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        Trigger Error
      </button>
      <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>
        Note: Remove this component in production
      </p>
    </div>
  );
};

export default ErrorTest;