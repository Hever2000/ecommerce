import {
  Controller, Post, Get, Param, Body, Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Mercado Pago webhook endpoint' })
  async webhook(
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
  ) {
    // In production: validate webhook signature
    // const isValid = validateMpSignature(payload, signature);
    return this.paymentsService.handleWebhook(payload);
  }

  @Post(':orderId/preference')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('VIEW_ORDERS')
  @ApiOperation({ summary: 'Create payment preference for order' })
  createPreference(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.createPreference(orderId);
  }

  @Get(':orderId')
  @ApiBearerAuth()
  @Roles('ADMIN', 'EMPLOYEE')
  @Permissions('VIEW_ORDERS')
  @ApiOperation({ summary: 'Get payments for order' })
  getPaymentByOrder(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.paymentsService.getPaymentByOrder(orderId);
  }
}
