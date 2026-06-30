import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async adjust(dto: AdjustInventoryDto, userId?: string) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    let newStock: number;

    switch (dto.type) {
      case 'ADD':
        newStock = variant.stock + dto.quantity;
        break;
      case 'REMOVE':
        newStock = variant.stock - dto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Insufficient stock');
        }
        break;
      case 'SET':
        newStock = dto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Stock cannot be negative');
        }
        break;
      default:
        throw new BadRequestException('Invalid adjustment type');
    }

    await this.prisma.$transaction([
      this.prisma.productVariant.update({
        where: { id: dto.variantId },
        data: { stock: newStock },
      }),
      this.prisma.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          type: dto.type,
          quantity: dto.quantity,
          reason: dto.reason,
          userId,
        },
      }),
    ]);

    this.logger.log(
      `Inventory adjusted: ${variant.sku} (${dto.type}: ${dto.quantity}) -> ${newStock}`,
    );

    return { variantId: dto.variantId, sku: variant.sku, previousStock: variant.stock, newStock };
  }

  async getMovements(variantId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [movements, total] = await Promise.all([
      this.prisma.inventoryMovement.findMany({
        where: { variantId },
        skip,
        take: limit,
        include: { user: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inventoryMovement.count({ where: { variantId } }),
    ]);

    return {
      data: movements,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getLowStock(threshold = 10) {
    const variants = await this.prisma.productVariant.findMany({
      where: { stock: { lte: threshold }, isActive: true },
      include: {
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { stock: 'asc' },
    });

    return variants;
  }
}
