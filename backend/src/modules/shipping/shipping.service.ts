import { Injectable } from '@nestjs/common';

interface ShippingRate {
  baseCost: number;
  costPerItem: number;
  freeShippingThreshold: number;
}

@Injectable()
export class ShippingService {
  private readonly rates: Record<string, ShippingRate> = {
    'Buenos Aires': { baseCost: 500, costPerItem: 200, freeShippingThreshold: 30000 },
    CABA: { baseCost: 400, costPerItem: 150, freeShippingThreshold: 25000 },
    Córdoba: { baseCost: 800, costPerItem: 250, freeShippingThreshold: 35000 },
    'Santa Fe': { baseCost: 700, costPerItem: 250, freeShippingThreshold: 35000 },
    Mendoza: { baseCost: 1000, costPerItem: 300, freeShippingThreshold: 40000 },
  };

  private readonly defaultRate: ShippingRate = {
    baseCost: 1200,
    costPerItem: 350,
    freeShippingThreshold: 50000,
  };

  calculateCost(province: string, subtotal: number, itemCount: number) {
    const rate = this.rates[province] || this.defaultRate;

    if (subtotal >= rate.freeShippingThreshold) {
      return {
        cost: 0,
        method: 'HOME_DELIVERY',
        estimatedDays: this.getEstimatedDays(province),
        freeShipping: true,
      };
    }

    const cost = rate.baseCost + rate.costPerItem * itemCount;

    return {
      cost: Math.round(cost),
      method: 'HOME_DELIVERY',
      estimatedDays: this.getEstimatedDays(province),
      freeShipping: false,
    };
  }

  getPickupCost() {
    return {
      cost: 0,
      method: 'PICKUP',
      estimatedDays: 0,
      freeShipping: true,
    };
  }

  private getEstimatedDays(province: string): number {
    const estimates: Record<string, number> = {
      'Buenos Aires': 3,
      CABA: 2,
      Córdoba: 5,
      'Santa Fe': 4,
      Mendoza: 7,
    };
    return estimates[province] || 10;
  }
}
