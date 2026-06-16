"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mercadopago_1 = require("mercadopago");
const mercadopago_2 = require("mercadopago");
const prisma_service_1 = require("../../prisma/prisma.service");
const client_1 = require("@prisma/client");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(PaymentsService_1.name);
        this.mpClient = new mercadopago_1.default({
            accessToken: this.config.getOrThrow('MERCADO_PAGO_ACCESS_TOKEN'),
            options: { timeout: 10000 },
        });
        this.preference = new mercadopago_1.Preference(this.mpClient);
        this.mpPayment = new mercadopago_1.Payment(this.mpClient);
    }
    async createPreference(orderId) {
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
            throw new common_1.BadRequestException('Order not found');
        }
        if (order.status !== client_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Order is not in PENDING status');
        }
        const items = order.items.map((item) => ({
            id: item.variant.sku,
            title: item.variant.product.name,
            description: `SKU: ${item.variant.sku}`,
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            currency_id: 'ARS',
        }));
        const frontendUrl = this.config.get('CORS_ORIGIN') || 'http://localhost:3001';
        let result;
        try {
            result = await this.preference.create({
                body: {
                    items,
                    external_reference: order.id,
                    notification_url: `${this.config.get('API_URL') || 'http://localhost:3000'}/api/v1/payments/webhook`,
                    back_urls: {
                        success: `${frontendUrl}/success`,
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
        }
        catch (err) {
            this.logger.error(`Failed to create MP preference: ${err.message}`, err.stack);
            throw new common_1.BadRequestException(`Error creating payment preference: ${err.message}`);
        }
        if (!result.id || !result.init_point) {
            throw new common_1.BadRequestException('Mercado Pago did not return a valid preference');
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
    async handleWebhook(body, headers, queryDataId) {
        this.logger.log(`Webhook received: type=${body.type}, action=${body.action}`);
        const { type, data } = body;
        if (type !== 'payment' || !data?.id) {
            this.logger.log(`Ignoring webhook type: ${type}`);
            return { received: true };
        }
        try {
            const webhookSecret = this.config.get('MERCADO_PAGO_WEBHOOK_SECRET');
            if (webhookSecret) {
                mercadopago_2.WebhookSignatureValidator.validate({
                    xSignature: headers['x-signature'],
                    xRequestId: headers['x-request-id'],
                    dataId: queryDataId,
                    secret: webhookSecret,
                    toleranceSeconds: 300,
                });
            }
            else {
                this.logger.warn('WEBHOOK_SECRET not configured — skipping signature validation');
            }
        }
        catch (err) {
            if (err instanceof mercadopago_2.InvalidWebhookSignatureError) {
                this.logger.warn(`Webhook signature validation failed: ${err.reason}`);
                throw new common_1.UnauthorizedException('Invalid webhook signature');
            }
            throw err;
        }
        const mpPaymentId = String(data.id);
        let mpPaymentData;
        try {
            mpPaymentData = await this.mpPayment.get({ id: mpPaymentId });
        }
        catch (err) {
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
        let orderStatus;
        switch (mpStatus) {
            case 'approved':
                orderStatus = client_1.OrderStatus.PAID;
                break;
            case 'rejected':
            case 'cancelled':
                orderStatus = client_1.OrderStatus.FAILED;
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
                orderStatus = client_1.OrderStatus.PENDING;
                break;
            default:
                orderStatus = client_1.OrderStatus.PENDING;
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
    async getPaymentByOrder(orderId) {
        return this.prisma.payment.findMany({
            where: { orderId },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map