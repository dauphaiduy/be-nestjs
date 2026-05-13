import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CategoryQueries extends BaseRepository {
  findOne = (...args: Parameters<typeof this.client.category.findFirst>) =>
    this.client.category.findFirst(...args);
  find = (...args: Parameters<typeof this.client.category.findMany>) =>
    this.client.category.findMany(...args);
  findUnique = (...args: Parameters<typeof this.client.category.findUnique>) =>
    this.client.category.findUnique(...args);
  count = (...args: Parameters<typeof this.client.category.count>) =>
    this.client.category.count(...args);
}
