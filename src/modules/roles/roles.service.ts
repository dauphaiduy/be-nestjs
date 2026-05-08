import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleQueries } from 'src/common/shared/queries';
import { RoleRepository } from 'src/common/shared/repositories';

@Injectable()
export class RolesService {
  constructor(
    private readonly roleQueries: RoleQueries,
    private readonly roleRepository: RoleRepository,
  ) {}

  create(createRoleDto: CreateRoleDto) {
    return this.roleRepository.create({ data: createRoleDto });
  }

  findAll() {
    return this.roleQueries.find();
  }

  async findOne(id: number) {
    const role = await this.roleQueries.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role #${id} not found`);
    return role;
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    await this.findOne(id);
    return this.roleRepository.update({ where: { id }, data: updateRoleDto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.roleRepository.delete({ where: { id } });
  }
}
