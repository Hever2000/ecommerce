import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { OrdersModule } from '../src/modules/orders/orders.module';
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
          { permission: { name: 'VIEW_ORDERS' } },
          { permission: { name: 'UPDATE_ORDER_STATUS' } },
        ],
      },
    },
  ],
};

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
  shippingType: 'PICKUP',
  shippingCost: 0,
  subtotal: 29998.00,
  total: 29998.00,
  status: 'PENDING',
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
  shippingType: 'PICKUP',
  items: [{ variantId: mockVariant.id, quantity: 2 }],
};

const mockTx = {
  productVariant: { update: jest.fn().mockResolvedValue({}) },
  inventoryMovement: { create: jest.fn().mockResolvedValue({}) },
  order: { create: jest.fn().mockResolvedValue(mockOrder) },
};

const mockPrismaService = {
  user: { findUnique: jest.fn() },
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
  orderItem: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('Orders (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, OrdersModule],
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
      permissions: ['VIEW_ORDERS', 'UPDATE_ORDER_STATUS'],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/orders', () => {
    it('should return 201 and create a guest order', () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue([mockVariant]);
      mockPrismaService.$transaction.mockImplementation(
        async (cb: Function) => cb(mockTx),
      );

      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('status', 'PENDING');
          expect(res.body).toHaveProperty('total', 29998.00);
        });
    });

    it('should return 400 when stock is insufficient', () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue([
        { ...mockVariant, stock: 1 },
      ]);

      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(400);
    });

    it('should return 400 when variant does not exist', () => {
      mockPrismaService.productVariant.findMany.mockResolvedValue([]);

      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send(createOrderDto)
        .expect(400);
    });

    it('should return 400 with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/api/v1/orders')
        .send({})
        .expect(400);
    });
  });

  describe('GET /api/v1/orders/:id', () => {
    it('should return 200 with order details', () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      return request(app.getHttpServer())
        .get(`/api/v1/orders/${mockOrder.id}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', mockOrder.id);
          expect(res.body).toHaveProperty('guestEmail', 'juan@perez.com');
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('payments');
        });
    });

    it('should return 404 for non-existent order', () => {
      mockPrismaService.order.findUnique.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/v1/orders/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PATCH /api/v1/orders/:id/status', () => {
    it('should return 200 and update order status from PENDING to PAID', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PAID',
      });

      return request(app.getHttpServer())
        .patch(`/api/v1/orders/${mockOrder.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ status: 'PAID' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'PAID');
        });
    });

    it('should return 400 for invalid status transition', () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockAuthUser);
      mockPrismaService.order.findUnique.mockResolvedValue({
        ...mockOrder,
        status: 'CANCELLED',
      });

      return request(app.getHttpServer())
        .patch(`/api/v1/orders/${mockOrder.id}/status`)
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({ status: 'PAID' })
        .expect(400);
    });
  });
});
