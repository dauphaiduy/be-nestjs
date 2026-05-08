import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class AuditLogPermissions {
  public static readonly PERMISSIONS = {
    AUDIT_LOG_READ: 'audit-log:read',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [AuditLogPermissions.PERMISSIONS.AUDIT_LOG_READ]: 'Read audit log',
    };
  }
}
