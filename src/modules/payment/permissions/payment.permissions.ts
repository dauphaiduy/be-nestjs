import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class PaymentPermissions {
  public static readonly PERMISSIONS = {
    PAYMENT_READ: 'payment:read',
    PAYMENT_READ_ALL: 'payment:read_all',
    PAYMENT_CHECKOUT: 'payment:checkout',
    PAYMENT_REFUND: 'payment:refund',
    PAYMENT_WEBHOOK: 'payment:webhook',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [PaymentPermissions.PERMISSIONS.PAYMENT_READ]: 'Read own payment transactions',
      [PaymentPermissions.PERMISSIONS.PAYMENT_READ_ALL]: 'Read all payment transactions',
      [PaymentPermissions.PERMISSIONS.PAYMENT_CHECKOUT]: 'Initiate payment checkout',
      [PaymentPermissions.PERMISSIONS.PAYMENT_REFUND]: 'Refund a payment',
      [PaymentPermissions.PERMISSIONS.PAYMENT_WEBHOOK]: 'Receive payment webhooks',
    };
  }
}
