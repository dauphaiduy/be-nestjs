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
 * MoMo payment gateway adapter.
 * TODO: Inject ConfigService and implement actual MoMo API calls.
 * Docs: https://developers.momo.vn
 */
@Injectable()
export class MomoGateway implements PaymentGateway {
  readonly provider = PaymentProvider.MOMO;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // TODO: build HMAC signature, call MoMo /v2/gateway/api/create
    throw new Error('MomoGateway.createPayment — not implemented');
  }

  verifyCallback(
    payload: Record<string, unknown>,
  ): Promise<VerifyCallbackResult> {
    // TODO: verify HMAC-SHA256 signature from MoMo callback
    throw new Error('MomoGateway.verifyCallback — not implemented');
  }

  queryStatus(providerTransactionId: string): Promise<QueryStatusResult> {
    // TODO: call MoMo /v2/gateway/api/query
    throw new Error('MomoGateway.queryStatus — not implemented');
  }

  refund(input: RefundInput): Promise<RefundResult> {
    // TODO: call MoMo /v2/gateway/api/refund
    throw new Error('MomoGateway.refund — not implemented');
  }
}
