import { Injectable } from '@nestjs/common';
import { BaseRepository } from 'src/common/bases';

@Injectable()
export class PaymentTransactionQueries extends BaseRepository {
  findOne = (
    ...args: Parameters<typeof this.client.paymentTransaction.findFirst>
  ) => this.client.paymentTransaction.findFirst(...args);

  find = (
    ...args: Parameters<typeof this.client.paymentTransaction.findMany>
  ) => this.client.paymentTransaction.findMany(...args);

  findUnique = (
    ...args: Parameters<typeof this.client.paymentTransaction.findUnique>
  ) => this.client.paymentTransaction.findUnique(...args);

  count = (
    ...args: Parameters<typeof this.client.paymentTransaction.count>
  ) => this.client.paymentTransaction.count(...args);
}
