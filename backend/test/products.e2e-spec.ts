import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { ProductsModule } from '../src/modules/products/products.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { RolesGuard } from '../src/common/guards/roles.guard';
import { PermissionsGuard } from '../src/common/guards/permissions.guard';

const mockAuthUser = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'admin@ecommerce.com',
  password: '$2b$10$hashed',
  firstName: 'Admin',
  lastName: 'User',
  phone: '+5491123456789',
  isActive: true,
  deletedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  userRoles: [
    {
      role: {
        name: 'ADMIN',
        rolePermissions: [
          { permission: { name: 'CREATE_PRODUCT' } },
          { permission: { name: 'DELETE_PRODUCT' } },
          { permission: { name: 'UPDATE_PRODUCT' } },
        ],
      },
    },
  ],
};

const mockCategory = {
  id: 'c0000000-0000-0000-0000-000000000001',
  name: 'Remeras',
  slug: 'remeras',
};

const mockProduct = {
  id: 'p0000000-0000-0000-0000-000000000001',
  name: 'Remera Premium',
  slug: 'remera-premium',
  description: 'Remera de algodón premium',
  basePrice: 14999.00,
  categoryId: mockCategory.id,
  isActive: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  category: mockCategory,
  attributes: [],
  variants: [
    {
      id: 'var-1',
      sku: 'REM-NEG-S',
      price: 14999.00,
      stock: 50,
      isActive: true,
      variantAttributeValues: [],
    },
  ],
  images: [],
  _count: { variants: 1 },
};

const mockPrismaService = {
  user: { findUnique: jest.fn() },
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

describe('Products (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, ProductsModule],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
        { provide: APP_GUARD, useClass: RolesGuard },
        { provide: APP_GUARD, useClass: PermissionsGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    const jwtService = app.get(JwtService);
    jwtToken = jwtService.sign({
      sub: mockAuthUser.id,
      email: mockAuthUser.email,
      role: 'ADMIN',
      permissions: ['CREATE_PRODUCT', 'DELETE_PRODUCT', 'UPDATE_PRODUCT'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/products', () => {
    it('should return 200 with paginated products', () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      return request(app.getHttpServer())
        .get('/api/v1/products')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(res.body.data).toHaveLength(1);
          expect(res.body.meta).toEqual({ page: 1, limit: 12, total: 1, totalPages: 1 });
        });
    });

    it('should return 200 with search query and filter results', () => {
      mockPrismaService.product.findMany.mockResolvedValue([mockProduct]);
      mockPrismaService.product.count.mockResolvedValue(1);

      return request(app.getHttpServer())
        .get('/api/v1/products?search=remera')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(1);
        });
    });

    it('should return 200 with pagination params', () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      return request(app.getHttpServer())
        .get('/api/v1/products?page=2&limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(2);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return 200 with product details', () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      return request(app.getHttpServer())
        .get(`/api/v1/products/${mockProduct.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', mockProduct.id);
          expect(res.body).toHaveProperty('name', 'Remera Premium');
        });
    });

    it('should return 404 for non-existent product', () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('GET /api/v1/products/slug/:slug', () => {
    it('should return 200 with product by slug', () => {
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      return request(app.getHttpServer())
        .get('/api/v1/products/slug/remera-premium')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('slug', 'remera-premium');
        });
    });

    it('should return 404 for non-existent slug', () => {
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/v1/products/slug/nonexistent')
        .expect(404);
    });
  });

  describe('POST /api/v1/products (authenticated)', () => {
    it('should return 201 and create product with valid token', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.product.findUnique.mockResolvedValue(null);
      mockPrismaService.product.create.mockResolvedValue(mockProduct);

      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Remera Premium',
          slug: 'remera-premium',
          basePrice: 14999.00,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', mockProduct.id);
        });
    });

    it('should return 409 when slug already exists', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);

      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          name: 'Remera Premium',
          slug: 'remera-premium',
          basePrice: 14999.00,
        })
        .expect(409);
    });
  });

  describe('DELETE /api/v1/products/:id (authenticated)', () => {
    it('should return 200 and soft delete product', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.product.findUnique
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockProduct);
      mockPrismaService.product.update.mockResolvedValue({
        ...mockProduct,
        deletedAt: new Date(),
        isActive: false,
      });

      return request(app.getHttpServer())
        .delete(`/api/v1/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent product', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.product.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .delete('/api/v1/products/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(404);
    });
  });
});
