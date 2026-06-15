import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateShippingDto {
  @ApiProperty({ example: 'Buenos Aires' })
  @IsString()
  province: string;

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ example: 3 })
  @IsNumber()
  @Min(1)
  itemCount: number;
}
