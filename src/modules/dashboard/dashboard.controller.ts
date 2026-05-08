import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { Permissions } from 'src/common/decorators';
import { DashboardPermissions } from './permissions/dashboard.permissions';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Permissions(DashboardPermissions.PERMISSIONS.DASHBOARD_READ)
  @Get('summary')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Permissions(DashboardPermissions.PERMISSIONS.DASHBOARD_READ)
  @Get('recent-logs')
  getRecentAuditLogs(@Query('limit') limit?: string) {
    return this.dashboardService.getRecentAuditLogs(
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Permissions(DashboardPermissions.PERMISSIONS.DASHBOARD_READ)
  @Get('user-trend')
  getUserRegistrationTrend(@Query('days') days?: string) {
    return this.dashboardService.getUserRegistrationTrend(
      days ? parseInt(days, 10) : 7,
    );
  }
}
