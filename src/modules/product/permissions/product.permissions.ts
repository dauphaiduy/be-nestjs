import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class ProductPermissions {
  public static readonly PERMISSIONS = {
    PRODUCT_CREATE: 'product:create',
    PRODUCT_READ: 'product:read',
    PRODUCT_UPDATE: 'product:update',
    PRODUCT_DELETE: 'product:delete',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [ProductPermissions.PERMISSIONS.PRODUCT_CREATE]: 'Create product',
      [ProductPermissions.PERMISSIONS.PRODUCT_READ]: 'Read product',
      [ProductPermissions.PERMISSIONS.PRODUCT_UPDATE]: 'Update product',
      [ProductPermissions.PERMISSIONS.PRODUCT_DELETE]: 'Delete product',
    };
  }
}
