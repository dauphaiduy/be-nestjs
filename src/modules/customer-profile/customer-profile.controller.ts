import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { CustomerProfileService } from './customer-profile.service';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { CurrentUser } from 'src/common/decorators';
import { UserType } from '@prisma/client';

@Controller('customer/profile')
export class CustomerProfileController {
  constructor(
    private readonly customerProfileService: CustomerProfileService,
  ) {}

  @Get()
  getMyProfile(@CurrentUser() user: { sub: number; userType: UserType }) {
    return this.customerProfileService.getMyProfile(user.sub, user.userType);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  updateMyProfile(
    @CurrentUser() user: { sub: number; userType: UserType },
    @Body() dto: UpdateCustomerProfileDto,
  ) {
    return this.customerProfileService.upsertMyProfile(
      user.sub,
      user.userType,
      dto,
    );
  }
}
