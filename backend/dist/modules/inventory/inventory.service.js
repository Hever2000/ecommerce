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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    async adjust(dto, userId) {
        const variant = await this.prisma.productVariant.findUnique({
            where: { id: dto.variantId },
        });
        if (!variant) {
            throw new common_1.NotFoundException('Variant not found');
        }
        let newStock;
        switch (dto.type) {
            case 'ADD':
                newStock = variant.stock + dto.quantity;
                break;
            case 'REMOVE':
                newStock = variant.stock - dto.quantity;
                if (newStock < 0) {
                    throw new common_1.BadRequestException('Insufficient stock');
                }
                break;
            case 'SET':
                newStock = dto.quantity;
                if (newStock < 0) {
                    throw new common_1.BadRequestException('Stock cannot be negative');
                }
                break;
            default:
                throw new common_1.BadRequestException('Invalid adjustment type');
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
        this.logger.log(`Inventory adjusted: ${variant.sku} (${dto.type}: ${dto.quantity}) -> ${newStock}`);
        return { variantId: dto.variantId, sku: variant.sku, previousStock: variant.stock, newStock };
    }
    async getMovements(variantId, page = 1, limit = 20) {
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
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map