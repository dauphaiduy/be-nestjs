import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserQueries } from 'src/common/shared/queries';
import { UserRepository } from 'src/common/shared/repositories';

@Injectable()
export class UserService {
  constructor(
    private readonly userQueries: UserQueries,
    private readonly userRepository: UserRepository,
  ) {}

  create(createUserDto: CreateUserDto) {
    return this.userRepository.create({ data: createUserDto });
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
