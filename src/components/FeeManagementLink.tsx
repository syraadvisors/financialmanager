import React, { useState } from 'react';
import { Calculator, ExternalLink } from 'lucide-react';
import FeeManagementPage from '../pages/FeeManagementPage';

const FeeManagementLink: React.FC = () => {
  const [showFeeManagement, setShowFeeManagement] = useState(false);

  if (showFeeManagement) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'white',
        zIndex: 1000,
        overflow: 'auto',
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          padding: '16px 24px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #dee2e6',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#007bff'
          }}>
            <Calculator size={20} />
            Fee Management System
          </h2>
          <button
            onClick={() => setShowFeeManagement(false)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            ← Back to Overview
          </button>
        </div>
        <FeeManagementPage />
      </div>
    );
  }

  return (
    <div style={{
      marginTop: '32px',
      padding: '24px',
      backgroundColor: '#e7f3ff',
      borderRadius: '12px',
      border: '2px solid #007bff',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
      }}>
        <h3 style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#007bff',
          margin: 0,
        }}>
          <Calculator size={24} />
          Fee Management System
        </h3>
        <button
          onClick={() => setShowFeeManagement(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          <ExternalLink size={16} />
          Open Fee Management
        </button>
      </div>

      <p style={{
        color: '#0056b3',
        margin: 0,
        lineHeight: 1.5,
      }}>
        <strong>New!</strong> Comprehensive fee calculation system with client management,
        fee schedules, billing periods, and detailed calculations. Test fee calculations,
        manage client profiles, and generate reports.
      </p>

      <div style={{
        marginTop: '16px',
        display: 'flex',
        gap: '16px',
        fontSize: '14px',
        color: '#0056b3',
      }}>
        <span>✅ Fee Calculator & Demo</span>
        <span>✅ Client Management</span>
        <span>✅ Fee Schedules</span>
        <span>✅ Billing Periods</span>
        <span>✅ Reports & Analytics</span>
      </div>
    </div>
  );
};

export default FeeManagementLink;