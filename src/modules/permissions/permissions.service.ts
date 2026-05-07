import { Injectable } from '@nestjs/common';
import { PermissionOptions } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  permissions: PermissionOptions;
  constructor() {
    this.permissions = {};
  }
  getPermissions() {
    return this.permissions;
  }
  setPermissions(permissions: PermissionOptions) {
    this.permissions = {
      ...this.permissions,
      ...permissions,
    };
  }
}
