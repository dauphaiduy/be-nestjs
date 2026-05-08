import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import {
  UserQueries,
  RoleQueries,
  AuditLogQueries,
} from 'src/common/shared/queries';

describe('DashboardService', () => {
  let service: DashboardService;
  let userQueries: { count: jest.Mock; find: jest.Mock };
  let roleQueries: { count: jest.Mock };
  let auditLogQueries: { count: jest.Mock; find: jest.Mock };

  beforeEach(async () => {
    userQueries = { count: jest.fn(), find: jest.fn() };
    roleQueries = { count: jest.fn() };
    auditLogQueries = { count: jest.fn(), find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: UserQueries, useValue: userQueries },
        { provide: RoleQueries, useValue: roleQueries },
        { provide: AuditLogQueries, useValue: auditLogQueries },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
    jest.clearAllMocks();
  });

  describe('getSummary', () => {
    it('returns aggregated stats in parallel', async () => {
      userQueries.count
        .mockResolvedValueOnce(100) // totalUsers
        .mockResolvedValueOnce(80); // activeUsers
      roleQueries.count.mockResolvedValue(5);
      auditLogQueries.count.mockResolvedValue(500);

      const result = await service.getSummary();

      expect(result).toEqual({
        totalUsers: 100,
        activeUsers: 80,
        inactiveUsers: 20,
        totalRoles: 5,
        totalAuditLogs: 500,
      });
    });

    it('computes inactiveUsers correctly', async () => {
      userQueries.count.mockResolvedValueOnce(10).mockResolvedValueOnce(3);
      roleQueries.count.mockResolvedValue(2);
      auditLogQueries.count.mockResolvedValue(0);

      const result = await service.getSummary();
      expect(result.inactiveUsers).toBe(7);
    });
  });

  describe('getRecentAuditLogs', () => {
    it('returns logs ordered by createdAt desc', async () => {
      const logs = [{ id: 3 }, { id: 2 }, { id: 1 }];
      auditLogQueries.find.mockResolvedValue(logs);

      const result = await service.getRecentAuditLogs(3);

      expect(result).toEqual(logs);
      expect(auditLogQueries.find).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        take: 3,
      });
    });

    it('defaults to limit of 10', async () => {
      auditLogQueries.find.mockResolvedValue([]);

      await service.getRecentAuditLogs();

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 }),
      );
    });
  });

  describe('getUserRegistrationTrend', () => {
    it('returns an entry for each day in the range', async () => {
      userQueries.find.mockResolvedValue([]);

      const result = await service.getUserRegistrationTrend(7);

      expect(result).toHaveLength(7);
      result.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('count');
      });
    });

    it('counts user registrations per day', async () => {
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      userQueries.find.mockResolvedValue([
        { createdAt: yesterday },
        { createdAt: yesterday },
      ]);

      const result = await service.getUserRegistrationTrend(7);

      const total = result.reduce((sum, r) => sum + r.count, 0);
      expect(total).toBe(2);
    });

    it('queries users created since the start of the range', async () => {
      userQueries.find.mockResolvedValue([]);

      await service.getUserRegistrationTrend(7);

      expect(userQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({ gte: expect.any(Date) }),
          }),
        }),
      );
    });
  });
});
