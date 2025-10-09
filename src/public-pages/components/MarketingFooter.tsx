import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/marketing.css';

const MarketingFooter: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="marketing-footer-redesign">
      <div className="footer-content">
        {/* Logo and Description */}
        <div className="footer-section footer-brand">
          <Link to="/" className="footer-logo-link">
            <span className="footer-logo-text">FeeMGR</span>
          </Link>
          <p className="footer-tagline">
            Modern fee management for financial advisors
          </p>
        </div>

        {/* Company Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Company</h4>
          <ul className="footer-list">
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
          </ul>
        </div>

        {/* Product Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Product</h4>
          <ul className="footer-list">
            <li><Link to="/features">Features</Link></li>
            <li><Link to="/compliance">Compliance</Link></li>
            <li><Link to="/support">Support</Link></li>
          </ul>
        </div>

        {/* Legal Links */}
        <div className="footer-section">
          <h4 className="footer-heading">Legal</h4>
          <ul className="footer-list">
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4 className="footer-heading">Contact</h4>
          <ul className="footer-list">
            <li><a href="mailto:support@feemgr.com">support@feemgr.com</a></li>
            <li><a href="tel:+11234567890">(123) 456-7890</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom-bar">
        <p>&copy; 2025 FeeMGR. All rights reserved.</p>
        <button onClick={scrollToTop} className="back-to-top">
          Back to Top ↑
        </button>
      </div>
    </footer>
  );
};

export default MarketingFooter;
