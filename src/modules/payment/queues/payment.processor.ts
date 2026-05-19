/**
 * PaymentProcessor — BullMQ worker for async payment processing.
 *
 * TODO: Install BullMQ and @nestjs/bullmq, then replace this stub:
 *   npm install @nestjs/bullmq bullmq
 *
 * Uncomment the code below after installing.
 */

// import { Processor, WorkerHost } from '@nestjs/bullmq';
// import { Job } from 'bullmq';
// import { PaymentStatus } from '@prisma/client';
// import { PrismaService } from 'src/common/prisma';

export const PAYMENT_QUEUE_NAME = 'payment';

export const PAYMENT_JOBS = {
  PROCESS_WEBHOOK: 'process-webhook',
  RECONCILE: 'reconcile',
} as const;

// @Processor(PAYMENT_QUEUE_NAME)
// export class PaymentProcessor extends WorkerHost {
//   constructor(private readonly prisma: PrismaService) {
//     super();
//   }
//
//   async process(job: Job): Promise<void> {
//     switch (job.name) {
//       case PAYMENT_JOBS.PROCESS_WEBHOOK:
//         return this.handleWebhook(job.data);
//       case PAYMENT_JOBS.RECONCILE:
//         return this.handleReconcile(job.data);
//     }
//   }
//
//   private async handleWebhook(data: {
//     transactionId: number;
//     status: PaymentStatus;
//     orderId: number;
//   }): Promise<void> {
//     await this.prisma.$transaction(async (tx) => {
//       const existing = await tx.paymentTransaction.findUnique({
//         where: { id: data.transactionId },
//       });
//
//       // Idempotency: skip if already finalised
//       if (existing?.status === PaymentStatus.SUCCESS) return;
//
//       await tx.paymentTransaction.update({
//         where: { id: data.transactionId },
//         data: { status: data.status },
//       });
//
//       if (data.status === PaymentStatus.SUCCESS) {
//         await tx.order.update({
//           where: { id: data.orderId },
//           data: { status: 'CONFIRMED' },
//         });
//       }
//
//       // TODO: emit Kafka event
//     });
//   }
//
//   private async handleReconcile(_data: unknown): Promise<void> {
//     // TODO: query pending transactions older than 30 min, reconcile with gateway
//   }
// }
