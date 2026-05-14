import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class OrderQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.order.findFirst>) =>
    this.client.order.findFirst(...args);
  find = (...args: Parameters<typeof this.client.order.findMany>) =>
    this.client.order.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.order.findUnique>) =>
    this.client.order.findUnique(...args);
  count = (...args: Parameters<typeof this.client.order.count>) =>
    this.client.order.count(...args);
}
