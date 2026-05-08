import { Controller, Get, Query } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { Permissions } from 'src/common/decorators';
import { AuditLogPermissions } from './permissions/audit-log.permissions';

@Controller('audit-log')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Permissions(AuditLogPermissions.PERMISSIONS.AUDIT_LOG_READ)
  @Get()
  findAll(@Query() query: QueryAuditLogDto) {
    return this.auditLogService.findAll(query);
  }
}
