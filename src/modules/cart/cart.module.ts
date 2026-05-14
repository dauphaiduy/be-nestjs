import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { PermissionsService } from '../permissions/permissions.service';
import { CartPermissions } from './permissions/cart.permissions';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {
  constructor(private readonly permissionsService: PermissionsService) {
    this.permissionsService.setPermissions(
      CartPermissions.getPermissionsOptions(),
    );
  }
}
