import { Logger, UnauthorizedException } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PaymentStatus } from '@prisma/client';

export interface PaymentStatusPayload {
  orderId: number;
  transactionId: number;
  status: PaymentStatus;
  paymentUrl?: string | null;
  qrCode?: string | null;
  provider?: string;
}

@WebSocketGateway({
  namespace: 'payment',
  cors: { origin: '*' },
})
export class PaymentGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PaymentGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  async handleConnection(client: Socket): Promise<void> {
    const token = this.extractToken(client);
    if (!token) {
      this.logger.warn(`WS: no token — disconnecting ${client.id}`);
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      // Attach decoded user so downstream handlers can reference it
      client.data.user = payload;
      this.logger.log(`WS: connected ${client.id} (user ${payload.sub})`);
    } catch {
      this.logger.warn(`WS: invalid token — disconnecting ${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`WS: disconnected ${client.id}`);
  }

  // ─── Event: subscribe to an order room ────────────────────────────────────

  /**
   * Client emits 'subscribe_payment' with { orderId: number } to start
   * listening for status updates on a specific order.
   *
   * Example (frontend):
   *   socket.emit('subscribe_payment', { orderId: 42 });
   */
  @SubscribeMessage('subscribe_payment')
  async handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { orderId: number },
  ): Promise<void> {
    const room = this.buildRoom(data.orderId);
    await client.join(room);
    this.logger.log(`WS: ${client.id} joined room ${room}`);
    client.emit('subscribed', { orderId: data.orderId, room });
  }

  // ─── Internal emit helpers used by PaymentService ─────────────────────────

  /**
   * Emit when a checkout is initiated — status = PROCESSING.
   * Frontend shows "waiting for payment" spinner.
   */
  emitPending(payload: PaymentStatusPayload): void {
    const room = this.buildRoom(payload.orderId);
    this.server.to(room).emit('payment:pending', payload);
    this.logger.log(
      `WS: payment:pending → room ${room} (txn ${payload.transactionId})`,
    );
  }

  /**
   * Emit when the gateway webhook confirms SUCCESS.
   * Frontend can redirect to order-confirmed page.
   */
  emitSuccess(
    payload: Pick<PaymentStatusPayload, 'orderId' | 'transactionId' | 'status'>,
  ): void {
    const room = this.buildRoom(payload.orderId);
    this.server.to(room).emit('payment:success', payload);
    this.logger.log(
      `WS: payment:success → room ${room} (txn ${payload.transactionId})`,
    );
  }

  /**
   * Emit when the gateway webhook signals FAILED / CANCELLED / EXPIRED.
   * Frontend can show an error state.
   */
  emitFailed(
    payload: Pick<PaymentStatusPayload, 'orderId' | 'transactionId' | 'status'>,
  ): void {
    const room = this.buildRoom(payload.orderId);
    this.server.to(room).emit('payment:failed', payload);
    this.logger.log(
      `WS: payment:failed → room ${room} (txn ${payload.transactionId})`,
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private buildRoom(orderId: number): string {
    return `payment:${orderId}`;
  }

  private extractToken(client: Socket): string | undefined {
    // Try Authorization header first, fall back to handshake auth
    const authHeader: string | undefined =
      client.handshake.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }
    const authToken = (client.handshake.auth as Record<string, unknown>)?.token;
    if (typeof authToken === 'string') {
      return authToken;
    }
    return undefined;
  }
}
