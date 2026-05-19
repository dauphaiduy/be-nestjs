import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  Prisma,
  PaymentProvider,
  PaymentStatus,
  UserType,
} from '@prisma/client';
import { PrismaService } from 'src/common/prisma';
import { PaymentTransactionQueries } from 'src/common/shared/queries';
import { PaymentTransactionRepository } from 'src/common/shared/repositories';
import { CheckoutPaymentDto, QueryPaymentDto, RefundPaymentDto } from './dto';
import {
  MomoGateway,
  PaymentGateway,
  SePayGateway,
  VnpayGateway,
  ZalopayGateway,
} from './gateways';
import { PaymentGateway as PaymentSocketGateway } from './payment.gateway';

@Injectable()
export class PaymentService {
  /** Gateway registry keyed by provider — resolved at startup. */
  private readonly gatewayMap: Map<PaymentProvider, PaymentGateway>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentTransactionQueries: PaymentTransactionQueries,
    private readonly paymentTransactionRepository: PaymentTransactionRepository,
    private readonly paymentSocketGateway: PaymentSocketGateway,
    private readonly momoGateway: MomoGateway,
    private readonly zalopayGateway: ZalopayGateway,
    private readonly vnpayGateway: VnpayGateway,
    private readonly sepayGateway: SePayGateway,
  ) {
    this.gatewayMap = new Map<PaymentProvider, PaymentGateway>([
      [PaymentProvider.MOMO, momoGateway],
      [PaymentProvider.ZALOPAY, zalopayGateway],
      [PaymentProvider.VNPAY, vnpayGateway],
      [PaymentProvider.SEPAY, sepayGateway],
    ]);
  }

  // ─── 1. Initiate checkout ──────────────────────────────────────────────────

  async checkout(userId: number, dto: CheckoutPaymentDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in PENDING state');
    }

    const gateway = this.resolveGateway(dto.provider);

    // Reuse existing active transaction to avoid duplicates
    const existing = await this.paymentTransactionQueries.findOne({
      where: {
        orderId: dto.orderId,
        status: { in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] },
      },
    });

    if (existing) {
      const result = await gateway.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        transactionId: existing.id,
        returnUrl: dto.returnUrl,
        description: dto.description,
      });

      if (existing.status === PaymentStatus.PENDING) {
        // Gateway was never reached on the previous attempt — persist the result now
        await this.paymentTransactionRepository.update({
          where: { id: existing.id },
          data: {
            transactionId: result.providerTransactionId,
            status: PaymentStatus.PROCESSING,
            rawRequest: result.rawRequest as Prisma.InputJsonValue,
            rawResponse: result.rawResponse as Prisma.InputJsonValue,
          },
        });
      }
      // PROCESSING: gateway already called successfully — no DB update needed,
      // just return the regenerated URL so the client can re-display QR / redirect.

      this.paymentSocketGateway.emitPending({
        orderId: order.id,
        transactionId: existing.id,
        status: PaymentStatus.PROCESSING,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode ?? null,
        provider: dto.provider,
      });

      return {
        transactionId: existing.id,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode ?? null,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      // Create a PENDING transaction record first
      const txRecord = await tx.paymentTransaction.create({
        data: {
          orderId: order.id,
          provider: dto.provider,
          amount: order.totalAmount,
          status: PaymentStatus.PENDING,
        },
      });

      const result = await gateway.createPayment({
        orderId: order.id,
        amount: Number(order.totalAmount),
        transactionId: txRecord.id,
        returnUrl: dto.returnUrl,
        description: dto.description,
      });

      // Persist gateway request/response
      await tx.paymentTransaction.update({
        where: { id: txRecord.id },
        data: {
          transactionId: result.providerTransactionId,
          status: PaymentStatus.PROCESSING,
          rawRequest: result.rawRequest as Prisma.InputJsonValue,
          rawResponse: result.rawResponse as Prisma.InputJsonValue,
        },
      });

      const response = {
        transactionId: txRecord.id,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode ?? null,
      };

      // Notify subscribed clients that payment is in progress
      this.paymentSocketGateway.emitPending({
        orderId: order.id,
        transactionId: txRecord.id,
        status: PaymentStatus.PROCESSING,
        paymentUrl: result.paymentUrl,
        qrCode: result.qrCode ?? null,
        provider: dto.provider,
      });

      return response;
    });
  }

  // ─── 2. Handle gateway webhook ────────────────────────────────────────────

  async handleWebhook(
    provider: PaymentProvider,
    payload: Record<string, unknown>,
  ) {
    const gateway = this.resolveGateway(provider);
    const verified = await gateway.verifyCallback(payload);

    if (!verified.isValid) {
      throw new UnauthorizedException('Invalid webhook signature');
    }

    const transaction = await this.paymentTransactionQueries.findOne({
      where: { transactionId: verified.providerTransactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    // Idempotency: skip if already in a terminal state
    const terminalStatuses: PaymentStatus[] = [
      PaymentStatus.SUCCESS,
      PaymentStatus.FAILED,
      PaymentStatus.REFUNDED,
    ];
    if (terminalStatuses.includes(transaction.status)) {
      return { received: true };
    }

    // TODO: push to BullMQ queue instead of processing inline
    await this.prisma.$transaction(async (tx) => {
      await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.SUCCESS,
          callbackPayload: verified.rawPayload as Prisma.InputJsonValue,
        },
      });

      await tx.order.update({
        where: { id: transaction.orderId },
        data: { status: 'CONFIRMED' },
      });
    });

    // Notify subscribed clients that payment succeeded
    this.paymentSocketGateway.emitSuccess({
      orderId: transaction.orderId,
      transactionId: transaction.id,
      status: PaymentStatus.SUCCESS,
    });

    return { received: true };
  }

  // ─── 3. Query payment status ──────────────────────────────────────────────

  async getStatus(orderId: number, userId: number, userType: UserType) {
    const where =
      userType === UserType.CUSTOMER
        ? { orderId, order: { userId } }
        : { orderId };

    const transactions = await this.paymentTransactionQueries.find({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return transactions;
  }

  // ─── 4. Refund ────────────────────────────────────────────────────────────

  async refund(dto: RefundPaymentDto) {
    const transaction = await this.paymentTransactionQueries.findOne({
      where: { id: dto.transactionId },
    });

    if (!transaction) {
      throw new NotFoundException('Payment transaction not found');
    }

    if (transaction.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestException(
        'Only SUCCESS transactions can be refunded',
      );
    }

    if (!transaction.transactionId) {
      throw new BadRequestException('Provider transaction id is missing');
    }

    const gateway = this.resolveGateway(transaction.provider);
    const result = await gateway.refund({
      providerTransactionId: transaction.transactionId,
      amount: Number(transaction.amount),
      reason: dto.reason,
    });

    if (result.success) {
      await this.paymentTransactionRepository.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.REFUNDED,
          rawResponse: result.rawResponse as Prisma.InputJsonValue,
        },
      });
    }

    return result;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private resolveGateway(provider: PaymentProvider): PaymentGateway {
    const gateway = this.gatewayMap.get(provider);
    if (!gateway) {
      throw new BadRequestException(
        `Unsupported payment provider: ${provider}`,
      );
    }
    return gateway;
  }
}
