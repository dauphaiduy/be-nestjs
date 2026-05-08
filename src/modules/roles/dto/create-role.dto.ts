import { IsJSON, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsJSON()
  permissions?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
