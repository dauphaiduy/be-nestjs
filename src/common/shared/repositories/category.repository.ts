import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CategoryRepository extends BaseRepository {
  create = (...args: Parameters<typeof this.client.category.create>) =>
    this.client.category.create(...args);
  update = (...args: Parameters<typeof this.client.category.update>) =>
    this.client.category.update(...args);
  delete = (...args: Parameters<typeof this.client.category.delete>) =>
    this.client.category.delete(...args);
}
