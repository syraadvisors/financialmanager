import React from 'react';
import { Link } from 'react-router-dom';
import MarketingLayout from '../components/MarketingLayout';
import '../styles/marketing.css';

const HomePage: React.FC = () => {
  return (
    <MarketingLayout>
      <section className="hero">
        <h1>Simplify Fee Management</h1>
        <p>
          The modern solution for financial advisors to streamline billing, automate
          workflows, and enhance client relationships.
        </p>
        <div className="cta-buttons">
          <Link to="/contact?subject=demo" className="button primary-button">
            Request Demo
          </Link>
          <Link to="/features" className="button secondary-button">
            Learn More
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="features-grid">
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3>Accurate, Timely Billing</h3>
            <p>
              Automate your fee calculations and billing cycles with intelligent
              processing.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
            <h3>Advisor Portal</h3>
            <p>
              Give advisors secure access to their fee reports, billing history, and
              documentation.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3>Compliance Ready</h3>
            <p>Built-in compliance tools to keep your practice audit-ready.</p>
            <Link to="/compliance">Read More</Link>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="content-section" style={{ background: 'white', padding: '5rem 2rem' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--primary)' }}>
          Why Choose FeeMGR?
        </h2>
        <div className="features-grid">
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏱️</div>
            <h3>Save 15+ Hours Per Month</h3>
            <p>
              Automate manual billing tasks and focus on what matters - serving your clients.
              Our customers save an average of 15 hours per month on billing administration.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3>99.9% Accuracy Rate</h3>
            <p>
              Eliminate billing errors with automated calculations. Our system ensures precise
              fee calculations every time, reducing disputes and improving client trust.
            </p>
          </div>
          <div className="feature-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3>Enterprise-Grade Security</h3>
            <p>
              Bank-level encryption and SOC 2 compliance keep your data safe. We handle
              sensitive financial data with the highest security standards.
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="content-section" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'var(--background)' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--primary)' }}>
          Trusted by Leading Advisory Firms
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>
              500+
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Active Firms
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>
              $50B+
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Assets Managed
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--text)' }}>
              4.8/5
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
              Customer Rating
            </div>
          </div>
        </div>
        <Link to="/pricing" className="button primary-button" style={{ fontSize: '1.1rem', padding: '1.2rem 2.5rem' }}>
          View Pricing Plans
        </Link>
      </section>
    </MarketingLayout>
  );
};

export default HomePage;
