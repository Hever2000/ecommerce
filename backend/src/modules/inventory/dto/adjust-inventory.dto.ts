import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustInventoryDto {
  @ApiProperty({ example: '20000000-0000-0000-0000-000000000001' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ example: 'ADD' })
  @IsString()
  type: 'ADD' | 'REMOVE' | 'SET';

  @ApiPropertyOptional({ example: 'Stock inicial' })
  @IsOptional()
  @IsString()
  reason?: string;
}
