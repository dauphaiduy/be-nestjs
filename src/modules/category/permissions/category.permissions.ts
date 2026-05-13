import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class CategoryPermissions {
  public static readonly PERMISSIONS = {
    CATEGORY_CREATE: 'category:create',
    CATEGORY_READ: 'category:read',
    CATEGORY_UPDATE: 'category:update',
    CATEGORY_DELETE: 'category:delete',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [CategoryPermissions.PERMISSIONS.CATEGORY_CREATE]: 'Create category',
      [CategoryPermissions.PERMISSIONS.CATEGORY_READ]: 'Read category',
      [CategoryPermissions.PERMISSIONS.CATEGORY_UPDATE]: 'Update category',
      [CategoryPermissions.PERMISSIONS.CATEGORY_DELETE]: 'Delete category',
    };
  }
}
