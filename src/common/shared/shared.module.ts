import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserQueries, RoleQueries, AuditLogQueries, CategoryQueries, ProductQueries, CustomerProfileQueries } from './queries';
import { UserRepository, RoleRepository, AuditLogRepository, CategoryRepository, ProductRepository, CustomerProfileRepository } from './repositories';

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
  CustomerProfileQueries,
  CustomerProfileRepository,
];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
