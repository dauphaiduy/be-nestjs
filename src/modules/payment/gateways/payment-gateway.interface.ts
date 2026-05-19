import { PaymentProvider } from '@prisma/client';

export interface CreatePaymentInput {
  orderId: number;
  amount: number;
  /** Internal transaction record id */
  transactionId: number;
  returnUrl: string;
  description?: string;
}

export interface CreatePaymentResult {
  paymentUrl: string;
  qrCode?: string;
  providerTransactionId: string;
  rawRequest: Record<string, unknown>;
  rawResponse: Record<string, unknown>;
}

export interface VerifyCallbackResult {
  isValid: boolean;
  providerTransactionId: string;
  orderId: number;
  amount: number;
  rawPayload: Record<string, unknown>;
}

export interface QueryStatusResult {
  providerTransactionId: string;
  isSuccess: boolean;
  rawResponse: Record<string, unknown>;
}

export interface RefundInput {
  providerTransactionId: string;
  amount: number;
  reason?: string;
}

export interface RefundResult {
  success: boolean;
  rawResponse: Record<string, unknown>;
}

export interface PaymentGateway {
  readonly provider: PaymentProvider;

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  verifyCallback(
    payload: Record<string, unknown>,
  ): Promise<VerifyCallbackResult>;

  queryStatus(providerTransactionId: string): Promise<QueryStatusResult>;

  refund(input: RefundInput): Promise<RefundResult>;
}

export const PAYMENT_GATEWAY = 'PAYMENT_GATEWAY';
