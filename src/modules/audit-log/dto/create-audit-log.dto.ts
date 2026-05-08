import { IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAuditLogDto {
  @IsOptional()
  @IsInt()
  userId?: number;

  @IsString()
  action: string;

  @IsString()
  resource: string;

  @IsOptional()
  @IsString()
  resourceId?: string;

  @IsOptional()
  @IsInt()
  statusCode?: number;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
