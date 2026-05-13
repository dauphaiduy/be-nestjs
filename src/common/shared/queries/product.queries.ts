import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class ProductQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.product.findFirst>) =>
    this.client.product.findFirst(...args);
  find = (...args: Parameters<typeof this.client.product.findMany>) =>
    this.client.product.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.product.findUnique>) =>
    this.client.product.findUnique(...args);
  count = (...args: Parameters<typeof this.client.product.count>) =>
    this.client.product.count(...args);
}
