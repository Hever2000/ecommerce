import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

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

    // In production, this calls Mercado Pago API
    // For now, we create a payment record and return a simulated preference
    const preferenceId = `pref_${order.id}_${Date.now()}`;

    await this.prisma.payment.create({
      data: {
        orderId: order.id,
        mpPreferenceId: preferenceId,
        amount: order.total,
        mpStatus: 'pending',
      },
    });

    const items = order.items.map((item) => ({
      id: item.variant.sku,
      title: item.variant.product.name,
      description: `SKU: ${item.variant.sku}`,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      currencyId: 'ARS',
    }));

    return {
      preferenceId,
      initPoint: `https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=${preferenceId}`,
      items,
      total: Number(order.total),
    };
  }

  async handleWebhook(payload: any) {
    this.logger.log(`Webhook received: ${JSON.stringify(payload)}`);

    const { type, data } = payload;

    if (type !== 'payment' || !data?.id) {
      this.logger.log(`Ignoring webhook type: ${type}`);
      return { received: true };
    }

    const paymentId = data.id.toString();

    // In production, call MP API to get payment details
    // For simulation, we extract from the payload or fetch from MP
    const mpPaymentId = paymentId;

    // Find payment by preference ID or external reference
    const payment = await this.prisma.payment.findFirst({
      where: { mpPreferenceId: data.preference_id || undefined },
      include: { order: true },
    });

    if (!payment) {
      this.logger.warn(`Payment not found for MP payment ${mpPaymentId}`);
      return { received: true };
    }

    // Update payment record
    const mpStatus = data.status || 'approved';
    const mpStatusDetail = data.status_detail || null;

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        mpPaymentId,
        mpStatus,
        mpStatusDetail,
      },
    });

    // Update order status based on payment
    let orderStatus: OrderStatus;

    switch (mpStatus) {
      case 'approved':
        orderStatus = OrderStatus.PAID;
        break;
      case 'rejected':
      case 'cancelled':
        orderStatus = OrderStatus.FAILED;

        // Restore stock on failure
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

      this.logger.log(
        `Order ${payment.order.id} updated to ${orderStatus} via webhook`,
      );
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
