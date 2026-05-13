import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserQueries, RoleQueries, AuditLogQueries, CategoryQueries, ProductQueries } from './queries';
import { UserRepository, RoleRepository, AuditLogRepository, CategoryRepository, ProductRepository } from './repositories';

const providers = [
  PrismaService,
  UserQueries,
  UserRepository,
  RoleQueries,
  RoleRepository,
  AuditLogQueries,
  AuditLogRepository,
  CategoryQueries,
  CategoryRepository,
  ProductQueries,
  ProductRepository,
];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
