import {
  IsString, IsEmail, IsArray, ValidateNested, IsNumber, Min, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ShippingType } from '@prisma/client';

class OrderItemDto {
  @ApiProperty({ example: '20000000-0000-0000-0000-000000000001' })
  @IsString()
  variantId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'juan@perez.com' })
  @IsEmail()
  guestEmail: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  guestFirstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  guestLastName: string;

  @ApiProperty({ example: '+5491123456789' })
  @IsString()
  guestPhone: string;

  @ApiProperty({ example: 'Av. Siempre Viva 123' })
  @IsString()
  guestAddress: string;

  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  guestCity: string;

  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  guestProvince: string;

  @ApiProperty({ example: '1000' })
  @IsString()
  guestPostalCode: string;

  @ApiProperty({ enum: ShippingType })
  @IsEnum(ShippingType)
  shippingType: ShippingType;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
