export class PermissionVal {
  accessToken?: string;
  permissions?: string[];

  [key: string]: unknown;
  constructor(data?: Partial<PermissionVal>) {
    Object.assign(this, data);
  }
}
