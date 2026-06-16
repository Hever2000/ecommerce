export declare class ShippingService {
    private readonly rates;
    private readonly defaultRate;
    calculateCost(province: string, subtotal: number, itemCount: number): {
        cost: number;
        method: string;
        estimatedDays: number;
        freeShipping: boolean;
    };
    getPickupCost(): {
        cost: number;
        method: string;
        estimatedDays: number;
        freeShipping: boolean;
    };
    private getEstimatedDays;
}
