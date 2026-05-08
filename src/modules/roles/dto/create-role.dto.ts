import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  @IsOptional()
  @IsString()
  description?: string;
}
