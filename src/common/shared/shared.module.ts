import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import {
  UserQueries,
  RoleQueries,
  AuditLogQueries,
  CategoryQueries,
  ProductQueries,
  CustomerProfileQueries,
  CartQueries,
  CartItemQueries,
  OrderQueries,
} from './queries';
import {
  UserRepository,
  RoleRepository,
  AuditLogRepository,
  CategoryRepository,
  ProductRepository,
  CustomerProfileRepository,
  CartRepository,
  CartItemRepository,
  OrderRepository,
} from './repositories';

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
  CartQueries,
  CartRepository,
  CartItemQueries,
  CartItemRepository,
  OrderQueries,
  OrderRepository,
];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
