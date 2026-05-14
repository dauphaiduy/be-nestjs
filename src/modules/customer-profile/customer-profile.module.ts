import { Module } from '@nestjs/common';
import { CustomerProfileController } from './customer-profile.controller';
import { CustomerProfileService } from './customer-profile.service';
import { SharedModule } from 'src/common/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [CustomerProfileController],
  providers: [CustomerProfileService],
})
export class CustomerProfileModule {}
