import React from 'react';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const PricingPage: React.FC = () => {
  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>Simple, Transparent Pricing</h1>
        <p>Choose the plan that fits your firm's needs. No hidden fees.</p>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card">
          <h3 className="plan-name">Standard</h3>
          <div className="plan-price">
            $199<small>/month</small>
          </div>
          <p>Perfect for small firms</p>
          <ul className="feature-list">
            <li>Up to 150 accounts</li>
            <li>Automated fee billing</li>
            <li>Basic reporting</li>
            <li>Email support</li>
            <li>1 user license</li>
            <li>Monthly billing</li>
          </ul>
          <button className="button primary-button" style={{ width: '100%' }}>
            Get Started
          </button>
        </div>

        <div className="pricing-card featured">
          <h3 className="plan-name">Professional</h3>
          <div className="plan-price">
            $549<small>/month</small>
          </div>
          <p>For growing advisory firms</p>
          <ul className="feature-list">
            <li>Up to 500 accounts</li>
            <li>Advanced fee structures</li>
            <li>Custodian integrations</li>
            <li>Priority support</li>
            <li>5 user licenses</li>
            <li>Custom reporting</li>
            <li>API access</li>
          </ul>
          <button className="button primary-button" style={{ width: '100%' }}>
            Get Started
          </button>
        </div>

        <div className="pricing-card">
          <h3 className="plan-name">Enterprise</h3>
          <div className="plan-price">
            Custom<small></small>
          </div>
          <p>For large enterprises</p>
          <ul className="feature-list">
            <li>Unlimited accounts</li>
            <li>White-label options</li>
            <li>Dedicated support</li>
            <li>Custom integrations</li>
            <li>Unlimited users</li>
            <li>SLA guarantees</li>
            <li>On-premise deployment</li>
          </ul>
          <button className="button secondary-button" style={{ width: '100%' }}>
            Contact Sales
          </button>
        </div>
      </div>

      <div className="content-section" style={{ marginTop: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>
          What Our Clients Say
        </h2>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '15px',
            marginBottom: '1rem',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
              "FeeMGR has transformed how we manage billing. The automation saves us
              hours every week, and our clients appreciate the transparency."
            </p>
            <strong style={{ color: 'var(--primary)' }}>
              - Jane Smith, CFP, ABC Financial Advisors
            </strong>
          </div>
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
          }}>
            <p style={{ marginBottom: '1rem', color: 'var(--text)' }}>
              "The compliance features give us peace of mind. We know we're meeting all
              regulatory requirements, and the audit trail is incredibly detailed."
            </p>
            <strong style={{ color: 'var(--primary)' }}>
              - Michael Brown, Principal, XYZ Wealth Management
            </strong>
          </div>
        </div>
      </div>

      <div className="content-section" style={{ marginTop: '4rem', marginBottom: '4rem' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--primary)' }}>
          Frequently Asked Questions
        </h2>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            marginBottom: '1rem',
            padding: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>
              Can I switch plans later?
            </h3>
            <p style={{ color: 'var(--text-light)' }}>
              Yes, you can upgrade or downgrade your plan at any time. Changes take
              effect at the start of your next billing cycle.
            </p>
          </div>
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            marginBottom: '1rem',
            padding: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>
              Is there a setup fee?
            </h3>
            <p style={{ color: 'var(--text-light)' }}>
              No setup fees for Standard and Professional plans. Enterprise plans may
              include a one-time implementation fee depending on customization
              requirements.
            </p>
          </div>
          <div style={{
            background: 'white',
            border: '1px solid var(--border)',
            borderRadius: '10px',
            padding: '1.5rem'
          }}>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>
              What payment methods do you accept?
            </h3>
            <p style={{ color: 'var(--text-light)' }}>
              We accept all major credit cards, ACH transfers, and wire transfers for
              Enterprise plans.
            </p>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default PricingPage;
