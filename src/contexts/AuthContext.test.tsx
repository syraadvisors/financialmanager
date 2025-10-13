import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { UserProfile, UserRole } from '../types/User';

// Mock Supabase
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Mock usersService
jest.mock('../services/api/users.service', () => ({
  usersService: {
    getCurrentUserProfile: jest.fn(),
  },
}));

import { usersService } from '../services/api/users.service';

describe('AuthContext', () => {
  const mockUserProfile: UserProfile = {
    id: 'user1',
    firmId: 'firm1',
    email: 'test@example.com',
    fullName: 'Test User',
    avatarUrl: null,
    jobTitle: 'Developer',
    department: 'Engineering',
    phoneNumber: null,
    bio: null,
    role: 'admin',
    status: 'active',
    preferences: {
      theme: 'light',
      notificationsEnabled: true,
      emailNotifications: true,
      language: 'en',
      timezone: 'UTC',
      rememberMe: false,
    },
    lastLoginAt: new Date(),
    loginCount: 5,
    mfaEnabled: false,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth state change
    (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should provide auth context when used within AuthProvider', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('userProfile');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('signOut');
      expect(result.current).toHaveProperty('hasPermission');
      expect(result.current).toHaveProperty('refreshProfile');
    });
  });

  describe('hasPermission function', () => {
    it('should correctly check admin permissions', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: { ...mockUserProfile, role: 'admin' },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('users.view')).toBe(true);
      expect(result.current.hasPermission('users.create')).toBe(true);
      expect(result.current.hasPermission('users.delete')).toBe(true);
      expect(result.current.hasPermission('settings.update')).toBe(true);
    });

    it('should correctly check user permissions', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: { ...mockUserProfile, role: 'user' },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('clients.view')).toBe(true);
      expect(result.current.hasPermission('clients.create')).toBe(true);
      expect(result.current.hasPermission('users.view')).toBe(false);
      expect(result.current.hasPermission('settings.update')).toBe(false);
    });

    it('should correctly check viewer permissions', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: { ...mockUserProfile, role: 'viewer' },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('clients.view')).toBe(true);
      expect(result.current.hasPermission('clients.create')).toBe(false);
      expect(result.current.hasPermission('clients.update')).toBe(false);
      expect(result.current.hasPermission('users.view')).toBe(false);
    });

    it('should return false for all permissions when no user profile', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission('clients.view')).toBe(false);
      expect(result.current.hasPermission('users.view')).toBe(false);
    });
  });

  describe('signOut function', () => {
    it('should call supabase signOut', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: mockUserProfile,
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('refreshProfile function', () => {
    it('should refresh user profile data', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const initialProfile = { ...mockUserProfile, fullName: 'Initial Name' };
      const updatedProfile = { ...mockUserProfile, fullName: 'Updated Name' };

      (usersService.getCurrentUserProfile as jest.Mock)
        .mockResolvedValueOnce({ data: initialProfile, error: null })
        .mockResolvedValueOnce({ data: updatedProfile, error: null });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.userProfile?.fullName).toBe('Initial Name');

      await result.current.refreshProfile();

      await waitFor(() => {
        expect(result.current.userProfile?.fullName).toBe('Updated Name');
      });
    });
  });

  describe('Loading states', () => {
    it('should start with loading true', () => {
      (supabase.auth.getSession as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.loading).toBe(true);
    });

    it('should set loading to false after session check', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should handle session fetch errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Session error' },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.userProfile).toBeNull();
    });

    it('should handle user profile fetch errors', async () => {
      const mockSession = {
        user: { id: 'user1', email: 'test@example.com' },
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      (usersService.getCurrentUserProfile as jest.Mock).mockResolvedValue({
        data: null,
        error: 'Profile not found',
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <AuthProvider>{children}</AuthProvider>
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeTruthy();
      expect(result.current.userProfile).toBeNull();
    });
  });
});
