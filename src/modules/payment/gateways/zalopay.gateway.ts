import { Injectable } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';
import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentGateway,
  QueryStatusResult,
  RefundInput,
  RefundResult,
  VerifyCallbackResult,
} from './payment-gateway.interface';

/**
 * ZaloPay payment gateway adapter.
 * TODO: Inject ConfigService and implement actual ZaloPay API calls.
 * Docs: https://docs.zalopay.vn
 */
@Injectable()
export class ZalopayGateway implements PaymentGateway {
  readonly provider = PaymentProvider.ZALOPAY;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // TODO: build HMAC-SHA256 mac, call ZaloPay /v2/create
    throw new Error('ZalopayGateway.createPayment — not implemented');
  }

  verifyCallback(
    payload: Record<string, unknown>,
  ): Promise<VerifyCallbackResult> {
    // TODO: verify mac from ZaloPay callback
    throw new Error('ZalopayGateway.verifyCallback — not implemented');
  }

  queryStatus(providerTransactionId: string): Promise<QueryStatusResult> {
    // TODO: call ZaloPay /v2/query
    throw new Error('ZalopayGateway.queryStatus — not implemented');
  }

  refund(input: RefundInput): Promise<RefundResult> {
    // TODO: call ZaloPay /v2/refund
    throw new Error('ZalopayGateway.refund — not implemented');
  }
}
