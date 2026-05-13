import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class ProductRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.product.create>) =>
    this.client.product.create(...args);
  update = (...args: Parameters<typeof this.client.product.update>) =>
    this.client.product.update(...args);
  delete = (...args: Parameters<typeof this.client.product.delete>) =>
    this.client.product.delete(...args);
}
