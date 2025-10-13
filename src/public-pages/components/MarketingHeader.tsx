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
      console.log('[MarketingHeader] checkUser - user:', user);

      if (user) {
        setUser(user);

        console.log('[MarketingHeader] Querying user_profiles for user.id:', user.id);

        // Get user profile for initials
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('full_name, first_name, last_name, user_first_name, user_last_name')
          .eq('id', user.id)
          .single();

        console.log('[MarketingHeader] Profile data:', profile);
        console.log('[MarketingHeader] Profile error:', profileError);
        console.log('[MarketingHeader] User email fallback:', user.email);

        if (profile) {
          // Try different column name combinations
          const firstName = profile.first_name || profile.user_first_name;
          const lastName = profile.last_name || profile.user_last_name;

          console.log('[MarketingHeader] firstName:', firstName, 'lastName:', lastName);

          if (firstName || lastName) {
            const initials = (firstName?.[0] || '') + (lastName?.[0] || '');
            console.log('[MarketingHeader] Setting initials from name:', initials);
            setUserInitials(initials.toUpperCase());
          } else if (profile.full_name) {
            // Try to extract from full_name
            const nameParts = profile.full_name.split(' ');
            const initials = (nameParts[0]?.[0] || '') + (nameParts[nameParts.length - 1]?.[0] || '');
            console.log('[MarketingHeader] Setting initials from full_name:', initials);
            setUserInitials(initials.toUpperCase());
          } else {
            // No name in profile, use email
            console.log('[MarketingHeader] No name in profile, using email');
            if (user.email) {
              setUserInitials(user.email[0].toUpperCase());
            }
          }
        } else {
          // Profile query failed or returned null, use email fallback
          console.log('[MarketingHeader] Profile is null or error, using email fallback');
          if (user.email) {
            setUserInitials(user.email[0].toUpperCase());
          }
        }
      } else {
        // Clear user state when no user is logged in
        setUser(null);
        setUserInitials('');
      }
    };

    checkUser();

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        // Fetch profile for initials when user logs in
        supabase
          .from('user_profiles')
          .select('full_name, first_name, last_name, user_first_name, user_last_name')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              const firstName = profile.first_name || profile.user_first_name;
              const lastName = profile.last_name || profile.user_last_name;

              if (firstName || lastName) {
                const initials = (firstName?.[0] || '') + (lastName?.[0] || '');
                setUserInitials(initials.toUpperCase());
              } else if (profile.full_name) {
                const nameParts = profile.full_name.split(' ');
                const initials = (nameParts[0]?.[0] || '') + (nameParts[nameParts.length - 1]?.[0] || '');
                setUserInitials(initials.toUpperCase());
              } else if (session.user.email) {
                setUserInitials(session.user.email[0].toUpperCase());
              }
            } else if (session.user.email) {
              setUserInitials(session.user.email[0].toUpperCase());
            }
          });
      } else {
        // User logged out - clear state immediately
        setUser(null);
        setUserInitials('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUserCircleClick = () => {
    // Navigate to the app dashboard
    navigate('/app');
  };

  // Debug logging
  console.log('[MarketingHeader] user:', user);
  console.log('[MarketingHeader] userInitials:', userInitials);

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
