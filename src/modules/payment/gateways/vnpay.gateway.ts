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
 * VNPay payment gateway adapter.
 * TODO: Inject ConfigService and implement actual VNPay API calls.
 * Docs: https://sandbox.vnpayment.vn/apis
 */
@Injectable()
export class VnpayGateway implements PaymentGateway {
  readonly provider = PaymentProvider.VNPAY;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // TODO: build vnp_SecureHash (SHA512), redirect to VNPay payment URL
    throw new Error('VnpayGateway.createPayment — not implemented');
  }

  verifyCallback(
    payload: Record<string, unknown>,
  ): Promise<VerifyCallbackResult> {
    // TODO: verify vnp_SecureHash from VNPay IPN/return URL
    throw new Error('VnpayGateway.verifyCallback — not implemented');
  }

  queryStatus(providerTransactionId: string): Promise<QueryStatusResult> {
    // TODO: call VNPay querydr endpoint
    throw new Error('VnpayGateway.queryStatus — not implemented');
  }

  refund(input: RefundInput): Promise<RefundResult> {
    // TODO: call VNPay refund endpoint
    throw new Error('VnpayGateway.refund — not implemented');
  }
}
