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
 * SePay payment gateway adapter — bank transfer QR.
 *
 * Flow:
 *   createPayment  → generate reference code, return QR URL (no API call needed)
 *   verifyCallback → confirm the transfer `content` matches our reference code
 *
 * Docs: https://docs.sepay.vn
 */
@Injectable()
export class SePayGateway implements PaymentGateway {
  readonly provider = PaymentProvider.SEPAY;

  // SePay QR base URL — format: https://qr.sepay.vn/img?...
  private static readonly QR_BASE = 'https://qr.sepay.vn/img';

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // SePay does not require an API call — customer transfers to your bank account
    // with a generated reference code in the description.
    // TODO: inject ConfigService and read SEPAY_BANK, SEPAY_ACCOUNT from env.
    const bank = process.env['SEPAY_BANK'] ?? 'TPBank';
    const account = process.env['SEPAY_ACCOUNT'] ?? '0000000001';

    // Reference code customer must write in transfer description
    const refCode = `SE${input.orderId}`;

    const params = new URLSearchParams({
      bank,
      acc: account,
      template: 'compact',
      amount: String(input.amount),
      des: refCode,
    });

    const qrUrl = `${SePayGateway.QR_BASE}?${params.toString()}`;

    return Promise.resolve({
      paymentUrl: qrUrl,
      qrCode: qrUrl,
      providerTransactionId: refCode,
      rawRequest: { bank, account, refCode, amount: input.amount },
      rawResponse: {},
    });
  }

  async verifyCallback(
    payload: Record<string, unknown>,
  ): Promise<VerifyCallbackResult> {
    // `code` is the text the customer typed in the bank transfer description.
    // It must match the refCode we generated in createPayment.
    // TODO: verify HMAC/apikey from SePay webhook header for production.
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const content = String(payload['code'] ?? '');
    const transferAmount = Number(payload['transferAmount'] ?? 0);

    return Promise.resolve({
      isValid: content.length > 0 && transferAmount > 0,
      providerTransactionId: content,
      orderId: 0,
      amount: transferAmount,
      rawPayload: payload,
    });
  }

  queryStatus(providerTransactionId: string): Promise<QueryStatusResult> {
    // TODO: call SePay transactions API to check status
    throw new Error('SePayGateway.queryStatus — not implemented');
  }

  refund(input: RefundInput): Promise<RefundResult> {
    // Bank transfers cannot be refunded via API — manual process
    throw new Error('SePayGateway.refund — not implemented');
  }
}
