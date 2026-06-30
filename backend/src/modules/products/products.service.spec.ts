import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../../prisma/prisma.service';

const mockCategory = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'Remeras',
  slug: 'remeras',
  description: 'Remeras de algodón',
  parentId: null,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
};

const mockProduct = {
  id: 'p0000000-0000-0000-0000-000000000001',
  name: 'Remera Premium',
  slug: 'remera-premium',
  description: 'Remera de algodón premium',
  basePrice: 14999.0,
  categoryId: mockCategory.id,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  category: mockCategory,
  attributes: [
    {
      attribute: {
        id: 'a0000000-0000-0000-0000-000000000001',
        name: 'Color',
        values: [
          { id: 'v1', value: 'Negro' },
          { id: 'v2', value: 'Blanco' },
        ],
      },
    },
  ],
  variants: [
    {
      id: 'var-1',
      sku: 'REM-NEG-S',
      price: 14999.0,
      stock: 50,
      isActive: true,
      variantAttributeValues: [
        {
          attributeValue: {
            value: 'Negro',
            attribute: { name: 'Color' },
          },
        },
      ],
    },
  ],
  images: [],
};

const mockPaginatedResponse = {
  data: [mockProduct],
  meta: {
    page: 1,
    limit: 12,
    total: 1,
    totalPages: 1,
  },
  variants: [],
  _count: { variants: 1 },
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;

  beforeEach(async () => {
    const mockPrismaService = {
      product: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, { provide: PrismaService, useValue: mockPrismaService }],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto = {
      name: 'Remera Premium',
      slug: 'remera-premium',
      description: 'Remera de algodón premium',
      basePrice: 14999.0,
      categoryId: mockCategory.id,
      attributes: [{ attributeId: 'a0000000-0000-0000-0000-000000000001' }],
      variants: [
        {
          sku: 'REM-NEG-S',
          price: 14999.0,
          stock: 50,
          attributeValueIds: ['v1'],
        },
      ],
    };

    it('should create a product with variants and attributes', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createDto);

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'remera-premium' },
      });
      expect(prisma.product.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Remera Premium',
          slug: 'remera-premium',
          basePrice: 14999.0,
          categoryId: mockCategory.id,
          attributes: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ attributeId: 'a0000000-0000-0000-0000-000000000001' }),
            ]),
          }),
          variants: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                sku: 'REM-NEG-S',
                price: 14999.0,
                stock: 50,
              }),
            ]),
          }),
        }),
        include: expect.any(Object),
      });
    });

    it('should throw ConflictException when slug already exists', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return paginated products without filters', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.findAll({});

      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { deletedAt: null, isActive: true },
          skip: 0,
          take: 12,
        }),
      );
    });

    it('should filter by search query on name and description', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      await service.findAll({ search: 'remera' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'remera', mode: 'insensitive' } },
              { description: { contains: 'remera', mode: 'insensitive' } },
            ],
          }),
        }),
      );
    });

    it('should filter by categorySlug when category exists', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      await service.findAll({ categorySlug: 'remeras' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: mockCategory.id,
          }),
        }),
      );
    });

    it('should not filter by categorySlug when category does not exist', async () => {
      prisma.category.findUnique.mockResolvedValue(null);
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      await service.findAll({ categorySlug: 'nonexistent' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ categoryId: expect.any(String) }),
        }),
      );
    });

    it('should apply price range filters', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);
      prisma.product.count.mockResolvedValue(1);

      await service.findAll({ minPrice: 1000, maxPrice: 20000 });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            basePrice: { gte: 1000, lte: 20000 },
          }),
        }),
      );
    });
  });

  describe('findBySlug', () => {
    it('should return a product with all relations', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findBySlug('remera-premium');

      expect(result).toEqual(mockProduct);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { slug: 'remera-premium' },
        include: expect.objectContaining({
          category: true,
          attributes: expect.any(Object),
          variants: expect.any(Object),
          images: expect.any(Object),
        }),
      });
    });

    it('should throw NotFoundException when slug does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when product is soft-deleted', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
      });

      await expect(service.findBySlug('deleted-product')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a product by id with all relations', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne(mockProduct.id);

      expect(result).toEqual(mockProduct);
    });

    it('should throw NotFoundException when id does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateDto = {
      name: 'Remera Premium Plus',
      description: 'Updated description',
    };

    it('should update product fields', async () => {
      prisma.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockProduct);
      prisma.product.update.mockResolvedValue({ ...mockProduct, ...updateDto });

      const result = await service.update(mockProduct.id, updateDto);

      expect(result.name).toBe('Remera Premium Plus');
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: expect.objectContaining(updateDto),
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when updating non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('nonexistent-id', updateDto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('softDelete', () => {
    it('should mark product as deleted', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
        isActive: false,
      });

      await service.softDelete(mockProduct.id);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
          isActive: false,
        }),
      });
    });

    it('should throw NotFoundException when deleting non-existent product', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.softDelete('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
