import { Injectable } from '@nestjs/common';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { AuditLogQueries } from 'src/common/shared/queries';
import { AuditLogRepository } from 'src/common/shared/repositories';
import { Prisma } from '@prisma/client';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditLogQueries: AuditLogQueries,
    private readonly auditLogRepository: AuditLogRepository,
  ) {}

  create(dto: CreateAuditLogDto) {
    return this.auditLogRepository.create({
      data: {
        ...dto,
        metadata: dto.metadata as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async findAll(query: QueryAuditLogDto) {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      statusCode,
      from,
      to,
    } = query;

    const where: Prisma.AuditLogWhereInput = {
      ...(userId !== undefined && { userId }),
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
      ...(resource && {
        resource: { contains: resource, mode: 'insensitive' },
      }),
      ...(statusCode !== undefined && { statusCode }),
      ...((from || to) && {
        createdAt: {
          ...(from && { gte: new Date(from) }),
          ...(to && { lte: new Date(to) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.auditLogQueries.find({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.auditLogQueries.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
