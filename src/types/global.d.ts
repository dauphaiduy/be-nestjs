import { PermissionVal } from 'src/common/models';

declare global {
  namespace Express {
    export interface Request {
      permissionsVal: PermissionVal;
      user: {
        sub: number;
        username: string;
        permissions: string[];
        [key: string]: unknown;
      };
    }
  }
}
