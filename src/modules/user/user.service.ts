import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueries } from 'src/common/shared/queries';
import { UserRepository } from 'src/common/shared/repositories';
import { hashPassword } from 'src/common/utils';
import { AccountType } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private readonly userQueries: UserQueries,
    private readonly userRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { accountType } = createUserDto;
    let hashedPassword: string | undefined;
    if (accountType === AccountType.LOCAL) {
      if (!createUserDto.password) {
        throw new Error('Password is required for local accounts');
      }
      hashedPassword = await hashPassword(createUserDto.password);
    }
    return this.userRepository.create({
      data: { ...createUserDto, password: hashedPassword },
    });
  }

  findAll() {
    return this.userQueries.find();
  }

  findOne(username: string) {
    return this.userQueries.findOne({ where: { username } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return this.userRepository.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.userRepository.delete({ where: { id } });
  }
}
