import { Module } from '@nestjs/common';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { AuditLogPermissions } from './permissions/audit-log.permissions';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      AuditLogPermissions.getPermissionsOptions(),
    );
  }
}
