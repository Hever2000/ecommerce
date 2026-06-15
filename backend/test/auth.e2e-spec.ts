import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import * as bcrypt from 'bcrypt';
import { AuthModule } from '../src/modules/auth/auth.module';
import { ProductsModule } from '../src/modules/products/products.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

const mockPermissions = [
  { permission: { name: 'CREATE_PRODUCT' } },
  { permission: { name: 'VIEW_ORDERS' } },
];

const mockUser = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'admin@ecommerce.com',
  password: '',
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
        rolePermissions: mockPermissions,
      },
    },
  ],
};

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  product: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
  category: { findUnique: jest.fn() },
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let bcryptCompareMock: jest.SpyInstance;
  let jwtService: JwtService;
  let validToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, ProductsModule],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    jwtService = app.get(JwtService);
    validToken = jwtService.sign({
      sub: mockUser.id,
      email: mockUser.email,
      role: 'ADMIN',
      permissions: ['CREATE_PRODUCT'],
    });

    bcryptCompareMock = jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
  });

  afterAll(async () => {
    bcryptCompareMock.mockRestore();
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUser.password = '$2b$10$hashedpassword123';
  });

  describe('POST /api/v1/auth/login', () => {
    it('should return 200 and tokens with valid credentials', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'admin@ecommerce.com', password: 'Admin123!' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
          expect(res.body.user).toHaveProperty('id', mockUser.id);
          expect(res.body.user).toHaveProperty('role', 'ADMIN');
        });
    });

    it('should return 401 with invalid credentials', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrong@ecommerce.com', password: 'WrongPass1' })
        .expect(401);
    });

    it('should return 400 with invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'Admin123!' })
        .expect(400);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return 200 with a valid refresh token', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
        });
    });

    it('should return 401 with an invalid refresh token', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      return request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);
    });
  });

  describe('Protected endpoints', () => {
    it('should return 401 when accessing protected route without token', () => {
      return request(app.getHttpServer())
        .post('/api/v1/products')
        .send({ name: 'Test', slug: 'test', basePrice: 100 })
        .expect(401);
    });

    it('should return 200 when accessing protected route with valid token', () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      mockPrismaService.product.create.mockResolvedValue({ id: 'p1', name: 'Test', slug: 'test' });

      return request(app.getHttpServer())
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ name: 'Test', slug: 'test', basePrice: 100 })
        .expect(201);
    });
  });
});
