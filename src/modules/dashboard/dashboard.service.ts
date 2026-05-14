import { Injectable } from '@nestjs/common';
import { UserQueries } from 'src/common/shared/queries';
import { RoleQueries } from 'src/common/shared/queries';
import { AuditLogQueries } from 'src/common/shared/queries';

@Injectable()
export class DashboardService {
  constructor(
    private readonly userQueries: UserQueries,
    private readonly roleQueries: RoleQueries,
    private readonly auditLogQueries: AuditLogQueries,
  ) {}

  async getSummary() {
    const [totalUsers, activeUsers, totalRoles, totalAuditLogs] =
      await Promise.all([
        this.userQueries.count({ where: { userType: { equals: 'CUSTOMER' } } }),
        this.userQueries.count({
          where: { isActive: true, userType: { equals: 'CUSTOMER' } },
        }),
        this.roleQueries.count({}),
        this.auditLogQueries.count({}),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalRoles,
      totalAuditLogs,
    };
  }

  getRecentAuditLogs(limit = 10) {
    return this.auditLogQueries.find({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getUserRegistrationTrend(days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const users = await this.userQueries.find({
      where: { createdAt: { gte: since }, userType: { equals: 'CUSTOMER' } },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const trend: Record<string, number> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      trend[d.toISOString().slice(0, 10)] = 0;
    }

    for (const user of users) {
      const key = user.createdAt.toISOString().slice(0, 10);
      if (key in trend) trend[key]++;
    }

    return Object.entries(trend).map(([date, count]) => ({ date, count }));
  }
}
