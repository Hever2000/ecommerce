import { IsOptional, IsString } from 'class-validator';

export class WebhookQueryDto {
  @IsOptional()
  @IsString()
  'data.id'?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
