import React from 'react';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const CompliancePage: React.FC = () => {
  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>Compliance Information</h1>
        <p>
          Understanding fee-based billing compliance for financial advisors.
        </p>
      </div>

      <div className="content-section" style={{ maxWidth: '900px' }}>
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            1. Regulatory Framework
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Fee-based billing for financial advisors is regulated by multiple
            authorities to ensure transparency, fairness, and client protection:
          </p>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li><strong>SEC (Securities and Exchange Commission):</strong> Regulates
            investment advisers under the Investment Advisers Act of 1940</li>
            <li><strong>State Regulators:</strong> Some advisers are regulated at the
            state level depending on assets under management</li>
            <li><strong>FINRA (Financial Industry Regulatory Authority):</strong> For
            broker-dealers offering advisory services</li>
            <li><strong>DOL (Department of Labor):</strong> ERISA fiduciary rules for
            retirement accounts</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            2. Fee Disclosure & Transparency
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Advisers must provide clear, written disclosure of all fees and
            compensation arrangements:
          </p>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li>Fee structure and calculation methodology</li>
            <li>Billing frequency and payment terms</li>
            <li>Any third-party compensation or conflicts of interest</li>
            <li>Comparison of different service levels and associated costs</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            3. Permissible Fee Structures
          </h2>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li><strong>Assets Under Management (AUM):</strong> Most common, typically
            0.25% - 2% annually</li>
            <li><strong>Flat Fees:</strong> Fixed amount per client or household</li>
            <li><strong>Hourly Fees:</strong> Charged for specific services or
            consultations</li>
            <li><strong>Subscription/Retainer:</strong> Regular ongoing fee for
            continuous service</li>
            <li><strong>Performance-Based:</strong> Allowed only for qualified clients
            ($1M+ AUM or $2.1M+ net worth)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            4. Billing Practices & Requirements
          </h2>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li>Fees must be reasonable and not excessive</li>
            <li>Written authorization required for fee deductions from client accounts</li>
            <li>Quarterly billing statements showing fee calculations</li>
            <li>Advance billing limited to 6 months in most jurisdictions</li>
            <li>Pro-rata refunds required upon termination</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            5. Recordkeeping & Documentation
          </h2>
          <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
            Under SEC Rule 204-2, advisers must maintain:
          </p>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li>All fee agreements and amendments</li>
            <li>Detailed billing calculations and invoices</li>
            <li>Client authorizations for fee deductions</li>
            <li>Records for at least 5 years (2 years readily accessible)</li>
          </ul>
        </section>

        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            6. Best Practices for Compliance
          </h2>
          <ul style={{ color: 'var(--text-light)', paddingLeft: '2rem' }}>
            <li>Use automated billing systems with audit trails</li>
            <li>Regularly review fee schedules for competitiveness and fairness</li>
            <li>Provide clients with detailed fee reports</li>
            <li>Maintain comprehensive documentation of all fee arrangements</li>
            <li>Conduct annual compliance reviews</li>
            <li>Stay informed about regulatory changes</li>
          </ul>
        </section>

        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          padding: '2rem',
          borderRadius: '15px',
          marginTop: '3rem',
          textAlign: 'center'
        }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
            How FeeMGR Helps You Stay Compliant
          </h3>
          <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
            Our platform is designed with compliance in mind, featuring automated
            recordkeeping, detailed audit trails, and regulatory-compliant reporting.
          </p>
          <a href="#demo" className="button primary-button">
            Request a Demo
          </a>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default CompliancePage;
