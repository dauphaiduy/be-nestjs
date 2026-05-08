import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class UserQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.user.findFirst>) =>
    this.client.user.findFirst(...args);
  find = (...args: Parameters<typeof this.client.user.findMany>) =>
    this.client.user.findMany(...args);
  count = (...args: Parameters<typeof this.client.user.count>) =>
    this.client.user.count(...args);
}
