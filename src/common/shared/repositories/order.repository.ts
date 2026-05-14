import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class OrderRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.order.create>) =>
    this.client.order.create(...args);
  update = (...args: Parameters<typeof this.client.order.update>) =>
    this.client.order.update(...args);
  updateMany = (...args: Parameters<typeof this.client.order.updateMany>) =>
    this.client.order.updateMany(...args);
  delete = (...args: Parameters<typeof this.client.order.delete>) =>
    this.client.order.delete(...args);
}
