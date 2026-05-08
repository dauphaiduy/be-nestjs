import { PermissionOptions } from 'src/modules/permissions/dto/permission.dto';

export class DashboardPermissions {
  public static readonly PERMISSIONS = {
    DASHBOARD_READ: 'dashboard:read',
  };

  public static getPermissionsOptions(): PermissionOptions {
    return {
      [DashboardPermissions.PERMISSIONS.DASHBOARD_READ]: 'Read dashboard',
    };
  }
}
