import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { Permissions } from 'src/common/decorators';
import { UserPermissions } from './permissions/user.permissions';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Permissions(UserPermissions.PERMISSIONS.USER_CREATE)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Permissions(UserPermissions.PERMISSIONS.USER_READ)
  @Get()
  findAll(@Query() query: QueryUserDto) {
    return this.userService.findAll(query);
  }

  @Permissions(UserPermissions.PERMISSIONS.USER_UPDATE)
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }
}
