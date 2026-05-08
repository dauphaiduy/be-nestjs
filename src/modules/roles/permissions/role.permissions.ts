import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class RolePermissions {
  public static readonly PERMISSIONS = {
    ROLE_CREATE: 'role:create',
    ROLE_READ: 'role:read',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [RolePermissions.PERMISSIONS.ROLE_CREATE]: 'Create role',
      [RolePermissions.PERMISSIONS.ROLE_READ]: 'Read role',
      [RolePermissions.PERMISSIONS.ROLE_UPDATE]: 'Update role',
      [RolePermissions.PERMISSIONS.ROLE_DELETE]: 'Delete role',
    };
  }
}
