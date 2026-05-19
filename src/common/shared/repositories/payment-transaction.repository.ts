import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class PaymentTransactionRepository extends BaseRepository {
  create = (
    ...args: Parameters<typeof this.client.paymentTransaction.create>
  ) => this.client.paymentTransaction.create(...args);

  update = (
    ...args: Parameters<typeof this.client.paymentTransaction.update>
  ) => this.client.paymentTransaction.update(...args);

  updateMany = (
    ...args: Parameters<typeof this.client.paymentTransaction.updateMany>
  ) => this.client.paymentTransaction.updateMany(...args);

  delete = (
    ...args: Parameters<typeof this.client.paymentTransaction.delete>
  ) => this.client.paymentTransaction.delete(...args);
}
