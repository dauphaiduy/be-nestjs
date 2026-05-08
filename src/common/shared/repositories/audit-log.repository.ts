import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class AuditLogRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.auditLog.create>) =>
    this.client.auditLog.create(...args);
}
