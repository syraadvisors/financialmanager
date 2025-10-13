import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { usersService } from '../services/api/users.service';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [isInitialized, setIsInitialized] = useState(false);

  // Load theme from user preferences on mount
  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const response = await usersService.getCurrentUserProfile();

        if (response.data?.preferences?.theme) {
          const userTheme = response.data.preferences.theme as Theme;
          setThemeState(userTheme);
          applyTheme(userTheme);
        } else {
          // Check for system preference or localStorage as fallback
          const savedTheme = localStorage.getItem('theme') as Theme;
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

          setThemeState(initialTheme);
          applyTheme(initialTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
        // Fallback to system preference or localStorage
        const savedTheme = localStorage.getItem('theme') as Theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const fallbackTheme = savedTheme || (prefersDark ? 'dark' : 'light');

        setThemeState(fallbackTheme);
        applyTheme(fallbackTheme);
      } finally {
        setIsInitialized(true);
      }
    };

    loadUserTheme();
  }, []);

  // Apply theme to DOM
  const applyTheme = (newTheme: Theme) => {
    console.log('[ThemeContext] Applying theme:', newTheme);
    const root = document.documentElement;

    // Remove both classes first
    root.classList.remove('light-theme', 'dark-theme');

    // Add the new theme class
    root.classList.add(`${newTheme}-theme`);

    console.log('[ThemeContext] HTML classes after apply:', root.className);
    console.log('[ThemeContext] CSS variables:', {
      bgPrimary: getComputedStyle(root).getPropertyValue('--bg-primary'),
      textPrimary: getComputedStyle(root).getPropertyValue('--text-primary'),
    });

    // Store in localStorage for persistence
    localStorage.setItem('theme', newTheme);

    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1a1a1a' : '#ffffff');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Don't render children until theme is initialized to prevent flash
  if (!isInitialized) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: theme === 'dark' ? '#1a1a1a' : '#ffffff'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#2196f3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
