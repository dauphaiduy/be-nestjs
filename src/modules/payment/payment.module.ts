import { Module } from '@nestjs/common';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import {
  MomoGateway,
  SePayGateway,
  VnpayGateway,
  ZalopayGateway,
} from './gateways';
import { PaymentPermissions } from './permissions/payment.permissions';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [PaymentController],
  providers: [
    PaymentService,
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
