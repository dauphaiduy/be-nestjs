import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CustomerProfileQueries extends BaseRepository {
  findOne = (
    ...args: Parameters<typeof this.client.customerProfile.findFirst>
  ) => this.client.customerProfile.findFirst(...args);
  findUnique = (
    ...args: Parameters<typeof this.client.customerProfile.findUnique>
  ) => this.client.customerProfile.findUnique(...args);
}
