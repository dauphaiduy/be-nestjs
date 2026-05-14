import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CartRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.cart.create>) =>
    this.client.cart.create(...args);
  update = (...args: Parameters<typeof this.client.cart.update>) =>
    this.client.cart.update(...args);
  upsert = (...args: Parameters<typeof this.client.cart.upsert>) =>
    this.client.cart.upsert(...args);
  delete = (...args: Parameters<typeof this.client.cart.delete>) =>
    this.client.cart.delete(...args);
}
