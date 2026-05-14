import { PermissionVal } from 'src/common/models';
import { UserType } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      permissionsVal: PermissionVal;
      user: {
        sub: number;
        username: string;
        userType: UserType;
        permissions: string[];
        [key: string]: unknown;
      };
    }
  }
}
