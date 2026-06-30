import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CreateVariantDto {
  @ApiProperty({ example: 'REM-NEG-S' })
  @IsString()
  sku: string;

  @ApiProperty({ example: 14999.0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50 })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: ['f0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000005'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attributeValueIds?: string[];
}

class CreateAttributeDto {
  @ApiProperty({ example: 'e0000000-0000-0000-0000-000000000001' })
  @IsUUID()
  attributeId: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'Remera Premium' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'remera-premium' })
  @IsString()
  slug: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 14999.0 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ type: [CreateAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeDto)
  attributes?: CreateAttributeDto[];

  @ApiPropertyOptional({ type: [CreateVariantDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants?: CreateVariantDto[];
}
