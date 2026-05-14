import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CartQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.cart.findFirst>) =>
    this.client.cart.findFirst(...args);
  find = (...args: Parameters<typeof this.client.cart.findMany>) =>
    this.client.cart.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.cart.findUnique>) =>
    this.client.cart.findUnique(...args);
  count = (...args: Parameters<typeof this.client.cart.count>) =>
    this.client.cart.count(...args);
}
