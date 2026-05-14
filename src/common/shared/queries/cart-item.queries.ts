import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CartItemQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.cartItem.findFirst>) =>
    this.client.cartItem.findFirst(...args);
  find = (...args: Parameters<typeof this.client.cartItem.findMany>) =>
    this.client.cartItem.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.cartItem.findUnique>) =>
    this.client.cartItem.findUnique(...args);
}
