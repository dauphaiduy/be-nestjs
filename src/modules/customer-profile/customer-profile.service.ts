import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserType } from '@prisma/client';
import { CustomerProfileQueries } from 'src/common/shared/queries';
import { CustomerProfileRepository } from 'src/common/shared/repositories';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';

@Injectable()
export class CustomerProfileService {
  constructor(
    private readonly customerProfileQueries: CustomerProfileQueries,
    private readonly customerProfileRepository: CustomerProfileRepository,
  ) {}

  async getMyProfile(userId: number, userType: UserType) {
    this.assertCustomer(userType);
    const profile = await this.customerProfileQueries.findUnique({
      where: { userId },
    });
    if (!profile) throw new NotFoundException('Profile not found');
    return profile;
  }

  async upsertMyProfile(
    userId: number,
    userType: UserType,
    dto: UpdateCustomerProfileDto,
  ) {
    this.assertCustomer(userType);
    return await this.customerProfileRepository.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: { ...dto },
    });
  }

  private assertCustomer(userType: UserType) {
    if (userType !== UserType.CUSTOMER) {
      throw new ForbiddenException('Only customers can access this resource');
    }
  }
}
