import {
  Controller, Get, Post, Body, Param, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Inventory')
@ApiBearerAuth()
@Roles('ADMIN', 'EMPLOYEE')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  @Permissions('ADJUST_INVENTORY')
  @ApiOperation({ summary: 'Adjust stock for a variant' })
  adjust(
    @Body() dto: AdjustInventoryDto,
    @CurrentUser() user: any,
  ) {
    return this.inventoryService.adjust(dto, user?.id);
  }

  @Get('low-stock')
  @Permissions('VIEW_INVENTORY')
  @ApiOperation({ summary: 'Get low stock alerts' })
  getLowStock(@Query('threshold') threshold?: number) {
    return this.inventoryService.getLowStock(threshold);
  }

  @Get('movements/:variantId')
  @Permissions('VIEW_INVENTORY')
  @ApiOperation({ summary: 'Get inventory movements for a variant' })
  getMovements(
    @Param('variantId', ParseUUIDPipe) variantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.inventoryService.getMovements(variantId, page || 1, limit || 20);
  }
}
