import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsInt()
  @Min(1)
  transactionId: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
