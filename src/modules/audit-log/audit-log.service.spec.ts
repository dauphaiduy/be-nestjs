import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogQueries } from 'src/common/shared/queries';
import { AuditLogRepository } from 'src/common/shared/repositories';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let auditLogQueries: { find: jest.Mock; count: jest.Mock };
  let auditLogRepository: { create: jest.Mock };

  beforeEach(async () => {
    auditLogQueries = { find: jest.fn(), count: jest.fn() };
    auditLogRepository = { create: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: AuditLogQueries, useValue: auditLogQueries },
        { provide: AuditLogRepository, useValue: auditLogRepository },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates an audit log entry', async () => {
      auditLogRepository.create.mockResolvedValue({ id: 1 });

      const dto: CreateAuditLogDto = {
        action: 'POST',
        resource: '/api/users',
        userId: 1,
        statusCode: 201,
      };
      await service.create(dto);

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'POST',
          resource: '/api/users',
        }),
      });
    });

    it('creates entry without userId for anonymous requests', async () => {
      auditLogRepository.create.mockResolvedValue({ id: 2 });

      await service.create({
        action: 'GET',
        resource: '/api/auth/login',
      });

      expect(auditLogRepository.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ action: 'GET' }),
      });
    });
  });

  describe('findAll', () => {
    it('returns paginated results', async () => {
      auditLogQueries.find.mockResolvedValue([{ id: 1 }]);
      auditLogQueries.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        items: [{ id: 1 }],
        total: 1,
        page: 1,
        limit: 20,
      });
    });

    it('applies userId filter', async () => {
      auditLogQueries.find.mockResolvedValue([]);
      auditLogQueries.count.mockResolvedValue(0);

      await service.findAll({
        userId: 5,
        page: 1,
        limit: 10,
      });

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 5 }),
        }),
      );
    });

    it('applies action filter (case-insensitive)', async () => {
      auditLogQueries.find.mockResolvedValue([]);
      auditLogQueries.count.mockResolvedValue(0);

      await service.findAll({
        action: 'POST',
        page: 1,
        limit: 10,
      });

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            action: { contains: 'POST', mode: 'insensitive' },
          }),
        }),
      );
    });

    it('applies date range filter', async () => {
      auditLogQueries.find.mockResolvedValue([]);
      auditLogQueries.count.mockResolvedValue(0);

      await service.findAll({
        from: '2024-01-01',
        to: '2024-12-31',
        page: 1,
        limit: 10,
      });

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: new Date('2024-01-01'),
              lte: new Date('2024-12-31'),
            },
          }),
        }),
      );
    });

    it('always orders by createdAt desc', async () => {
      auditLogQueries.find.mockResolvedValue([]);
      auditLogQueries.count.mockResolvedValue(0);

      await service.findAll({});

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
      );
    });

    it('uses correct skip for page 2', async () => {
      auditLogQueries.find.mockResolvedValue([]);
      auditLogQueries.count.mockResolvedValue(0);

      await service.findAll({ page: 2, limit: 20 });

      expect(auditLogQueries.find).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 20 }),
      );
    });
  });
});
