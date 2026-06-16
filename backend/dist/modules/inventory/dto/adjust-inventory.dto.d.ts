export declare class AdjustInventoryDto {
    variantId: string;
    quantity: number;
    type: 'ADD' | 'REMOVE' | 'SET';
    reason?: string;
}
