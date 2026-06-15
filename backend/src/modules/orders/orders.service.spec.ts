import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrderStatus, ShippingType } from '@prisma/client';
import { OrdersService } from './orders.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ShippingService } from '../shipping/shipping.service';

const mockVariant = {
  id: 'v0000000-0000-0000-0000-000000000001',
  productId: 'p0000000-0000-0000-0000-000000000001',
  sku: 'REM-NEG-S',
  price: 14999.00,
  stock: 10,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  product: {
    id: 'p0000000-0000-0000-0000-000000000001',
    name: 'Remera Premium',
    slug: 'remera-premium',
  },
};

const mockLowStockVariant = {
  ...mockVariant,
  stock: 2,
};

const mockOrderItem = {
  id: 'oi-1',
  orderId: 'o0000000-0000-0000-0000-000000000001',
  variantId: mockVariant.id,
  quantity: 2,
  unitPrice: 14999.00,
  totalPrice: 29998.00,
  variant: {
    ...mockVariant,
    variantAttributeValues: [],
  },
};

const mockPayment = {
  id: 'pm-1',
  orderId: 'o0000000-0000-0000-0000-000000000001',
  mpPreferenceId: 'pref_123',
  mpPaymentId: null,
  mpStatus: 'pending',
  mpStatusDetail: null,
  amount: 29998.00,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockOrder = {
  id: 'o0000000-0000-0000-0000-000000000001',
  guestEmail: 'juan@perez.com',
  guestFirstName: 'Juan',
  guestLastName: 'Pérez',
  guestPhone: '+5491123456789',
  guestAddress: 'Av. Siempre Viva 123',
  guestCity: 'Buenos Aires',
  guestProvince: 'Buenos Aires',
  guestPostalCode: '1000',
  shippingType: ShippingType.PICKUP,
  shippingCost: 0,
  subtotal: 29998.00,
  total: 29998.00,
  status: OrderStatus.PENDING,
  notes: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  items: [mockOrderItem],
  payments: [mockPayment],
};

const createOrderDto = {
  guestEmail: 'juan@perez.com',
  guestFirstName: 'Juan',
  guestLastName: 'Pérez',
  guestPhone: '+5491123456789',
  guestAddress: 'Av. Siempre Viva 123',
  guestCity: 'Buenos Aires',
  guestProvince: 'Buenos Aires',
  guestPostalCode: '1000',
  shippingType: ShippingType.PICKUP,
  items: [{ variantId: mockVariant.id, quantity: 2 }],
};

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let shippingService: any;

  beforeEach(async () => {
    const mockPrismaService = {
      productVariant: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
      },
      order: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
      orderItem: {
        findMany: jest.fn(),
      },
    };

    const mockShippingService = {
      calculateCost: jest.fn(),
      getPickupCost: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ShippingService, useValue: mockShippingService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    shippingService = module.get(ShippingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create an order with items and decrement stock', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      const mockTx = {
        productVariant: { update: jest.fn().mockResolvedValue({}) },
        inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
        order: { create: jest.fn().mockResolvedValue(mockOrder) },
      };
      prisma.$transaction.mockImplementation(async (cb: Function) => cb(mockTx));

      const result = await service.create(createOrderDto);

      expect(result).toEqual(mockOrder);
      expect(mockTx.productVariant.update).toHaveBeenCalledWith({
        where: { id: mockVariant.id },
        data: { stock: { decrement: 2 } },
      });
      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantId: mockVariant.id,
            type: 'REMOVE',
            quantity: 2,
          }),
        }),
      );
    });

    it('should throw BadRequestException when stock is insufficient', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockLowStockVariant]);

      await expect(
        service.create({
          ...createOrderDto,
          items: [{ variantId: mockLowStockVariant.id, quantity: 5 }],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should calculate shipping cost for HOME_DELIVERY', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);
      shippingService.calculateCost.mockReturnValue({ cost: 900 });

      const homeDeliveryDto = {
        ...createOrderDto,
        shippingType: ShippingType.HOME_DELIVERY,
      };

      const mockTx = {
        productVariant: { update: jest.fn().mockResolvedValue({}) },
        inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
        order: {
          create: jest.fn().mockResolvedValue({
            ...mockOrder,
            shippingType: ShippingType.HOME_DELIVERY,
            shippingCost: 900,
            total: 29998.00 + 900,
          }),
        },
      };
      prisma.$transaction.mockImplementation(async (cb: Function) => cb(mockTx));

      await service.create(homeDeliveryDto);

      expect(shippingService.calculateCost).toHaveBeenCalledWith(
        'Buenos Aires',
        29998.00,
        1,
      );
    });

    it('should have zero shipping cost for PICKUP', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      const mockTx = {
        productVariant: { update: jest.fn().mockResolvedValue({}) },
        inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
        order: { create: jest.fn().mockResolvedValue(mockOrder) },
      };
      prisma.$transaction.mockImplementation(async (cb: Function) => cb(mockTx));

      const result = await service.create(createOrderDto);

      expect(result.shippingCost).toBe(0);
      expect(shippingService.calculateCost).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when some variants are not found', async () => {
      prisma.productVariant.findMany.mockResolvedValue([mockVariant]);

      await expect(
        service.create({
          ...createOrderDto,
          items: [
            { variantId: mockVariant.id, quantity: 1 },
            { variantId: 'nonexistent-variant', quantity: 1 },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return an order with items and payments', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      const result = await service.findOne(mockOrder.id);

      expect(result).toEqual(mockOrder);
      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        include: expect.objectContaining({
          items: expect.any(Object),
          payments: true,
        }),
      });
    });

    it('should throw NotFoundException for non-existent order', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('should transition PENDING to PAID', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.PAID,
        items: mockOrder.items,
        payments: mockOrder.payments,
      };
      prisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus(mockOrder.id, OrderStatus.PAID);

      expect(result.status).toBe(OrderStatus.PAID);
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockOrder.id },
        data: { status: OrderStatus.PAID },
        include: expect.any(Object),
      });
    });

    it('should transition PENDING to FAILED', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);
      const updatedOrder = {
        ...mockOrder,
        status: OrderStatus.FAILED,
        items: mockOrder.items,
        payments: mockOrder.payments,
      };
      prisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus(mockOrder.id, OrderStatus.FAILED);

      expect(result.status).toBe(OrderStatus.FAILED);
    });

    it('should throw BadRequestException for invalid transition PENDING to SHIPPED', async () => {
      prisma.order.findUnique.mockResolvedValue(mockOrder);

      await expect(
        service.updateStatus(mockOrder.id, OrderStatus.SHIPPED),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid transition CANCELLED to PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.updateStatus(mockOrder.id, OrderStatus.PAID),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
