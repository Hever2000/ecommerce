import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus, ShippingType } from '@prisma/client';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private shippingService: ShippingService,
  ) {}

  async create(dto: CreateOrderDto) {
    // Validate and calculate items
    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: { in: dto.items.map((i) => i.variantId) },
        isActive: true,
      },
      include: { product: true },
    });

    if (variants.length !== dto.items.length) {
      throw new BadRequestException('Some variants were not found or are inactive');
    }

    const variantMap = new Map(variants.map((v) => [v.id, v]));

    let subtotal = 0;
    const orderItemsData: {
      variantId: string;
      quantity: number;
      unitPrice: any;
      totalPrice: number;
    }[] = [];

    for (const item of dto.items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) {
        throw new NotFoundException(`Variant ${item.variantId} not found`);
      }

      if (variant.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for variant ${variant.sku}. Available: ${variant.stock}`,
        );
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

    // Calculate shipping
    let shippingCost = 0;
    if (dto.shippingType === ShippingType.HOME_DELIVERY) {
      const shipping = this.shippingService.calculateCost(
        dto.guestProvince,
        subtotal,
        dto.items.length,
      );
      shippingCost = shipping.cost;
    }

    const total = subtotal + shippingCost;

    // Create order with items and decrement stock in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      // Decrement stock
      for (const item of dto.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });

        // Log inventory movement
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            type: 'REMOVE',
            quantity: item.quantity,
            reason: `Order placement`,
          },
        });
      }

      // Create order
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
          status: OrderStatus.PENDING,
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

  async findAll(page = 1, limit = 20, status?: OrderStatus) {
    const where: any = {};
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

  async findOne(id: string) {
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
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.findOne(id);

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PAID, OrderStatus.FAILED, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.FAILED]: [OrderStatus.PENDING],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.SHIPPED]: [],
    };

    if (!validTransitions[order.status].includes(status)) {
      throw new BadRequestException(`Cannot transition from ${order.status} to ${status}`);
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

  async getOrderByPreferenceId(preferenceId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { mpPreferenceId: preferenceId },
      include: { order: true },
    });
    return payment?.order || null;
  }
}
