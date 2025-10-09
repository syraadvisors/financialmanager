import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import '../styles/marketing.css';

interface MarketingHeaderProps {
  onLoginClick: () => void;
}

const MarketingHeader: React.FC<MarketingHeaderProps> = ({ onLoginClick }) => {
  const [user, setUser] = useState<any>(null);
  const [userInitials, setUserInitials] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);

        // Get user profile for initials
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('user_first_name, user_last_name')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          const initials =
            (profile.user_first_name?.[0] || '') +
            (profile.user_last_name?.[0] || '');
          setUserInitials(initials.toUpperCase());
        } else if (user.email) {
          setUserInitials(user.email[0].toUpperCase());
        }
      }
    };

    checkUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserCircleClick = () => {
    // Navigate to the app dashboard
    navigate('/app');
  };

  return (
    <nav className="marketing-nav">
      <Link to="/" className="logo-with-icon">
        <BarChart3 size={32} style={{ color: '#2196f3', flexShrink: 0 }} />
        <span className="logo">FeeMGR</span>
      </Link>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <ul className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <li><Link to="/features" onClick={() => setMobileMenuOpen(false)}>Features</Link></li>
        <li><Link to="/pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</Link></li>
        <li><Link to="/about" onClick={() => setMobileMenuOpen(false)}>About</Link></li>
        <li><Link to="/support" onClick={() => setMobileMenuOpen(false)}>Support</Link></li>
        <li><Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</Link></li>
        <li>
          {user ? (
            <span
              className="user-circle"
              onClick={() => { handleUserCircleClick(); setMobileMenuOpen(false); }}
              style={{ cursor: 'pointer' }}
              title="Go to Dashboard"
            >
              {userInitials}
            </span>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); onLoginClick(); setMobileMenuOpen(false); }}
              className="button primary-button"
              style={{
                padding: '0.5rem 1.5rem',
                fontSize: '0.95rem'
              }}
            >
              Login
            </button>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default MarketingHeader;
