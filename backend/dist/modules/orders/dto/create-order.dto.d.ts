import { ShippingType } from '@prisma/client';
declare class OrderItemDto {
    variantId: string;
    quantity: number;
}
export declare class CreateOrderDto {
    guestEmail: string;
    guestFirstName: string;
    guestLastName: string;
    guestPhone: string;
    guestAddress: string;
    guestCity: string;
    guestProvince: string;
    guestPostalCode: string;
    shippingType: ShippingType;
    items: OrderItemDto[];
}
export {};
