import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class UserPermissions {
  public static readonly PERMISSIONS = {
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [UserPermissions.PERMISSIONS.USER_CREATE]: 'Create user',
      [UserPermissions.PERMISSIONS.USER_READ]: 'Read user',
      [UserPermissions.PERMISSIONS.USER_UPDATE]: 'Update user',
      [UserPermissions.PERMISSIONS.USER_DELETE]: 'Delete user',
    };
  }
}
