import { OrderStatus } from '@prisma/client';
import { IsEnum, IsNotIn } from 'class-validator';

// Clients cannot set REFUNDED via this DTO — only admins via a dedicated endpoint
const FORBIDDEN_TRANSITIONS: OrderStatus[] = [OrderStatus.REFUNDED];

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @IsNotIn(FORBIDDEN_TRANSITIONS, {
    message: `Cannot set status to REFUNDED via this endpoint`,
  })
  status: OrderStatus;
}
