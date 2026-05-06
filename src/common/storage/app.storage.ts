import { AsyncLocalStorage } from 'async_hooks';

import { Request } from 'express';

export type Context = {
  ctxId: any;
  request: Request;
};
export const appStorage = new AsyncLocalStorage<Context>();
