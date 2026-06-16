import { ShippingService } from './shipping.service';
import { CalculateShippingDto } from './dto/calculate-shipping.dto';
export declare class ShippingController {
    private readonly shippingService;
    constructor(shippingService: ShippingService);
    calculate(dto: CalculateShippingDto): {
        cost: number;
        method: string;
        estimatedDays: number;
        freeShipping: boolean;
    };
    getPickup(): {
        cost: number;
        method: string;
        estimatedDays: number;
        freeShipping: boolean;
    };
}
