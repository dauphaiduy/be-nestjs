import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class RoleQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.role.findFirst>) =>
    this.client.role.findFirst(...args);
  find = (...args: Parameters<typeof this.client.role.findMany>) =>
    this.client.role.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.role.findUnique>) =>
    this.client.role.findUnique(...args);
}
