import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { UserQueries } from 'src/common/shared/queries';
import { UserRepository } from 'src/common/shared/repositories';
import { hashPassword } from 'src/common/utils';
import { AccountType, Prisma } from '@prisma/client';

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

  async findAll(query: QueryUserDto) {
    const {
      page = 1,
      limit = 10,
      email,
      username,
      name,
      isActive,
      accountType,
      userType,
      roleId,
    } = query;
    const where: Prisma.UserWhereInput = {
      ...(email && { email: { contains: email, mode: 'insensitive' } }),
      ...(username && {
        username: { contains: username, mode: 'insensitive' },
      }),
      ...(name && { name: { contains: name, mode: 'insensitive' } }),
      ...(isActive !== undefined && { isActive }),
      ...(accountType && { accountType }),
      ...(userType && { userType }),
      ...(roleId !== undefined && { roleId }),
    };
    const [items, total] = await Promise.all([
      this.userQueries.find({
        where,
        skip: (page - 1) * limit,
        take: limit,
        omit: { password: true },
      }),
      this.userQueries.count({ where }),
    ]);
    return { items, total, page, limit };
  }

  findOne(username: string) {
    return this.userQueries.findOne({ where: { username } });
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      return hashPassword(updateUserDto.password).then((hashedPassword) => {
        return this.userRepository.update({
          where: { id },
          data: { ...updateUserDto, password: hashedPassword },
        });
      });
    }
    return this.userRepository.update({ where: { id }, data: updateUserDto });
  }

  remove(id: number) {
    return this.userRepository.delete({ where: { id } });
  }
}
