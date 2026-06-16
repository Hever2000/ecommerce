import { PrismaService } from '../../prisma/prisma.service';
import { AdjustInventoryDto } from './dto/adjust-inventory.dto';
export declare class InventoryService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    adjust(dto: AdjustInventoryDto, userId?: string): Promise<{
        variantId: string;
        sku: string;
        previousStock: number;
        newStock: number;
    }>;
    getMovements(variantId: string, page?: number, limit?: number): Promise<{
        data: ({
            user: {
                email: string;
                id: string;
            } | null;
        } & {
            type: string;
            id: string;
            createdAt: Date;
            userId: string | null;
            variantId: string;
            quantity: number;
            reason: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getLowStock(threshold?: number): Promise<({
        product: {
            name: string;
            id: string;
            slug: string;
        };
    } & {
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        sku: string;
        price: import("@prisma/client/runtime/library").Decimal;
        stock: number;
        productId: string;
    })[]>;
}
