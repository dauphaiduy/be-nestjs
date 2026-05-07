import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { SharedModule } from 'src/common/shared/shared.module';
import { PermissionsService } from '../permissions/permissions.service';
import { UserPermissions } from './permissions/user.permissions';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [SharedModule, PermissionsModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {
  constructor(private readonly permissionService: PermissionsService) {
    this.permissionService.setPermissions(
      UserPermissions.getPermissionsOptions(),
    );
  }
}
