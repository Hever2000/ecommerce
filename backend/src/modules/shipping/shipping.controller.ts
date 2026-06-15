import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Public()
  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate shipping cost' })
  calculate(@Body() dto: CalculateShippingDto) {
    return this.shippingService.calculateCost(dto.province, dto.subtotal, dto.itemCount);
  }

  @Public()
  @Get('pickup')
  @ApiOperation({ summary: 'Get pickup shipping info' })
  getPickup() {
    return this.shippingService.getPickupCost();
  }
}
