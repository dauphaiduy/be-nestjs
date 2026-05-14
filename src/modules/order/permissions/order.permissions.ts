import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class OrderPermissions {
  public static readonly PERMISSIONS = {
    ORDER_READ: 'order:read',
    ORDER_READ_ALL: 'order:read_all',
    ORDER_UPDATE_STATUS: 'order:update_status',
    ORDER_CANCEL: 'order:cancel',
    ORDER_REFUND: 'order:refund',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [OrderPermissions.PERMISSIONS.ORDER_READ]: 'Read own orders',
      [OrderPermissions.PERMISSIONS.ORDER_READ_ALL]: 'Read all orders',
      [OrderPermissions.PERMISSIONS.ORDER_UPDATE_STATUS]: 'Update order status',
      [OrderPermissions.PERMISSIONS.ORDER_CANCEL]: 'Cancel order',
      [OrderPermissions.PERMISSIONS.ORDER_REFUND]: 'Refund order',
    };
  }
}
