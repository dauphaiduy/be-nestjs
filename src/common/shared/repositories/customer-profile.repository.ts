import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class CustomerProfileRepository extends BaseRepository {
  create = (
    ...args: Parameters<typeof this.client.customerProfile.create>
  ) => this.client.customerProfile.create(...args);
  update = (
    ...args: Parameters<typeof this.client.customerProfile.update>
  ) => this.client.customerProfile.update(...args);
  upsert = (
    ...args: Parameters<typeof this.client.customerProfile.upsert>
  ) => this.client.customerProfile.upsert(...args);
}
