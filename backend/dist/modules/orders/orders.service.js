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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const shipping_service_1 = require("../shipping/shipping.service");
const client_1 = require("@prisma/client");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(prisma, shippingService) {
        this.prisma = prisma;
        this.shippingService = shippingService;
        this.logger = new common_1.Logger(OrdersService_1.name);
    }
    async create(dto) {
        const variants = await this.prisma.productVariant.findMany({
            where: {
                id: { in: dto.items.map((i) => i.variantId) },
                isActive: true,
            },
            include: { product: true },
        });
        if (variants.length !== dto.items.length) {
            throw new common_1.BadRequestException('Some variants were not found or are inactive');
        }
        const variantMap = new Map(variants.map((v) => [v.id, v]));
        let subtotal = 0;
        const orderItemsData = [];
        for (const item of dto.items) {
            const variant = variantMap.get(item.variantId);
            if (!variant) {
                throw new common_1.NotFoundException(`Variant ${item.variantId} not found`);
            }
            if (variant.stock < item.quantity) {
                throw new common_1.BadRequestException(`Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}`);
            }
            const totalPrice = Number(variant.price) * item.quantity;
            subtotal += totalPrice;
            orderItemsData.push({
                variantId: item.variantId,
                quantity: item.quantity,
                unitPrice: variant.price,
                totalPrice,
            });
        }
        let shippingCost = 0;
        if (dto.shippingType === client_1.ShippingType.HOME_DELIVERY) {
            const shipping = this.shippingService.calculateCost(dto.guestProvince, subtotal, dto.items.length);
            shippingCost = shipping.cost;
        }
        const total = subtotal + shippingCost;
        const order = await this.prisma.$transaction(async (tx) => {
            for (const item of dto.items) {
                await tx.productVariant.update({
                    where: { id: item.variantId },
                    data: { stock: { decrement: item.quantity } },
                });
                await tx.inventoryMovement.create({
                    data: {
                        variantId: item.variantId,
                        type: 'REMOVE',
                        quantity: item.quantity,
                        reason: `Order placement`,
                    },
                });
            }
            return tx.order.create({
                data: {
                    guestEmail: dto.guestEmail,
                    guestFirstName: dto.guestFirstName,
                    guestLastName: dto.guestLastName,
                    guestPhone: dto.guestPhone,
                    guestAddress: dto.guestAddress,
                    guestCity: dto.guestCity,
                    guestProvince: dto.guestProvince,
                    guestPostalCode: dto.guestPostalCode,
                    shippingType: dto.shippingType,
                    shippingCost,
                    subtotal,
                    total,
                    status: client_1.OrderStatus.PENDING,
                    items: {
                        create: orderItemsData,
                    },
                },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: {
                                    product: true,
                                    variantAttributeValues: {
                                        include: { attributeValue: { include: { attribute: true } } },
                                    },
                                },
                            },
                        },
                    },
                },
            });
        });
        this.logger.log(`Order created: ${order.id} - Total: ${order.total}`);
        return order;
    }
    async findAll(page = 1, limit = 20, status) {
        const where = {};
        if (status) {
            where.status = status;
        }
        const skip = (page - 1) * limit;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip,
                take: limit,
                include: {
                    items: {
                        include: {
                            variant: {
                                select: {
                                    id: true,
                                    sku: true,
                                    price: true,
                                    product: { select: { id: true, name: true, slug: true } },
                                },
                            },
                        },
                    },
                    payments: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);
        return {
            data: orders,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    async findOne(id) {
        const order = await this.prisma.order.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: {
                                product: true,
                                variantAttributeValues: {
                                    include: { attributeValue: { include: { attribute: true } } },
                                },
                            },
                        },
                    },
                },
                payments: true,
            },
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        return order;
    }
    async updateStatus(id, status) {
        const order = await this.findOne(id);
        const validTransitions = {
            [client_1.OrderStatus.PENDING]: [client_1.OrderStatus.PAID, client_1.OrderStatus.FAILED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.PAID]: [client_1.OrderStatus.SHIPPED, client_1.OrderStatus.CANCELLED],
            [client_1.OrderStatus.FAILED]: [client_1.OrderStatus.PENDING],
            [client_1.OrderStatus.CANCELLED]: [],
            [client_1.OrderStatus.SHIPPED]: [],
        };
        if (!validTransitions[order.status].includes(status)) {
            throw new common_1.BadRequestException(`Cannot transition from ${order.status} to ${status}`);
        }
        const updated = await this.prisma.order.update({
            where: { id },
            data: { status },
            include: {
                items: true,
                payments: true,
            },
        });
        this.logger.log(`Order ${id} status updated: ${order.status} -> ${status}`);
        return updated;
    }
    async getOrderByPreferenceId(preferenceId) {
        const payment = await this.prisma.payment.findFirst({
            where: { mpPreferenceId: preferenceId },
            include: { order: true },
        });
        return payment?.order || null;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        shipping_service_1.ShippingService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map