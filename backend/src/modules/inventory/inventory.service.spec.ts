import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockVariant = {
  id: 'v0000000-0000-0000-0000-000000000001',
  productId: 'p0000000-0000-0000-0000-000000000001',
  sku: 'REM-NEG-S',
  price: 14999.00,
  stock: 10,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockMovement = {
  id: 'm0000000-0000-0000-0000-000000000001',
  variantId: mockVariant.id,
  type: 'ADD',
  quantity: 5,
  reason: 'Stock inicial',
  userId: null,
  createdAt: new Date('2024-01-01'),
  user: null,
};

describe('InventoryService', () => {
  let service: InventoryService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrismaService = {
      productVariant: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      inventoryMovement: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('adjust', () => {
    const userId = 'u0000000-0000-0000-0000-000000000001';

    it('should increase stock with type ADD', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.$transaction.mockImplementation(async (args: any[]) =>
        Promise.all(args),
      );
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 15,
      });
      prisma.inventoryMovement.create.mockResolvedValue(mockMovement);

      const result = await service.adjust(
        { variantId: mockVariant.id, type: 'ADD', quantity: 5, reason: 'Restock' },
        userId,
      );

      expect(result.previousStock).toBe(10);
      expect(result.newStock).toBe(15);
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.any(Promise),
          expect.any(Promise),
        ]),
      );
    });

    it('should decrease stock with type REMOVE', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.$transaction.mockImplementation(async (args: any[]) =>
        Promise.all(args),
      );
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 7,
      });

      const result = await service.adjust(
        { variantId: mockVariant.id, type: 'REMOVE', quantity: 3 },
        userId,
      );

      expect(result.newStock).toBe(7);
    });

    it('should throw BadRequestException when REMOVE exceeds stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      await expect(
        service.adjust(
          { variantId: mockVariant.id, type: 'REMOVE', quantity: 20 },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should set exact stock with type SET', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.$transaction.mockImplementation(async (args: any[]) =>
        Promise.all(args),
      );
      prisma.productVariant.update.mockResolvedValue({
        ...mockVariant,
        stock: 25,
      });

      const result = await service.adjust(
        { variantId: mockVariant.id, type: 'SET', quantity: 25 },
        userId,
      );

      expect(result.newStock).toBe(25);
    });

    it('should throw BadRequestException when SET with negative stock', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      await expect(
        service.adjust(
          { variantId: mockVariant.id, type: 'SET', quantity: -5 },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when variant does not exist', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(null);

      await expect(
        service.adjust(
          { variantId: 'nonexistent-id', type: 'ADD', quantity: 5 },
          userId,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create an inventory movement record', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);
      prisma.$transaction.mockImplementation(async (args: any[]) =>
        Promise.all(args),
      );
      prisma.productVariant.update.mockResolvedValue({ ...mockVariant, stock: 15 });
      prisma.inventoryMovement.create.mockResolvedValue(mockMovement);

      await service.adjust(
        { variantId: mockVariant.id, type: 'ADD', quantity: 5, reason: 'Restock' },
        userId,
      );

      expect(prisma.inventoryMovement.create).toHaveBeenCalledWith({
        data: {
          variantId: mockVariant.id,
          type: 'ADD',
          quantity: 5,
          reason: 'Restock',
          userId,
        },
      });
    });

    it('should throw BadRequestException for invalid adjustment type', async () => {
      prisma.productVariant.findUnique.mockResolvedValue(mockVariant);

      await expect(
        service.adjust(
          { variantId: mockVariant.id, type: 'INVALID' as any, quantity: 5 },
          userId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLowStock', () => {
    it('should return variants below threshold', async () => {
      const lowStockVariants = [
        { ...mockVariant, stock: 3, product: { id: 'p1', name: 'Product A', slug: 'product-a' } },
        { ...mockVariant, id: 'v2', sku: 'PRO-B-M', stock: 5, product: { id: 'p2', name: 'Product B', slug: 'product-b' } },
      ];
      prisma.productVariant.findMany.mockResolvedValue(lowStockVariants);

      const result = await service.getLowStock(10);

      expect(result).toHaveLength(2);
      expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stock: { lte: 10 }, isActive: true },
          orderBy: { stock: 'asc' },
        }),
      );
    });

    it('should use default threshold of 10 when not provided', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);

      await service.getLowStock();

      expect(prisma.productVariant.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { stock: { lte: 10 }, isActive: true },
        }),
      );
    });

    it('should return empty array when no variants are low on stock', async () => {
      prisma.productVariant.findMany.mockResolvedValue([]);

      const result = await service.getLowStock(5);

      expect(result).toEqual([]);
    });
  });
});
