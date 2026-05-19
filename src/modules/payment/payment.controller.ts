import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaymentProvider, UserType } from '@prisma/client';
import { Public } from 'src/common/decorators';
import { CurrentUser } from 'src/common/decorators';
import { PaymentService } from './payment.service';
import { CheckoutPaymentDto, QueryPaymentDto, RefundPaymentDto } from './dto';
import { ParsePaymentProviderPipe } from './pipes/parse-payment-provider.pipe';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  /**
   * POST /payments/checkout
   * Authenticated customer initiates payment for an order.
   */
  @Post('checkout')
  checkout(
    @CurrentUser() user: { sub: number },
    @Body() dto: CheckoutPaymentDto,
  ) {
    return this.paymentService.checkout(user.sub, dto);
  }

  /**
   * POST /payments/webhook/:provider
   * Called by payment gateway — must stay Public (no JWT).
   * Signature is verified inside the service.
   */
  @Public()
  @Post('webhook/:provider')
  webhook(
    @Param('provider', ParsePaymentProviderPipe) provider: PaymentProvider,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.paymentService.handleWebhook(provider, payload);
  }

  /**
   * GET /payments/status/:orderId
   * Returns payment transactions for an order.
   */
  @Get('status/:orderId')
  getStatus(
    @CurrentUser() user: { sub: number; userType: UserType },
    @Param('orderId', ParseIntPipe) orderId: number,
  ) {
    return this.paymentService.getStatus(orderId, user.sub, user.userType);
  }

  /**
   * POST /payments/refund
   * Admin/Staff refunds a payment transaction.
   */
  @Post('refund')
  refund(@Body() dto: RefundPaymentDto) {
    return this.paymentService.refund(dto);
  }
}
