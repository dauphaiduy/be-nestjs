import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserQueries, RoleQueries, AuditLogQueries } from './queries';
import { UserRepository, RoleRepository, AuditLogRepository } from './repositories';

const providers = [
  PrismaService,
  UserQueries,
  UserRepository,
  RoleQueries,
  RoleRepository,
  AuditLogQueries,
  AuditLogRepository,
];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
