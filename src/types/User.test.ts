import { roleHasPermission, ROLE_PERMISSIONS, UserRole, PermissionName } from './User';

describe('RBAC Functions', () => {
  describe('ROLE_PERMISSIONS', () => {
    it('should have permissions defined for all roles', () => {
      expect(ROLE_PERMISSIONS.admin).toBeDefined();
      expect(ROLE_PERMISSIONS.user).toBeDefined();
      expect(ROLE_PERMISSIONS.viewer).toBeDefined();
    });

    it('should have admin with most permissions', () => {
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(ROLE_PERMISSIONS.user.length);
      expect(ROLE_PERMISSIONS.admin.length).toBeGreaterThan(ROLE_PERMISSIONS.viewer.length);
    });

    it('should have viewer with least permissions', () => {
      expect(ROLE_PERMISSIONS.viewer.length).toBeLessThan(ROLE_PERMISSIONS.user.length);
      expect(ROLE_PERMISSIONS.viewer.length).toBeLessThan(ROLE_PERMISSIONS.admin.length);
    });

    describe('Admin permissions', () => {
      it('should have all CRUD permissions for clients', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('clients.view');
        expect(ROLE_PERMISSIONS.admin).toContain('clients.create');
        expect(ROLE_PERMISSIONS.admin).toContain('clients.update');
        expect(ROLE_PERMISSIONS.admin).toContain('clients.delete');
      });

      it('should have all CRUD permissions for accounts', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('accounts.view');
        expect(ROLE_PERMISSIONS.admin).toContain('accounts.create');
        expect(ROLE_PERMISSIONS.admin).toContain('accounts.update');
        expect(ROLE_PERMISSIONS.admin).toContain('accounts.delete');
      });

      it('should have all CRUD permissions for fees', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('fees.view');
        expect(ROLE_PERMISSIONS.admin).toContain('fees.create');
        expect(ROLE_PERMISSIONS.admin).toContain('fees.update');
        expect(ROLE_PERMISSIONS.admin).toContain('fees.delete');
        expect(ROLE_PERMISSIONS.admin).toContain('fees.calculate');
      });

      it('should have user management permissions', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('users.view');
        expect(ROLE_PERMISSIONS.admin).toContain('users.create');
        expect(ROLE_PERMISSIONS.admin).toContain('users.update');
        expect(ROLE_PERMISSIONS.admin).toContain('users.delete');
      });

      it('should have settings permissions', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('settings.view');
        expect(ROLE_PERMISSIONS.admin).toContain('settings.update');
      });

      it('should have import permissions', () => {
        expect(ROLE_PERMISSIONS.admin).toContain('import.upload');
        expect(ROLE_PERMISSIONS.admin).toContain('import.process');
      });
    });

    describe('User permissions', () => {
      it('should have view and create permissions for clients', () => {
        expect(ROLE_PERMISSIONS.user).toContain('clients.view');
        expect(ROLE_PERMISSIONS.user).toContain('clients.create');
        expect(ROLE_PERMISSIONS.user).toContain('clients.update');
      });

      it('should NOT have delete permissions for clients', () => {
        expect(ROLE_PERMISSIONS.user).not.toContain('clients.delete');
      });

      it('should have view and create permissions for accounts', () => {
        expect(ROLE_PERMISSIONS.user).toContain('accounts.view');
        expect(ROLE_PERMISSIONS.user).toContain('accounts.create');
        expect(ROLE_PERMISSIONS.user).toContain('accounts.update');
      });

      it('should NOT have delete permissions for accounts', () => {
        expect(ROLE_PERMISSIONS.user).not.toContain('accounts.delete');
      });

      it('should have fee management permissions', () => {
        expect(ROLE_PERMISSIONS.user).toContain('fees.view');
        expect(ROLE_PERMISSIONS.user).toContain('fees.create');
        expect(ROLE_PERMISSIONS.user).toContain('fees.update');
        expect(ROLE_PERMISSIONS.user).toContain('fees.calculate');
      });

      it('should NOT have user management permissions', () => {
        expect(ROLE_PERMISSIONS.user).not.toContain('users.view');
        expect(ROLE_PERMISSIONS.user).not.toContain('users.create');
        expect(ROLE_PERMISSIONS.user).not.toContain('users.update');
        expect(ROLE_PERMISSIONS.user).not.toContain('users.delete');
      });

      it('should NOT have settings permissions', () => {
        expect(ROLE_PERMISSIONS.user).not.toContain('settings.view');
        expect(ROLE_PERMISSIONS.user).not.toContain('settings.update');
      });

      it('should have import permissions', () => {
        expect(ROLE_PERMISSIONS.user).toContain('import.upload');
        expect(ROLE_PERMISSIONS.user).toContain('import.process');
      });
    });

    describe('Viewer permissions', () => {
      it('should have only view permissions for clients', () => {
        expect(ROLE_PERMISSIONS.viewer).toContain('clients.view');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('clients.create');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('clients.update');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('clients.delete');
      });

      it('should have only view permissions for accounts', () => {
        expect(ROLE_PERMISSIONS.viewer).toContain('accounts.view');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('accounts.create');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('accounts.update');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('accounts.delete');
      });

      it('should have only view permissions for fees', () => {
        expect(ROLE_PERMISSIONS.viewer).toContain('fees.view');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('fees.create');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('fees.update');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('fees.delete');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('fees.calculate');
      });

      it('should NOT have any user management permissions', () => {
        expect(ROLE_PERMISSIONS.viewer).not.toContain('users.view');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('users.create');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('users.update');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('users.delete');
      });

      it('should NOT have settings permissions', () => {
        expect(ROLE_PERMISSIONS.viewer).not.toContain('settings.view');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('settings.update');
      });

      it('should NOT have import permissions', () => {
        expect(ROLE_PERMISSIONS.viewer).not.toContain('import.upload');
        expect(ROLE_PERMISSIONS.viewer).not.toContain('import.process');
      });
    });
  });

  describe('roleHasPermission', () => {
    describe('Admin role', () => {
      const role: UserRole = 'admin';

      it('should return true for all client permissions', () => {
        expect(roleHasPermission(role, 'clients.view')).toBe(true);
        expect(roleHasPermission(role, 'clients.create')).toBe(true);
        expect(roleHasPermission(role, 'clients.update')).toBe(true);
        expect(roleHasPermission(role, 'clients.delete')).toBe(true);
      });

      it('should return true for all account permissions', () => {
        expect(roleHasPermission(role, 'accounts.view')).toBe(true);
        expect(roleHasPermission(role, 'accounts.create')).toBe(true);
        expect(roleHasPermission(role, 'accounts.update')).toBe(true);
        expect(roleHasPermission(role, 'accounts.delete')).toBe(true);
      });

      it('should return true for all fee permissions', () => {
        expect(roleHasPermission(role, 'fees.view')).toBe(true);
        expect(roleHasPermission(role, 'fees.create')).toBe(true);
        expect(roleHasPermission(role, 'fees.update')).toBe(true);
        expect(roleHasPermission(role, 'fees.delete')).toBe(true);
        expect(roleHasPermission(role, 'fees.calculate')).toBe(true);
      });

      it('should return true for user management permissions', () => {
        expect(roleHasPermission(role, 'users.view')).toBe(true);
        expect(roleHasPermission(role, 'users.create')).toBe(true);
        expect(roleHasPermission(role, 'users.update')).toBe(true);
        expect(roleHasPermission(role, 'users.delete')).toBe(true);
      });

      it('should return true for settings permissions', () => {
        expect(roleHasPermission(role, 'settings.view')).toBe(true);
        expect(roleHasPermission(role, 'settings.update')).toBe(true);
      });

      it('should return true for import permissions', () => {
        expect(roleHasPermission(role, 'import.upload')).toBe(true);
        expect(roleHasPermission(role, 'import.process')).toBe(true);
      });
    });

    describe('User role', () => {
      const role: UserRole = 'user';

      it('should return true for view and create client permissions', () => {
        expect(roleHasPermission(role, 'clients.view')).toBe(true);
        expect(roleHasPermission(role, 'clients.create')).toBe(true);
        expect(roleHasPermission(role, 'clients.update')).toBe(true);
      });

      it('should return false for delete client permission', () => {
        expect(roleHasPermission(role, 'clients.delete')).toBe(false);
      });

      it('should return false for user management permissions', () => {
        expect(roleHasPermission(role, 'users.view')).toBe(false);
        expect(roleHasPermission(role, 'users.create')).toBe(false);
        expect(roleHasPermission(role, 'users.update')).toBe(false);
        expect(roleHasPermission(role, 'users.delete')).toBe(false);
      });

      it('should return false for settings permissions', () => {
        expect(roleHasPermission(role, 'settings.view')).toBe(false);
        expect(roleHasPermission(role, 'settings.update')).toBe(false);
      });

      it('should return true for import permissions', () => {
        expect(roleHasPermission(role, 'import.upload')).toBe(true);
        expect(roleHasPermission(role, 'import.process')).toBe(true);
      });
    });

    describe('Viewer role', () => {
      const role: UserRole = 'viewer';

      it('should return true only for view permissions', () => {
        expect(roleHasPermission(role, 'clients.view')).toBe(true);
        expect(roleHasPermission(role, 'accounts.view')).toBe(true);
        expect(roleHasPermission(role, 'fees.view')).toBe(true);
      });

      it('should return false for all create permissions', () => {
        expect(roleHasPermission(role, 'clients.create')).toBe(false);
        expect(roleHasPermission(role, 'accounts.create')).toBe(false);
        expect(roleHasPermission(role, 'fees.create')).toBe(false);
      });

      it('should return false for all update permissions', () => {
        expect(roleHasPermission(role, 'clients.update')).toBe(false);
        expect(roleHasPermission(role, 'accounts.update')).toBe(false);
        expect(roleHasPermission(role, 'fees.update')).toBe(false);
      });

      it('should return false for all delete permissions', () => {
        expect(roleHasPermission(role, 'clients.delete')).toBe(false);
        expect(roleHasPermission(role, 'accounts.delete')).toBe(false);
        expect(roleHasPermission(role, 'fees.delete')).toBe(false);
      });

      it('should return false for user management', () => {
        expect(roleHasPermission(role, 'users.view')).toBe(false);
        expect(roleHasPermission(role, 'users.create')).toBe(false);
      });

      it('should return false for settings', () => {
        expect(roleHasPermission(role, 'settings.view')).toBe(false);
        expect(roleHasPermission(role, 'settings.update')).toBe(false);
      });

      it('should return false for import permissions', () => {
        expect(roleHasPermission(role, 'import.upload')).toBe(false);
        expect(roleHasPermission(role, 'import.process')).toBe(false);
      });
    });

    describe('Edge cases', () => {
      it('should handle invalid permission names gracefully', () => {
        expect(roleHasPermission('admin', 'invalid.permission' as PermissionName)).toBe(false);
        expect(roleHasPermission('user', 'invalid.permission' as PermissionName)).toBe(false);
        expect(roleHasPermission('viewer', 'invalid.permission' as PermissionName)).toBe(false);
      });

      it('should be case-sensitive for permissions', () => {
        expect(roleHasPermission('admin', 'CLIENTS.VIEW' as PermissionName)).toBe(false);
        expect(roleHasPermission('admin', 'Clients.View' as PermissionName)).toBe(false);
      });
    });
  });

  describe('Permission hierarchy', () => {
    it('should have admin permissions be a superset of user permissions', () => {
      const userPerms = new Set(ROLE_PERMISSIONS.user);
      const adminPerms = new Set(ROLE_PERMISSIONS.admin);

      userPerms.forEach(perm => {
        expect(adminPerms.has(perm)).toBe(true);
      });
    });

    it('should have user permissions be a superset of viewer permissions', () => {
      const viewerPerms = new Set(ROLE_PERMISSIONS.viewer);
      const userPerms = new Set(ROLE_PERMISSIONS.user);

      viewerPerms.forEach(perm => {
        expect(userPerms.has(perm)).toBe(true);
      });
    });
  });
});
