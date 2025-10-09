import React, { useState, useEffect, Suspense } from 'react';
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
import ErrorBoundary from '../components/ErrorBoundary';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ClientsPage from '../components/ClientsPage';
import AccountsPage from '../components/AccountsPage';
import MasterAccountsPage from '../components/MasterAccountsPage';
import HouseholdsPage from '../components/HouseholdsPage';
import RelationshipsPage from '../components/RelationshipsPage';
import BillingPeriodsPage from '../components/BillingPeriodsPage';
import FeeSchedulesPage from '../components/FeeSchedulesPage';
import FeeReportsPage from '../components/FeeReportsPage';

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

interface FeeManagementPageProps {
  activeTab?: string;
}

const FeeManagementPage: React.FC<FeeManagementPageProps> = ({ activeTab: initialTab }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'calculator');

  // Update active tab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    {
      id: 'calculator',
      label: 'Fee Calculator',
      icon: <Calculator size={16} />,
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: <Users size={16} />,
    },
    {
      id: 'accounts',
      label: 'Accounts',
      icon: <Users size={16} />,
    },
    {
      id: 'households',
      label: 'Households',
      icon: <Calendar size={16} />,
    },
    {
      id: 'relationships',
      label: 'Relationships',
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
            <Suspense fallback={<LoadingSkeleton type="chart" />}>
              <FeeCalculationDemo />
            </Suspense>
          </div>
        );

      case 'clients':
        return <ClientsPage />;

      case 'accounts':
        return <AccountsPage />;

      case 'master-accounts':
        return <MasterAccountsPage />;

      case 'households':
        return <HouseholdsPage />;

      case 'relationships':
        return <RelationshipsPage />;

      case 'schedules':
        return <FeeSchedulesPage />;

      case 'billing':
        return <BillingPeriodsPage />;

      case 'reports':
        return <FeeReportsPage />;

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <ErrorBoundary level="page">
      <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {/* Tab Content */}
        <div style={{ minHeight: '500px' }}>
          {renderTabContent()}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default FeeManagementPage;