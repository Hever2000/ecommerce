import { Controller, Post, Get, Param, Body, Headers, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ParseUUIDPipe } from '../../common/pipes/parse-uuid.pipe';
import { CreatePreferenceResponseDto } from './dto/create-preference-response.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Mercado Pago webhook endpoint (IPN)' })
  async webhook(
    @Body() payload: any,
    @Headers('x-signature') signature?: string,
    @Headers('x-request-id') requestId?: string,
    @Query('topic') topic?: string,
    @Query('id') queryId?: string,
    @Query('data.id') dataId?: string,
    @Query('type') queryType?: string,
  ) {
    const headers = { 'x-signature': signature, 'x-request-id': requestId };

    this.paymentsService.validateWebhookSignature(headers, dataId || queryId);

    const paymentId = payload?.data?.id || queryId || dataId;

    if (paymentId) {
      this.paymentsService
        .processWebhook('payment', String(paymentId))
        .catch((err) => this.logger.error(`Webhook processing failed: ${err.message}`, err.stack));
    } else {
      this.logger.log(
        `Webhook received without payment ID — topic: ${topic || queryType || 'unknown'}, body: ${JSON.stringify(payload).slice(0, 500)}`,
      );
    }

    return { received: true };
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
