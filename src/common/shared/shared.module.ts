import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserQueries, RoleQueries } from './queries';
import { UserRepository, RoleRepository } from './repositories';

const providers = [PrismaService, UserQueries, UserRepository, RoleQueries, RoleRepository];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
