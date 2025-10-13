import { usersService } from './users.service';
import { supabase } from '../../lib/supabase';
import { UserRole, UserStatus } from '../../types/User';

// Mock Supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(),
    },
  },
}));

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllInFirm', () => {
    it('should return all users in a firm', async () => {
      const mockUsers = [
        {
          id: 'user1',
          firm_id: 'firm1',
          email: 'user1@test.com',
          full_name: 'User One',
          role: 'admin',
          status: 'active',
        },
        {
          id: 'user2',
          firm_id: 'firm1',
          email: 'user2@test.com',
          full_name: 'User Two',
          role: 'user',
          status: 'active',
        },
      ];

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: mockUsers,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.getAllInFirm('firm1');

      expect(result.data).toHaveLength(2);
      expect(result.error).toBeNull();
      expect(mockFrom).toHaveBeenCalledWith('user_profiles');
    });

    it('should handle errors', async () => {
      const mockError = { message: 'Database error' };

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: null,
              error: mockError,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.getAllInFirm('firm1');

      expect(result.data).toBeNull();
      expect(result.error).toBe('Database error');
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        email: 'user1@test.com',
        role: 'admin' as UserRole,
      };

      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.updateUserRole('user1', 'admin');

      expect(result.error).toBeNull();
    });
  });

  describe('updateUserStatus', () => {
    it('should update user status successfully', async () => {
      const mockUpdatedUser = {
        id: 'user1',
        email: 'user1@test.com',
        status: 'suspended' as UserStatus,
      };

      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.updateUserStatus('user1', 'suspended');

      expect(result.error).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const profileData = {
        fullName: 'Updated Name',
        jobTitle: 'Senior Developer',
      };

      const mockUpdatedUser = {
        id: 'user1',
        full_name: 'Updated Name',
        job_title: 'Senior Developer',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedUser,
                error: null,
              }),
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.updateProfile(profileData);

      expect(result.error).toBeNull();
    });
  });

  describe('getCurrentUserProfile', () => {
    it('should return current user profile', async () => {
      const mockUser = { id: 'user1' };
      const mockProfile = {
        id: 'user1',
        email: 'user1@test.com',
        full_name: 'User One',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockProfile,
              error: null,
            }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const result = await usersService.getCurrentUserProfile();

      expect(result.error).toBeNull();
    });

    it('should handle no authenticated user', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await usersService.getCurrentUserProfile();

      expect(result.data).toBeNull();
      expect(result.error).toBe('Not authenticated');
    });
  });

  describe('removeAvatar', () => {
    it('should remove avatar successfully', async () => {
      const mockUser = {
        id: 'user1',
        avatar_url: 'old-avatar.jpg',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user1' } },
        error: null,
      });

      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null,
            }),
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const mockStorage = {
        remove: jest.fn().mockResolvedValue({ error: null }),
      };

      (supabase.storage.from as jest.Mock).mockReturnValue(mockStorage);

      const result = await usersService.removeAvatar();

      expect(result.data).toBeDefined();
      expect(result.error).toBeNull();
    });
  });
});
