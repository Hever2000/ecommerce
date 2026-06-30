import { Injectable, Logger } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendOrderConfirmation(order: any) {
    const html = this.buildOrderEmail(order, 'Orden Confirmada');
    await this.send({
      to: order.guestEmail,
      subject: `Orden #${order.id.slice(0, 8)} - Confirmada`,
      html,
    });
  }

  async sendPaymentApproved(order: any) {
    const html = this.buildOrderEmail(order, 'Pago Aprobado');
    await this.send({
      to: order.guestEmail,
      subject: `Orden #${order.id.slice(0, 8)} - Pago Aprobado`,
      html,
    });
  }

  async sendPaymentRejected(order: any) {
    const html = this.buildOrderEmail(order, 'Pago Rechazado');
    await this.send({
      to: order.guestEmail,
      subject: `Orden #${order.id.slice(0, 8)} - Pago Rechazado`,
      html,
    });
  }

  async sendOrderShipped(order: any) {
    const html = this.buildOrderEmail(order, 'Pedido Enviado');
    await this.send({
      to: order.guestEmail,
      subject: `Orden #${order.id.slice(0, 8)} - Pedido Enviado`,
      html,
    });
  }

  private buildOrderEmail(order: any, status: string): string {
    const itemsHtml = order.items
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">
            ${item.variant?.product?.name || 'Producto'} (${item.variant?.sku || ''})
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            $${Number(item.unitPrice).toLocaleString('es-AR')}
          </td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
            $${Number(item.totalPrice).toLocaleString('es-AR')}
          </td>
        </tr>
      `,
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden;">
          <div style="background: #1d4ed8; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${status}</h1>
          </div>
          <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px;">Hola <strong>${order.guestFirstName}</strong>,</p>
            <p style="color: #666; font-size: 14px;">
              Tu orden <strong>#${order.id.slice(0, 8)}</strong> ha sido actualizada.
            </p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <thead>
                <tr style="background: #f8f8f8;">
                  <th style="padding: 10px; text-align: left;">Producto</th>
                  <th style="padding: 10px; text-align: center;">Cant.</th>
                  <th style="padding: 10px; text-align: right;">Precio</th>
                  <th style="padding: 10px; text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div style="border-top: 2px solid #1d4ed8; padding-top: 10px; text-align: right;">
              <p><strong>Subtotal:</strong> $${Number(order.subtotal).toLocaleString('es-AR')}</p>
              <p><strong>Envío:</strong> $${Number(order.shippingCost).toLocaleString('es-AR')}</p>
              <p style="font-size: 18px;"><strong>Total:</strong> $${Number(order.total).toLocaleString('es-AR')}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background: #f8f8f8; border-radius: 6px;">
              <p style="margin: 0; color: #666; font-size: 13px;">
                <strong>Dirección de envío:</strong><br>
                ${order.guestAddress}, ${order.guestCity}, ${order.guestProvince} (CP: ${order.guestPostalCode})
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async send(options: EmailOptions) {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey || apiKey.startsWith('re_')) {
      this.logger.log(`[EMAIL SIMULATED] To: ${options.to}, Subject: ${options.subject}`);
      this.logger.debug(`HTML: ${options.html.substring(0, 200)}...`);
      return { id: `sim_${Date.now()}`, to: options.to };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@ecommerce.com',
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      const result = await response.json();
      this.logger.log(`Email sent to ${options.to}: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error}`);
      return { error: 'Failed to send email' };
    }
  }
}
