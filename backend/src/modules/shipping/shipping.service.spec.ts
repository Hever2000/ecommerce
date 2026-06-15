import { Test, TestingModule } from '@nestjs/testing';
import { ShippingService } from './shipping.service';

describe('ShippingService', () => {
  let service: ShippingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ShippingService],
    }).compile();

    service = module.get<ShippingService>(ShippingService);
  });

  describe('calculateCost', () => {
    it('should return correct cost for CABA with 1 item below threshold', () => {
      const result = service.calculateCost('CABA', 10000, 1);

      expect(result).toEqual({
        cost: 550,
        method: 'HOME_DELIVERY',
        estimatedDays: 2,
        freeShipping: false,
      });
    });

    it('should return correct cost for CABA with multiple items', () => {
      const result = service.calculateCost('CABA', 10000, 3);

      expect(result).toEqual({
        cost: 850,
        method: 'HOME_DELIVERY',
        estimatedDays: 2,
        freeShipping: false,
      });
    });

    it('should return correct cost for Buenos Aires province', () => {
      const result = service.calculateCost('Buenos Aires', 10000, 1);

      expect(result).toEqual({
        cost: 700,
        method: 'HOME_DELIVERY',
        estimatedDays: 3,
        freeShipping: false,
      });
    });

    it('should use default rate for unknown province', () => {
      const result = service.calculateCost('Neuquén', 10000, 1);

      expect(result).toEqual({
        cost: 1550,
        method: 'HOME_DELIVERY',
        estimatedDays: 10,
        freeShipping: false,
      });
    });

    it('should return 0 cost above free shipping threshold for CABA', () => {
      const result = service.calculateCost('CABA', 30000, 5);

      expect(result).toEqual({
        cost: 0,
        method: 'HOME_DELIVERY',
        estimatedDays: 2,
        freeShipping: true,
      });
    });

    it('should return 0 cost above free shipping threshold for unknown province', () => {
      const result = service.calculateCost('Neuquén', 60000, 5);

      expect(result).toEqual({
        cost: 0,
        method: 'HOME_DELIVERY',
        estimatedDays: 10,
        freeShipping: true,
      });
    });

    it('should return correct cost for exact free shipping threshold (not above)', () => {
      const result = service.calculateCost('CABA', 24999.99, 1);

      expect(result.cost).toBeGreaterThan(0);
      expect(result.freeShipping).toBe(false);
    });

    it('should return 0 cost when subtotal equals free shipping threshold', () => {
      const result = service.calculateCost('CABA', 25000, 1);

      expect(result.cost).toBe(0);
      expect(result.freeShipping).toBe(true);
    });

    it('should handle zero item count with base cost only', () => {
      const result = service.calculateCost('CABA', 1000, 0);

      expect(result.cost).toBe(400);
    });
  });

  describe('getPickupCost', () => {
    it('should return zero cost for pickup', () => {
      const result = service.getPickupCost();

      expect(result).toEqual({
        cost: 0,
        method: 'PICKUP',
        estimatedDays: 0,
        freeShipping: true,
      });
    });
  });
});
