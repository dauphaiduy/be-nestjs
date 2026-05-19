import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { PaymentProvider } from '@prisma/client';

// Using a static Set of individual enum values avoids passing the enum object
// itself to Object.keys/values, which triggers @typescript-eslint/no-unsafe-argument.
const VALID_PROVIDERS = new Set<string>([
  PaymentProvider.MOMO,
  PaymentProvider.ZALOPAY,
  PaymentProvider.VNPAY,
  PaymentProvider.SEPAY,
]);

@Injectable()
export class ParsePaymentProviderPipe implements PipeTransform {
  transform(value: string): PaymentProvider {
    const upper = (value ?? '').toUpperCase();
    if (!VALID_PROVIDERS.has(upper)) {
      throw new BadRequestException(
        `Invalid payment provider "${value}". Valid values: ${[...VALID_PROVIDERS].join(', ')}`,
      );
    }
    return upper as PaymentProvider;
  }
}
