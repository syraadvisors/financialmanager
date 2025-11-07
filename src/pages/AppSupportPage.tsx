import React, { useState } from 'react';
import { Book, FileText, Search, TrendingUp, DollarSign, Users, Home, Settings, Calculator, Receipt, FileBarChart, Shield, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AppSupportPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Glossary of terms
  const glossary = [
    {
      term: 'Account',
      definition: 'An investment account belonging to a client. Each account has a unique account number and can hold positions (securities). Accounts are linked to clients and can be part of a household.'
    },
    {
      term: 'Account Type',
      definition: 'The classification of an account such as Individual, Joint, IRA, Trust, Corporate, etc. This determines ownership structure and tax treatment.'
    },
    {
      term: 'As-of Date',
      definition: 'The date for which position or balance data is reported. Historical data can be viewed by selecting different as-of dates.'
    },
    {
      term: 'Balance Data',
      definition: 'Account-level financial information including portfolio value, cash balances, and other summary metrics for a specific date.'
    },
    {
      term: 'Billing Period',
      definition: 'A time period (typically quarterly) for which advisory fees are calculated and invoiced. Defined by start and end dates.'
    },
    {
      term: 'Client',
      definition: 'An individual or entity that has a relationship with the advisory firm. Clients can own one or more accounts and belong to households.'
    },
    {
      term: 'Custodian',
      definition: 'The financial institution that holds and safeguards the securities in an account (e.g., Schwab, Fidelity, TD Ameritrade).'
    },
    {
      term: 'CSV Import',
      definition: 'The process of importing position or balance data from comma-separated value (CSV) files exported from custodian systems.'
    },
    {
      term: 'Fee Calculation',
      definition: 'The computed advisory fee amount based on account balances, fee schedule rates, and billing period. Includes breakpoints and tiering.'
    },
    {
      term: 'Fee Exception',
      definition: 'A special adjustment or override to the standard fee calculation for a specific account or client (e.g., discount, minimum fee waiver).'
    },
    {
      term: 'Fee Schedule',
      definition: 'A tiered rate structure defining how advisory fees are calculated. Includes breakpoints (e.g., 1% on first $1M, 0.75% on next $1M) and billing frequency.'
    },
    {
      term: 'Firm',
      definition: 'The advisory firm organization. The system supports multi-tenant architecture where each firm has its own isolated data.'
    },
    {
      term: 'Household',
      definition: 'A grouping of related clients and their accounts, typically a family unit. Useful for consolidated reporting and relationship management.'
    },
    {
      term: 'Import Batch',
      definition: 'A collection of position or balance records imported together at the same time. Each import creates a unique batch ID for tracking and audit purposes.'
    },
    {
      term: 'Market Value',
      definition: 'The current total value of a security position, calculated as quantity × price. Excludes accrued interest for bonds.'
    },
    {
      term: 'Master Account',
      definition: 'A template or grouping mechanism for accounts with similar characteristics. Used for bulk operations and standardized setup.'
    },
    {
      term: 'Position',
      definition: 'A holding of a specific security (stock, bond, mutual fund, etc.) within an account. Includes quantity, price, and market value.'
    },
    {
      term: 'Portfolio Value',
      definition: 'The total value of all holdings in an account, including securities, cash, and other assets.'
    },
    {
      term: 'Relationship',
      definition: 'The connection between clients, accounts, and households. Defines ownership structure (e.g., primary owner, joint owner, beneficiary).'
    },
    {
      term: 'RLS (Row-Level Security)',
      definition: 'Database security policy that ensures users can only access data belonging to their firm. Provides multi-tenant data isolation.'
    },
    {
      term: 'Security',
      definition: 'A financial instrument such as stock, bond, mutual fund, ETF, or option. Identified by symbol/ticker and CUSIP.'
    },
    {
      term: 'Security Type',
      definition: 'The classification of a security: Common Stock, Mutual Fund, ETF, Corporate Bond, Municipal Bond, Option, Cash Equivalent, etc.'
    },
    {
      term: 'Symbol/Ticker',
      definition: 'The abbreviated identifier for a security (e.g., AAPL for Apple Inc., SPY for SPDR S&P 500 ETF).'
    },
    {
      term: 'CUSIP',
      definition: 'Committee on Uniform Securities Identification Procedures number - a 9-character alphanumeric code uniquely identifying a security.'
    }
  ];

  // Page descriptions
  const pages = [
    {
      name: 'Portfolio Overview',
      icon: <Home size={20} />,
      purpose: 'Provides a high-level dashboard view of the firm\'s entire book of business.',
      functionality: [
        'Displays total portfolio value across all accounts',
        'Shows total cash and invested positions',
        'Counts total number of accounts in the system',
        'Summarizes balance and position data with key metrics',
        'Shows last data import timestamp',
        'Provides export capabilities for overview data'
      ],
      dataSource: 'Aggregates data from imported balance and position files, plus direct account count from accounts table'
    },
    {
      name: 'Balance Data',
      icon: <DollarSign size={20} />,
      purpose: 'Displays account-level balance information imported from custodian files.',
      functionality: [
        'Search and filter account balance records',
        'View portfolio values, cash balances, and account details',
        'Filter by date to see historical balance snapshots',
        'Import balance data from CSV files',
        'Export balance data for reporting',
        'View summary statistics (total AUM, account count, date range)',
        'Uses search-based loading for performance with large datasets'
      ],
      dataSource: 'imported_balance_data table populated via CSV imports'
    },
    {
      name: 'Position Holdings',
      icon: <TrendingUp size={20} />,
      purpose: 'Shows detailed position-level holdings data for all accounts.',
      functionality: [
        'Search positions by symbol, security name, or account number',
        'View all dates combined or filter to specific as-of date',
        'See quantity, price, market value, and security details',
        'Filter by security type (stocks, bonds, funds, etc.)',
        'Import position data from CSV files',
        'View summary statistics (total positions, accounts, market value)',
        'Toggle between essential and all columns',
        'Search-based loading optimized for large datasets (8,000+ positions)'
      ],
      dataSource: 'imported_positions_data table populated via CSV imports'
    },
    {
      name: 'Clients',
      icon: <Users size={20} />,
      purpose: 'Manages client records and relationships with the firm.',
      functionality: [
        'Create, view, edit, and delete client records',
        'Track client details: name, type (individual/entity), status, contact info',
        'Link clients to accounts and households',
        'Filter by client status (active, inactive, prospect)',
        'Search clients by name or ID',
        'View assigned accounts per client',
        'Export client list'
      ],
      dataSource: 'clients table with relationships to accounts and households'
    },
    {
      name: 'Accounts',
      icon: <FileText size={20} />,
      purpose: 'Manages investment account records and their relationships.',
      functionality: [
        'Create, view, edit, and delete account records',
        'Track account number, type, custodian, status',
        'Link accounts to clients, households, and fee schedules',
        'View account balances and positions',
        'Assign fee schedules for billing',
        'Filter by account status and type',
        'Search accounts by number or name'
      ],
      dataSource: 'accounts table with foreign keys to clients, households, fee_schedules'
    },
    {
      name: 'Households',
      icon: <Home size={20} />,
      purpose: 'Groups related clients and accounts for consolidated management.',
      functionality: [
        'Create and manage household groups',
        'Link multiple clients to a household (family members)',
        'Associate multiple accounts with a household',
        'View consolidated household portfolio value',
        'Track household relationships and structure',
        'Useful for family offices and multi-generational wealth management'
      ],
      dataSource: 'households table with many-to-many relationships via relationships table'
    },
    {
      name: 'Relationships',
      icon: <Users size={20} />,
      purpose: 'Defines and manages connections between clients, accounts, and households.',
      functionality: [
        'Link clients to accounts (primary owner, joint owner, beneficiary)',
        'Link clients to households (head of household, spouse, dependent)',
        'Link accounts to households',
        'Define relationship types and roles',
        'View relationship network diagrams',
        'Manage complex ownership structures'
      ],
      dataSource: 'relationships table connecting clients, accounts, and households'
    },
    {
      name: 'Fee Management',
      icon: <Calculator size={20} />,
      purpose: 'Comprehensive fee administration including schedules, calculations, and billing.',
      functionality: [
        'Manage fee schedules with tiered rate structures',
        'Define billing periods (quarterly, annually, etc.)',
        'Calculate fees based on account values and schedules',
        'Track fee exceptions and adjustments',
        'View fee calculation history and audit trail',
        'Generate billing reports and invoices',
        'Handle complex scenarios: breakpoints, minimums, caps, discounts'
      ],
      dataSource: 'fee_schedules, billing_periods, fee_calculations, fee_exceptions, billing_fee_agreements tables'
    },
    {
      name: 'Fee Schedules',
      icon: <Receipt size={20} />,
      purpose: 'Defines tiered fee rate structures for advisory billing.',
      functionality: [
        'Create schedules with multiple tiers/breakpoints',
        'Set rates as percentage of AUM',
        'Define minimum and maximum fees',
        'Specify billing frequency and timing',
        'Assign schedules to accounts',
        'Clone schedules for variations',
        'Track schedule version history'
      ],
      dataSource: 'fee_schedules table with tier breakpoints'
    },
    {
      name: 'Billing Periods',
      icon: <FileBarChart size={20} />,
      purpose: 'Manages time periods for fee calculation and invoicing.',
      functionality: [
        'Create quarterly, annual, or custom billing periods',
        'Define start and end dates',
        'Set due dates for fee payments',
        'Track period status (open, closed, billed)',
        'Generate fees for all accounts in a period',
        'View historical billing periods'
      ],
      dataSource: 'billing_periods table'
    },
    {
      name: 'User Management',
      icon: <Users size={20} />,
      purpose: 'Administers user accounts and permissions within the firm.',
      functionality: [
        'Create and manage user profiles',
        'Assign roles: Admin, Manager, User, Read-Only',
        'Set user status (active, inactive, suspended)',
        'Track login history and activity',
        'Manage OAuth authentication',
        'View user audit logs',
        'Reset passwords and enable MFA'
      ],
      dataSource: 'user_profiles table integrated with Supabase authentication'
    },
    {
      name: 'Firm Settings',
      icon: <Settings size={20} />,
      purpose: 'Configures firm-level settings and preferences.',
      functionality: [
        'Update firm name and contact information',
        'Set firm domain and branding',
        'Configure default fee schedules',
        'Set billing preferences and defaults',
        'Manage firm-wide notifications',
        'Configure data import templates',
        'Set timezone and regional settings'
      ],
      dataSource: 'firms table'
    },
    {
      name: 'Audit Logs',
      icon: <Shield size={20} />,
      purpose: 'Tracks all system activity for compliance and security monitoring.',
      functionality: [
        'View chronological log of all user actions',
        'Filter by user, action type, date range, entity type',
        'See detailed change history (before/after values)',
        'Track data imports, exports, deletions',
        'Monitor login/logout events',
        'Export audit reports for compliance',
        'Search across all audit entries'
      ],
      dataSource: 'audit_logs table with automatic triggers on data changes'
    },
    {
      name: 'Super Admin Dashboard',
      icon: <Shield size={20} />,
      purpose: 'System-wide administration for managing multiple firms (super admin only).',
      functionality: [
        'View all firms in the system',
        'Create new firm accounts',
        'Manage firm status and subscriptions',
        'Impersonate users for support',
        'View system-wide statistics',
        'Monitor system health and performance',
        'Manage global settings and features'
      ],
      dataSource: 'All tables with cross-firm visibility (requires super_admin role)',
      accessLevel: 'Super Admin Only'
    }
  ];

  // Filter content based on search
  const filteredGlossary = glossary.filter(item =>
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter pages based on search AND user role (hide Super Admin page from non-super-admins)
  const filteredPages = pages
    .filter(page => {
      // Hide Super Admin Dashboard from non-super-admins
      if (page.accessLevel === 'Super Admin Only' && !hasRole('super_admin')) {
        return false;
      }
      // Apply search filter
      return (
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.functionality.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    });

  return (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: '32px',
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 8px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <Book size={32} style={{ color: '#2196f3' }} />
          App Support & Documentation
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#666',
          margin: 0,
        }}>
          Learn about app terms and page functionality
        </p>
      </div>

      {/* Search Box */}
      <div style={{
        backgroundColor: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '24px',
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={20} style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#999'
          }} />
          <input
            type="text"
            placeholder="Search terms, pages, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              border: '2px solid #ddd',
              borderRadius: '6px',
              fontSize: '15px',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#2196f3'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#ddd'}
          />
        </div>
      </div>

      {/* Glossary Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '24px',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => toggleSection('glossary')}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: expandedSection === 'glossary' ? '#f5f5f5' : 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSection === 'glossary' ? '#f5f5f5' : 'white'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Book size={24} style={{ color: '#2196f3' }} />
            <div style={{ textAlign: 'left' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 4px 0',
              }}>
                Glossary of Terms
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0,
              }}>
                {filteredGlossary.length} term{filteredGlossary.length !== 1 ? 's' : ''} - Click to expand
              </p>
            </div>
          </div>
          {expandedSection === 'glossary' ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </button>

        {expandedSection === 'glossary' && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <div style={{
              display: 'grid',
              gap: '20px',
            }}>
              {filteredGlossary.map((item, index) => (
                <div key={index} style={{
                  padding: '16px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '6px',
                  borderLeft: '4px solid #2196f3',
                }}>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 'bold',
                    color: '#2196f3',
                    margin: '0 0 8px 0',
                  }}>
                    {item.term}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    margin: 0,
                    lineHeight: 1.6,
                  }}>
                    {item.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pages Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        <button
          onClick={() => toggleSection('pages')}
          style={{
            width: '100%',
            padding: '20px',
            backgroundColor: expandedSection === 'pages' ? '#f5f5f5' : 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = expandedSection === 'pages' ? '#f5f5f5' : 'white'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={24} style={{ color: '#4caf50' }} />
            <div style={{ textAlign: 'left' }}>
              <h2 style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: '#333',
                margin: '0 0 4px 0',
              }}>
                Page Guide
              </h2>
              <p style={{
                fontSize: '14px',
                color: '#666',
                margin: 0,
              }}>
                {filteredPages.length} page{filteredPages.length !== 1 ? 's' : ''} - Click to expand
              </p>
            </div>
          </div>
          {expandedSection === 'pages' ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
        </button>

        {expandedSection === 'pages' && (
          <div style={{
            padding: '20px',
            borderTop: '1px solid #e0e0e0',
          }}>
            <div style={{
              display: 'grid',
              gap: '24px',
            }}>
              {filteredPages.map((page, index) => (
                <div key={index} style={{
                  padding: '20px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                }}>
                  {/* Page Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '12px',
                  }}>
                    <div style={{
                      padding: '8px',
                      backgroundColor: 'white',
                      borderRadius: '6px',
                      display: 'flex',
                      color: '#4caf50',
                    }}>
                      {page.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#333',
                        margin: '0 0 4px 0',
                      }}>
                        {page.name}
                      </h3>
                      {page.accessLevel && (
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          backgroundColor: '#ff9800',
                          color: 'white',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          borderRadius: '3px',
                        }}>
                          {page.accessLevel}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Purpose */}
                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#666',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Purpose
                    </h4>
                    <p style={{
                      fontSize: '14px',
                      color: '#333',
                      margin: 0,
                      lineHeight: 1.6,
                    }}>
                      {page.purpose}
                    </p>
                  </div>

                  {/* Functionality */}
                  <div>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#666',
                      margin: '0 0 8px 0',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}>
                      Key Features
                    </h4>
                    <ul style={{
                      margin: 0,
                      paddingLeft: '20px',
                      color: '#333',
                    }}>
                      {page.functionality.map((feature, fIndex) => (
                        <li key={fIndex} style={{
                          fontSize: '14px',
                          lineHeight: 1.8,
                          marginBottom: '4px',
                        }}>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* No Results Message */}
      {searchQuery && filteredGlossary.length === 0 && filteredPages.length === 0 && (
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '8px',
          border: '1px solid #e0e0e0',
          textAlign: 'center',
          marginTop: '24px',
        }}>
          <Search size={48} style={{ color: '#ccc', marginBottom: '16px' }} />
          <h3 style={{
            fontSize: '18px',
            color: '#666',
            margin: '0 0 8px 0',
          }}>
            No results found
          </h3>
          <p style={{
            fontSize: '14px',
            color: '#999',
            margin: 0,
          }}>
            Try searching with different keywords
          </p>
        </div>
      )}
    </div>
  );
};

export default AppSupportPage;
