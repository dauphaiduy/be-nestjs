import { Module } from '@nestjs/common';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { AuthModule } from '../auth/auth.module';
import {
  MomoGateway,
  SePayGateway,
  VnpayGateway,
  ZalopayGateway,
} from './gateways';
import { PaymentPermissions } from './permissions/payment.permissions';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentGateway } from './payment.gateway';

@Module({
  imports: [SharedModule, PermissionsModule, AuthModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
    PaymentGateway,
    MomoGateway,
    ZalopayGateway,
    VnpayGateway,
    SePayGateway,
  ],
  exports: [PaymentService],
})
export class PaymentModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      PaymentPermissions.getPermissionsOptions(),
    );
  }
}
