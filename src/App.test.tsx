import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock all contexts and providers that App depends on
jest.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    userProfile: null,
    loading: false,
    signOut: jest.fn(),
    hasPermission: jest.fn(() => false),
    refreshProfile: jest.fn(),
  }),
}));

jest.mock('./contexts/FirmContext', () => ({
  FirmProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFirm: () => ({
    firm: null,
    loading: false,
    error: null,
    refreshFirm: jest.fn(),
  }),
}));

jest.mock('./contexts/SearchContext', () => ({
  SearchProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./contexts/AppContext', () => ({
  AppProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('./contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  Toaster: () => null,
}));

describe('App', () => {
  it('renders without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
