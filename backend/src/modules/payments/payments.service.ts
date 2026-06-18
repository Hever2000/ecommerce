import { Injectable, Logger, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import MercadoPagoConfig, { Preference, Payment as MpPayment } from 'mercadopago';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly mpClient: MercadoPagoConfig;
  private readonly preference: Preference;
  private readonly mpPayment: MpPayment;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: this.config.getOrThrow<string>('MERCADO_PAGO_ACCESS_TOKEN'),
      options: { timeout: 10000 },
    });
    this.preference = new Preference(this.mpClient);
    this.mpPayment = new MpPayment(this.mpClient);
  }

  async createPreference(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            variant: {
              include: { product: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not in PENDING status');
    }

    const items = order.items.map((item) => ({
      id: item.variant.sku,
      title: item.variant.product.name,
      description: `SKU: ${item.variant.sku}`,
      quantity: item.quantity,
      unit_price: Number(item.unitPrice),
      currency_id: 'ARS',
    }));

    const shippingCost = Number(order.shippingCost);
    if (shippingCost > 0) {
      items.push({
        id: 'shipping',
        title: 'Costo de envío',
        description: order.shippingType === 'PICKUP' ? 'Retiro en sucursal' : 'Envío a domicilio',
        quantity: 1,
        unit_price: shippingCost,
        currency_id: 'ARS',
      });
    }

    const frontendUrl = this.config.get<string>('CORS_ORIGIN') || 'http://localhost:3001';

    let result;
    try {
      result = await this.preference.create({
        body: {
          items,
          external_reference: order.id,
          notification_url: `${this.config.get<string>('API_URL') || 'http://localhost:3000'}/api/v1/payments/webhook`,
          back_urls: {
            success: `${frontendUrl}/success?orderId=${order.id}`,
            pending: `${frontendUrl}/pending?orderId=${order.id}`,
            failure: `${frontendUrl}/failed?orderId=${order.id}`,
          },
          auto_return: 'approved',
          statement_descriptor: 'STORE ECOMMERCE',
          payment_methods: {
            excluded_payment_types: [],
            installments: 12,
          },
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to create MP preference: ${err.message}`, err.stack);
      throw new BadRequestException(`Error creating payment preference: ${err.message}`);
    }

    if (!result.id || !result.init_point) {
      throw new BadRequestException('Mercado Pago did not return a valid preference');
    }

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        mpPreferenceId: result.id,
        amount: order.total,
        mpStatus: 'pending',
      },
    });

    const dtoItems = order.items.map((item) => ({
      id: item.variant.sku,
      title: item.variant.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    }));

    return {
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point || result.init_point,
      items: dtoItems,
      total: Number(order.total),
    };
  }

  validateWebhookSignature(
    headers: { 'x-signature'?: string; 'x-request-id'?: string },
    queryDataId?: string,
  ): void {
    const webhookSecret = this.config.get<string>('MERCADO_PAGO_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('WEBHOOK_SECRET not configured — skipping signature validation');
      return;
    }
    try {
      WebhookSignatureValidator.validate({
        xSignature: headers['x-signature'],
        xRequestId: headers['x-request-id'],
        dataId: queryDataId,
        secret: webhookSecret,
        toleranceSeconds: 300,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        this.logger.warn(`Webhook signature validation failed: ${err.reason}`);
        throw new UnauthorizedException('Invalid webhook signature');
      }
      throw err;
    }
  }

  async processWebhook(
    type: string,
    dataId: string,
  ) {
    const mpPaymentId = String(dataId);

    let mpPaymentData;
    try {
      mpPaymentData = await this.mpPayment.get({ id: mpPaymentId });
    } catch (err: any) {
      this.logger.error(`Failed to fetch MP payment ${mpPaymentId}: ${err.message}`);
      return { received: true };
    }

    const externalRef = mpPaymentData.external_reference;
    const payment = externalRef
      ? await this.prisma.payment.findFirst({
          where: { orderId: externalRef },
          include: { order: true },
        })
      : null;

    if (!payment) {
      this.logger.warn(`Payment not found for MP payment ${mpPaymentId}, external_ref: ${externalRef}`);
      if (externalRef) {
        const mpId = mpPaymentData.id != null ? String(mpPaymentData.id) : undefined;
        await this.prisma.payment.create({
          data: {
            orderId: externalRef,
            mpPreferenceId: null,
            mpPaymentId: mpId || mpPaymentId,
            mpStatus: mpPaymentData.status || 'pending',
            mpStatusDetail: mpPaymentData.status_detail || null,
            amount: mpPaymentData.transaction_amount || 0,
          },
        });
      }
      return { received: true };
    }

    const mpStatus = mpPaymentData.status || 'pending';
    const mpStatusDetail = mpPaymentData.status_detail || null;

    const mpId = mpPaymentData.id != null ? String(mpPaymentData.id) : mpPaymentId;
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId: mpId,
        mpStatus,
        mpStatusDetail,
      },
    });

    let orderStatus: OrderStatus;

    switch (mpStatus) {
      case 'approved':
        orderStatus = OrderStatus.PAID;
        break;
      case 'rejected':
      case 'cancelled':
        orderStatus = OrderStatus.FAILED;
        if (payment.order) {
          const items = await this.prisma.orderItem.findMany({
            where: { orderId: payment.order.id },
          });
          for (const item of items) {
            await this.prisma.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
        break;
      case 'pending':
      case 'in_process':
        orderStatus = OrderStatus.PENDING;
        break;
      default:
        orderStatus = OrderStatus.PENDING;
    }

    if (payment.order && payment.order.status !== orderStatus) {
      await this.prisma.order.update({
        where: { id: payment.order.id },
        data: { status: orderStatus },
      });
      this.logger.log(`Order ${payment.order.id} updated to ${orderStatus} via webhook`);
    }

    return { received: true };
  }

  async getPaymentByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
