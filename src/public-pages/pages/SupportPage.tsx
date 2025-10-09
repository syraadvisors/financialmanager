import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const SupportPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <MarketingLayout>
      <div className="page-header">
        <h1>How Can We Help?</h1>
        <p>Find answers to your questions or reach out to our support team.</p>
      </div>

      <div className="content-section">
        <div style={{ maxWidth: '800px', margin: '0 auto 3rem', padding: '0 1rem' }}>
          <input
            type="search"
            className="form-group input"
            placeholder="Search for help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '1rem 1.5rem',
              border: '2px solid var(--border)',
              borderRadius: '30px',
              fontSize: '1.1rem',
            }}
          />
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <h3>Getting Started</h3>
            <ul style={{ listStyle: 'none', textAlign: 'left', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  How to create an account
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Setting up your first billing cycle
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Importing client data
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Connecting custodian accounts
                </a>
              </li>
              <li>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Navigating the dashboard
                </a>
              </li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Billing & Fees</h3>
            <ul style={{ listStyle: 'none', textAlign: 'left', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Creating fee schedules
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Calculating fees automatically
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Generating invoices
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Handling fee adjustments
                </a>
              </li>
              <li>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Understanding billing reports
                </a>
              </li>
            </ul>
          </div>

          <div className="feature-card">
            <h3>Account Management</h3>
            <ul style={{ listStyle: 'none', textAlign: 'left', padding: 0 }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Managing user permissions
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Updating account information
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Changing your subscription plan
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Security best practices
                </a>
              </li>
              <li>
                <a href="#" style={{ color: 'var(--text)', textDecoration: 'none' }}>
                  Canceling your account
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%)',
          padding: '3rem 2rem',
          textAlign: 'center',
          marginTop: '4rem',
          borderRadius: '20px'
        }}>
          <h2 style={{ marginBottom: '2rem', color: 'var(--primary)' }}>
            Still Need Help?
          </h2>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap'
          }}>
            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '15px',
              minWidth: '250px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Email Support
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                Get help via email
              </p>
              <a
                href="mailto:support@feemgr.com"
                className="button primary-button"
                style={{ textDecoration: 'none' }}
              >
                Email Us
              </a>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '15px',
              minWidth: '250px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Live Chat
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                Chat with our team
              </p>
              <button className="button primary-button">Start Chat</button>
            </div>

            <div style={{
              background: 'white',
              padding: '2rem',
              borderRadius: '15px',
              minWidth: '250px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                Schedule a Call
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1rem' }}>
                Talk to an expert
              </p>
              <button className="button primary-button">Book Now</button>
            </div>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
};

export default SupportPage;
