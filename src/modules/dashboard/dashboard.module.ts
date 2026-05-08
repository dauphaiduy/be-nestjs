import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { DashboardPermissions } from './permissions/dashboard.permissions';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      DashboardPermissions.getPermissionsOptions(),
    );
  }
}
