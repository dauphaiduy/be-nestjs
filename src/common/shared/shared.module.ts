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
  PaymentTransactionQueries,
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
  PaymentTransactionRepository,
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
  PaymentTransactionQueries,
  PaymentTransactionRepository,
];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
