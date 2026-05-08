import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class RoleRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.role.create>) =>
    this.client.role.create(...args);
  update = (...args: Parameters<typeof this.client.role.update>) =>
    this.client.role.update(...args);
  delete = (...args: Parameters<typeof this.client.role.delete>) =>
    this.client.role.delete(...args);
}
