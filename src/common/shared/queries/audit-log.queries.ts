import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class AuditLogQueries extends BaseRepository {
  find = (...args: Parameters<typeof this.client.auditLog.findMany>) =>
    this.client.auditLog.findMany(...args);
  count = (...args: Parameters<typeof this.client.auditLog.count>) =>
    this.client.auditLog.count(...args);
}
