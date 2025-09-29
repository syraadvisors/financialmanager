import React, { useState, Suspense } from 'react';
import {
  Calculator,
  Users,
  Calendar,
  Settings,
  Play,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';

// Lazy load the fee calculation demo
const FeeCalculationDemo = React.lazy(() => import('../components/FeeCalculationDemo'));

interface TabProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const Tab: React.FC<TabProps> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '12px 20px',
      backgroundColor: isActive ? '#007bff' : 'transparent',
      color: isActive ? 'white' : '#666',
      border: 'none',
      borderRadius: '6px 6px 0 0',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: isActive ? 'bold' : 'normal',
      transition: 'all 0.2s ease',
    }}
  >
    {icon}
    {label}
  </button>
);

const FeeManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calculator');

  const tabs = [
    {
      id: 'calculator',
      label: 'Fee Calculator',
      icon: <Calculator size={16} />,
    },
    {
      id: 'clients',
      label: 'Client Management',
      icon: <Users size={16} />,
    },
    {
      id: 'schedules',
      label: 'Fee Schedules',
      icon: <FileText size={16} />,
    },
    {
      id: 'billing',
      label: 'Billing Periods',
      icon: <Calendar size={16} />,
    },
    {
      id: 'reports',
      label: 'Fee Reports',
      icon: <TrendingUp size={16} />,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'calculator':
        return (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#007bff',
                marginBottom: '12px'
              }}>
                <Calculator size={20} />
                Fee Calculation Engine
              </h3>
              <p style={{ color: '#666', margin: 0 }}>
                Test and demonstrate the fee calculation system with sample data.
                Run calculations, view detailed breakdowns, and validate fee logic.
              </p>
            </div>
            <Suspense fallback={
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#666',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                Loading Fee Calculator...
              </div>
            }>
              <FeeCalculationDemo />
            </Suspense>
          </div>
        );

      case 'clients':
        return (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#28a745',
                marginBottom: '12px'
              }}>
                <Users size={20} />
                Client Management
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Manage clients, assign fee schedules, and configure billing preferences.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h4 style={{ marginBottom: '16px' }}>Client Management Features</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px' }}>👤 Client Profiles</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Create and manage client profiles with contact information, preferences, and account assignments.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px' }}>📋 Fee Schedule Assignment</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Assign fee schedules to clients and configure account-level overrides.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px' }}>⚙️ Billing Preferences</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Set billing frequency, payment methods, and custom adjustments.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px' }}>📊 Client Analytics</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    View client portfolio summaries, fee history, and performance metrics.
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#856404',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Settings size={16} />
                  <strong>Coming Soon:</strong> Full client management interface with CRUD operations, search, and filtering.
                </p>
              </div>
            </div>
          </div>
        );

      case 'schedules':
        return (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc3545',
                marginBottom: '12px'
              }}>
                <FileText size={20} />
                Fee Schedule Management
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Create and manage fee schedules with flat rates, tiered structures, and custom configurations.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h4 style={{ marginBottom: '16px' }}>Fee Schedule Types</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#e8f4fd', borderRadius: '6px', border: '1px solid #b8e0ff' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px' }}>📊 Flat Rate Schedules</h5>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Simple percentage-based fee schedules (e.g., 0.25% annually)
                  </p>
                  <div style={{ fontSize: '12px', color: '#007bff', fontFamily: 'monospace' }}>
                    Example: 0.25% on all assets
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '6px', border: '1px solid #c7e3ff' }}>
                  <h5 style={{ color: '#0056b3', marginBottom: '8px' }}>📈 Tiered Rate Schedules</h5>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Multi-tier fee structures with different rates for different asset levels
                  </p>
                  <div style={{ fontSize: '12px', color: '#0056b3', fontFamily: 'monospace' }}>
                    Example: 1.2% up to $250K<br />
                    1.0% from $250K-$500K<br />
                    0.8% from $500K-$1M
                  </div>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderRadius: '6px', border: '1px solid #d6d6d6' }}>
                  <h5 style={{ color: '#6c757d', marginBottom: '8px' }}>🔧 Custom Schedules</h5>
                  <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
                    Specialized fee structures with custom rules and calculations
                  </p>
                  <div style={{ fontSize: '12px', color: '#6c757d', fontFamily: 'monospace' }}>
                    Example: Performance-based fees, minimum fees, exclusions
                  </div>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#d1ecf1',
                border: '1px solid #b3d7e6',
                borderRadius: '6px',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#0c5460',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Settings size={16} />
                  <strong>Available Now:</strong> The fee calculation demo includes pre-configured flat rate and tiered schedules for testing.
                </p>
              </div>
            </div>
          </div>
        );

      case 'billing':
        return (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#6f42c1',
                marginBottom: '12px'
              }}>
                <Calendar size={20} />
                Billing Period Management
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Configure billing periods, manage quarters, and handle fee calculations across different time periods.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h4 style={{ marginBottom: '16px' }}>Billing Period Features</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#f3e8ff', borderRadius: '6px', border: '1px solid #d8b3ff' }}>
                  <h5 style={{ color: '#6f42c1', marginBottom: '8px' }}>📅 Quarterly Billing</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Standard quarterly billing cycles with automatic proration calculations.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#fff5f5', borderRadius: '6px', border: '1px solid #ffb3b3' }}>
                  <h5 style={{ color: '#dc3545', marginBottom: '8px' }}>📊 Custom Periods</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Create custom billing periods for specific client needs or special circumstances.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f0fff4', borderRadius: '6px', border: '1px solid #b3ffcc' }}>
                  <h5 style={{ color: '#28a745', marginBottom: '8px' }}>⚡ Proration Logic</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Automatic proration for partial periods, account openings, and closings.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#fffbf0', borderRadius: '6px', border: '1px solid #ffe4b3' }}>
                  <h5 style={{ color: '#fd7e14', marginBottom: '8px' }}>🔄 Period Management</h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Track billing period status, manage cutoff dates, and handle period transitions.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '24px' }}>
                <h5 style={{ marginBottom: '12px' }}>Current Quarter Information</h5>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #dee2e6',
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    <div>
                      <strong>Current Quarter:</strong>
                      <div style={{ color: '#6f42c1', fontWeight: 'bold' }}>Q4 2024</div>
                    </div>
                    <div>
                      <strong>Period:</strong>
                      <div style={{ color: '#6f42c1' }}>Oct 1 - Dec 31, 2024</div>
                    </div>
                    <div>
                      <strong>Days in Period:</strong>
                      <div style={{ color: '#6f42c1' }}>92 days</div>
                    </div>
                    <div>
                      <strong>Proration Factor:</strong>
                      <div style={{ color: '#6f42c1' }}>0.2521 (92/365)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'reports':
        return (
          <div>
            <div style={{
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <h3 style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#fd7e14',
                marginBottom: '12px'
              }}>
                <TrendingUp size={20} />
                Fee Reports & Analytics
              </h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>
                Generate comprehensive fee reports, analyze billing trends, and export fee calculation results.
              </p>
            </div>

            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
              <h4 style={{ marginBottom: '16px' }}>Available Reports</h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', backgroundColor: '#fff8f0', borderRadius: '6px', border: '1px solid #ffe4cc' }}>
                  <h5 style={{ color: '#fd7e14', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} />
                    Fee Calculation Summary
                  </h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Comprehensive overview of all fee calculations for a billing period, including totals, averages, and breakdowns.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f0fff4', borderRadius: '6px', border: '1px solid #b3ffcc' }}>
                  <h5 style={{ color: '#28a745', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={16} />
                    Client Fee Report
                  </h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Detailed client-by-client fee breakdown with account-level details, exclusions, and tier calculations.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f5f0ff', borderRadius: '6px', border: '1px solid #d8b3ff' }}>
                  <h5 style={{ color: '#6f42c1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} />
                    Schedule Performance
                  </h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Analysis of fee schedule effectiveness, revenue generation, and comparative performance metrics.
                  </p>
                </div>

                <div style={{ padding: '16px', backgroundColor: '#f0f8ff', borderRadius: '6px', border: '1px solid #c7e3ff' }}>
                  <h5 style={{ color: '#007bff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={16} />
                    Billing Trends
                  </h5>
                  <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                    Historical fee trends, growth analysis, and billing period comparisons over time.
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '24px',
                padding: '16px',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '6px',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '14px',
                  color: '#155724',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Play size={16} />
                  <strong>Try It Now:</strong> Use the Fee Calculator tab to run calculations and see detailed results that form the basis of these reports.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '2px solid #dee2e6',
      }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Calculator size={32} style={{ color: '#007bff' }} />
          Fee Management System
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0,
          maxWidth: '600px'
        }}>
          Comprehensive fee calculation, client management, and billing administration platform.
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #dee2e6',
        marginBottom: '24px',
        overflowX: 'auto',
      }}>
        {tabs.map((tab) => (
          <Tab
            key={tab.id}
            id={tab.id}
            label={tab.label}
            icon={tab.icon}
            isActive={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          />
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: '500px' }}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FeeManagementPage;