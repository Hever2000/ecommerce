import { PrismaService } from '../../prisma/prisma.service';
import { ShippingService } from '../shipping/shipping.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
export declare class OrdersService {
    private prisma;
    private shippingService;
    private readonly logger;
    constructor(prisma: PrismaService, shippingService: ShippingService);
    create(dto: CreateOrderDto): Promise<{
        items: ({
            variant: {
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    slug: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    categoryId: string | null;
                };
                variantAttributeValues: ({
                    attributeValue: {
                        attribute: {
                            name: string;
                            id: string;
                            createdAt: Date;
                        };
                    } & {
                        id: string;
                        createdAt: Date;
                        attributeId: string;
                        value: string;
                    };
                } & {
                    id: string;
                    attributeValueId: string;
                    variantId: string;
                })[];
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                sku: string;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                productId: string;
            };
        } & {
            id: string;
            variantId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        guestEmail: string;
        guestFirstName: string;
        guestLastName: string;
        guestPhone: string;
        guestAddress: string;
        guestCity: string;
        guestProvince: string;
        guestPostalCode: string;
        shippingType: import(".prisma/client").$Enums.ShippingType;
        shippingCost: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
    }>;
    findAll(page?: number, limit?: number, status?: OrderStatus): Promise<{
        data: ({
            items: ({
                variant: {
                    product: {
                        name: string;
                        id: string;
                        slug: string;
                    };
                    id: string;
                    sku: string;
                    price: import("@prisma/client/runtime/library").Decimal;
                };
            } & {
                id: string;
                variantId: string;
                quantity: number;
                unitPrice: import("@prisma/client/runtime/library").Decimal;
                totalPrice: import("@prisma/client/runtime/library").Decimal;
                orderId: string;
            })[];
            payments: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                orderId: string;
                mpPreferenceId: string | null;
                mpPaymentId: string | null;
                mpStatus: string | null;
                mpStatusDetail: string | null;
                amount: import("@prisma/client/runtime/library").Decimal;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            total: import("@prisma/client/runtime/library").Decimal;
            guestEmail: string;
            guestFirstName: string;
            guestLastName: string;
            guestPhone: string;
            guestAddress: string;
            guestCity: string;
            guestProvince: string;
            guestPostalCode: string;
            shippingType: import(".prisma/client").$Enums.ShippingType;
            shippingCost: import("@prisma/client/runtime/library").Decimal;
            subtotal: import("@prisma/client/runtime/library").Decimal;
            status: import(".prisma/client").$Enums.OrderStatus;
            notes: string | null;
        })[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<{
        items: ({
            variant: {
                product: {
                    description: string | null;
                    name: string;
                    id: string;
                    isActive: boolean;
                    createdAt: Date;
                    updatedAt: Date;
                    deletedAt: Date | null;
                    slug: string;
                    basePrice: import("@prisma/client/runtime/library").Decimal;
                    categoryId: string | null;
                };
                variantAttributeValues: ({
                    attributeValue: {
                        attribute: {
                            name: string;
                            id: string;
                            createdAt: Date;
                        };
                    } & {
                        id: string;
                        createdAt: Date;
                        attributeId: string;
                        value: string;
                    };
                } & {
                    id: string;
                    attributeValueId: string;
                    variantId: string;
                })[];
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                sku: string;
                price: import("@prisma/client/runtime/library").Decimal;
                stock: number;
                productId: string;
            };
        } & {
            id: string;
            variantId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        })[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            mpPreferenceId: string | null;
            mpPaymentId: string | null;
            mpStatus: string | null;
            mpStatusDetail: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        guestEmail: string;
        guestFirstName: string;
        guestLastName: string;
        guestPhone: string;
        guestAddress: string;
        guestCity: string;
        guestProvince: string;
        guestPostalCode: string;
        shippingType: import(".prisma/client").$Enums.ShippingType;
        shippingCost: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
    }>;
    updateStatus(id: string, status: OrderStatus): Promise<{
        items: {
            id: string;
            variantId: string;
            quantity: number;
            unitPrice: import("@prisma/client/runtime/library").Decimal;
            totalPrice: import("@prisma/client/runtime/library").Decimal;
            orderId: string;
        }[];
        payments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            orderId: string;
            mpPreferenceId: string | null;
            mpPaymentId: string | null;
            mpStatus: string | null;
            mpStatusDetail: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        guestEmail: string;
        guestFirstName: string;
        guestLastName: string;
        guestPhone: string;
        guestAddress: string;
        guestCity: string;
        guestProvince: string;
        guestPostalCode: string;
        shippingType: import(".prisma/client").$Enums.ShippingType;
        shippingCost: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
    }>;
    getOrderByPreferenceId(preferenceId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        total: import("@prisma/client/runtime/library").Decimal;
        guestEmail: string;
        guestFirstName: string;
        guestLastName: string;
        guestPhone: string;
        guestAddress: string;
        guestCity: string;
        guestProvince: string;
        guestPostalCode: string;
        shippingType: import(".prisma/client").$Enums.ShippingType;
        shippingCost: import("@prisma/client/runtime/library").Decimal;
        subtotal: import("@prisma/client/runtime/library").Decimal;
        status: import(".prisma/client").$Enums.OrderStatus;
        notes: string | null;
    } | null>;
}
