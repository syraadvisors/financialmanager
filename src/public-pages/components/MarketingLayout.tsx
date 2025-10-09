import React, { useState } from 'react';
import MarketingHeader from './MarketingHeader';
import MarketingFooter from './MarketingFooter';
import LoginModal from './LoginModal';
import '../styles/marketing.css';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

const MarketingLayout: React.FC<MarketingLayoutProps> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <div className="marketing-page">
      <MarketingHeader onLoginClick={() => setShowLoginModal(true)} />
      <div className="marketing-content">
        {children}
      </div>
      <MarketingFooter />
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </div>
  );
};

export default MarketingLayout;
