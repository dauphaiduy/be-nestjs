import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { UserQueries } from './queries';
import { UserRepository } from './repositories';

const providers = [PrismaService, UserQueries, UserRepository];

@Module({
  providers,
  exports: providers,
})
export class SharedModule {}
