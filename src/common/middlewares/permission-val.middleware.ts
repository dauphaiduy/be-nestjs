import { Injectable, NestMiddleware } from '@nestjs/common';
import { ContextIdFactory, ModuleRef } from '@nestjs/core';
import { Request, Response, NextFunction } from 'express';
import { appStorage } from '../storage';
import { PermissionVal } from '../models';

@Injectable()
export class PermissionValMiddleware implements NestMiddleware {
  constructor(private readonly moduleRef: ModuleRef) {}

  use(req: Request, res: Response, next: NextFunction) {
    const permissionsVal: PermissionVal = new PermissionVal({
      accessToken: req.headers['authorization'],
    });
    req.permissionsVal = permissionsVal;
    const ctxId = ContextIdFactory.getByRequest(req);
    this.moduleRef.registerRequestByContextId(req, ctxId);

    appStorage.run({ ctxId, request: req }, () => {
      next();
    });
  }
}
