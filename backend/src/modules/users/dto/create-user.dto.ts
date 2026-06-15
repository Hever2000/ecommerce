import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'employee@ecommerce.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Employee123!' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: '+5491123456789' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'b0000000-0000-0000-0000-000000000002' })
  @IsString()
  roleId: string;
}
