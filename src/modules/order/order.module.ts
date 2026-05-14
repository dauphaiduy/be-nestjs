import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderScheduler } from './order.scheduler';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { CartModule } from '../cart/cart.module';
import { OrderPermissions } from './permissions/order.permissions';

@Module({
  imports: [
    SharedModule,
    PermissionsModule,
    CartModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderScheduler],
  exports: [OrderService],
})
export class OrderModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      OrderPermissions.getPermissionsOptions(),
    );
  }
}
