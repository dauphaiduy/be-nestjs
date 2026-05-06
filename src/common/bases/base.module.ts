import { Module } from '@nestjs/common';
import { BasesController } from './base.controller';

@Module({
  controllers: [BasesController],
})
export class BasesModule {}
