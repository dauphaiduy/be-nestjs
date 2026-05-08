import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuditLogService } from 'src/modules/audit-log/audit-log.service';

const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'accessToken'];

function sanitize(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      SENSITIVE_FIELDS.includes(k) ? '[REDACTED]' : sanitize(v),
    ]),
  );
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly auditLogService: AuditLogService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, url, headers, body, query, params } = req;
    const userId: number | undefined = req.user?.sub;
    const ipAddress =
      (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress;
    const userAgent = headers['user-agent'];

    const resource = url.split('?')[0];
    const resourceId = this.extractResourceId(url);

    const requestData = sanitize({
      body: body as unknown,
      query: query as unknown,
      params: params as unknown,
    });

    const saveLog = (statusCode: number, responseBody?: unknown) => {
      void this.auditLogService.create({
        userId,
        action: method,
        resource,
        resourceId,
        statusCode,
        ipAddress,
        userAgent,
        metadata: {
          request: requestData,
          response: responseBody ?? null,
        },
      });
    };

    return next.handle().pipe(
      tap((responseBody: unknown) =>
        saveLog(res.statusCode, sanitize(responseBody)),
      ),
      catchError((err: unknown) => {
        const status =
          err && typeof err === 'object' && 'status' in err
            ? (err as { status: number }).status
            : 500;
        const message =
          err && typeof err === 'object' && 'message' in err
            ? (err as Record<string, unknown>).message
            : undefined;
        saveLog(status, { error: message });
        return throwError(() => err);
      }),
    );
  }

  private extractResourceId(url: string): string | undefined {
    const path = url.split('?')[0];
    const segments = path.split('/').filter(Boolean);
    const last = segments[segments.length - 1];
    return last && /^\d+$/.test(last) ? last : undefined;
  }
}
