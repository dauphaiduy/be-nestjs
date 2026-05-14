import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class CartPermissions {
  public static readonly PERMISSIONS = {
    CART_READ: 'cart:read',
    CART_WRITE: 'cart:write',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [CartPermissions.PERMISSIONS.CART_READ]: 'Read cart',
      [CartPermissions.PERMISSIONS.CART_WRITE]: 'Write cart',
    };
  }
}
