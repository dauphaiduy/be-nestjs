import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class UserRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.user.create>) =>
    this.client.user.create(...args);
  update = (...args: Parameters<typeof this.client.user.update>) =>
    this.client.user.update(...args);
  updateMany = (...args: Parameters<typeof this.client.user.updateMany>) =>
    this.client.user.updateMany(...args);
  upsert = (...args: Parameters<typeof this.client.user.upsert>) =>
    this.client.user.upsert(...args);
  delete = (...args: Parameters<typeof this.client.user.delete>) =>
    this.client.user.delete(...args);
  deleteMany = (...args: Parameters<typeof this.client.user.deleteMany>) =>
    this.client.user.deleteMany(...args);
}
