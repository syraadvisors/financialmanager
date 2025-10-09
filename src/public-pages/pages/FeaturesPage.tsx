import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const FeaturesPage: React.FC = () => {
  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>Powerful Features for Financial Advisors</h1>
        <p>
          Discover how FeeMGR helps you automate billing, stay compliant, and enhance
          client relationships.
        </p>
      </div>

      <div className="content-section">
        <div className="features-grid">
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3>Automated Fee Billing</h3>
            <p>
              Streamline your billing process with automated fee calculations based on
              customizable schedules. Our intelligent system handles complex fee
              structures, tiered pricing, and billing cycles, ensuring accuracy and
              efficiency.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3>Secure Advisor Portal</h3>
            <p>
              Provide your advisors with a dedicated portal where they can access fee
              reports, billing history, client documentation, and performance metrics.
              Role-based access ensures data security and privacy.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3>Regulatory Compliance</h3>
            <p>
              Stay ahead of regulatory requirements with built-in compliance tools.
              Our platform is designed to meet SEC, FINRA, and state regulations,
              with automated audit trails and reporting.
            </p>
            <Link to="/compliance">Learn about compliance</Link>
          </div>

          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚙️</div>
            <h3>Customizable Fee Structures</h3>
            <p>
              Create and manage multiple fee schedules tailored to your business
              model. Support for AUM-based fees, flat fees, hourly billing,
              subscription models, and performance-based compensation.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔗</div>
            <h3>Custodian & CRM Integrations</h3>
            <p>
              Seamlessly integrate with major custodians (Schwab, Fidelity, TD
              Ameritrade) and CRM platforms (Salesforce, Redtail, Wealthbox). Import
              account data, sync positions, and streamline your workflow.
            </p>
          </div>

          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3>Client Transparency</h3>
            <p>
              Build trust with clear, detailed fee disclosures. Generate
              client-friendly reports that explain fee calculations, show billing
              history, and provide full transparency into costs.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default FeaturesPage;
