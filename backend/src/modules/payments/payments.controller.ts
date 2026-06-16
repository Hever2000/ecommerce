import {
  Controller, Post, Get, Param, Body, Headers, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { CreatePreferenceResponseDto } from './dto/create-preference-response.dto';
import { WebhookQueryDto } from './dto/webhook-query.dto';

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
    @Headers('x-request-id') requestId?: string,
    @Query() query?: WebhookQueryDto,
  ) {
    return this.paymentsService.handleWebhook(
      payload,
      { 'x-signature': signature, 'x-request-id': requestId },
      query?.['data.id'],
    );
  }

  @Public()
  @Post(':orderId/preference')
  @ApiOperation({ summary: 'Create payment preference for order' })
  async createPreference(
    @Param('orderId', ParseUUIDPipe) orderId: string,
  ): Promise<CreatePreferenceResponseDto> {
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
