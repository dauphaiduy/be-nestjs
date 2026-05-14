import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CartItemRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.cartItem.create>) =>
    this.client.cartItem.create(...args);
  update = (...args: Parameters<typeof this.client.cartItem.update>) =>
    this.client.cartItem.update(...args);
  upsert = (...args: Parameters<typeof this.client.cartItem.upsert>) =>
    this.client.cartItem.upsert(...args);
  delete = (...args: Parameters<typeof this.client.cartItem.delete>) =>
    this.client.cartItem.delete(...args);
  updateMany = (...args: Parameters<typeof this.client.cartItem.updateMany>) =>
    this.client.cartItem.updateMany(...args);
  deleteMany = (...args: Parameters<typeof this.client.cartItem.deleteMany>) =>
    this.client.cartItem.deleteMany(...args);
}
