import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Accesorios' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'accesorios' })
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Accesorios en general' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'd0000000-0000-0000-0000-000000000001' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
