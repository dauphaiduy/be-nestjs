import { AccountType } from '@prisma/client';
import { IsEmail, IsEnum, IsString } from 'class-validator';

export class RegisterDto {
  @IsString()
  username: string;
  @IsString()
  password: string;
  @IsEmail()
  email: string;
  @IsString()
  name: string;
  @IsEnum(AccountType)
  accountType: AccountType;
}
