import { AccountType, UserType } from '@prisma/client';
import { IsEmail, IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsEnum(AccountType)
  accountType: AccountType;

  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsInt()
  roleId?: number;
}
