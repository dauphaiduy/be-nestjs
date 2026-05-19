import { PaymentProvider } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CheckoutPaymentDto {
  @IsInt()
  @Min(1)
  orderId: number;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsUrl({
    require_tld: false,
  })
  returnUrl: string;

  @IsOptional()
  @IsString()
  description?: string;
}
