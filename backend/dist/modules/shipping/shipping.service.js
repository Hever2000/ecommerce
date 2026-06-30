"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShippingService = void 0;
const common_1 = require("@nestjs/common");
let ShippingService = class ShippingService {
    constructor() {
        this.rates = {
            'Buenos Aires': { baseCost: 500, costPerItem: 200, freeShippingThreshold: 30000 },
            CABA: { baseCost: 400, costPerItem: 150, freeShippingThreshold: 25000 },
            Córdoba: { baseCost: 800, costPerItem: 250, freeShippingThreshold: 35000 },
            'Santa Fe': { baseCost: 700, costPerItem: 250, freeShippingThreshold: 35000 },
            Mendoza: { baseCost: 1000, costPerItem: 300, freeShippingThreshold: 40000 },
        };
        this.defaultRate = {
            baseCost: 1200,
            costPerItem: 350,
            freeShippingThreshold: 50000,
        };
    }
    calculateCost(province, subtotal, itemCount) {
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
    getEstimatedDays(province) {
        const estimates = {
            'Buenos Aires': 3,
            CABA: 2,
            Córdoba: 5,
            'Santa Fe': 4,
            Mendoza: 7,
        };
        return estimates[province] || 10;
    }
};
exports.ShippingService = ShippingService;
exports.ShippingService = ShippingService = __decorate([
    (0, common_1.Injectable)()
], ShippingService);
//# sourceMappingURL=shipping.service.js.map