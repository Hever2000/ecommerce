import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import * as request from 'supertest';
import { PaymentsModule } from '../src/modules/payments/payments.module';
import { AuthModule } from '../src/modules/auth/auth.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

const mockOrderItem = {
  id: 'oi-1',
  orderId: 'o0000000-0000-0000-0000-000000000001',
  variantId: 'v0000000-0000-0000-0000-000000000001',
  quantity: 2,
  unitPrice: 14999.00,
  totalPrice: 29998.00,
};

const mockPayment = {
  id: 'pm-1',
  orderId: 'o0000000-0000-0000-0000-000000000001',
  mpPreferenceId: 'pref_o0000000-0000-0000-0000-000000000001_123456',
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
};

const mockPrismaService = {
  user: { findUnique: jest.fn() },
  payment: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  order: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
  },
  productVariant: {
    update: jest.fn(),
  },
};

describe('Payments (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, PaymentsModule],
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
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/payments/webhook', () => {
    it('should return 200 and update order to PAID on payment.approved event', () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        order: { ...mockOrder, status: 'PENDING' },
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        mpPaymentId: 'mp-123',
        mpStatus: 'approved',
      });
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'PAID',
      });

      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          type: 'payment',
          data: {
            id: 'mp-123',
            preference_id: 'pref_o0000000-0000-0000-0000-000000000001_123456',
            status: 'approved',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ received: true });
          expect(mockPrismaService.order.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: mockOrder.id },
              data: { status: 'PAID' },
            }),
          );
        });
    });

    it('should return 200 and update order to FAILED on payment.rejected event', () => {
      mockPrismaService.payment.findFirst.mockResolvedValue({
        ...mockPayment,
        order: { ...mockOrder, status: 'PENDING' },
      });
      mockPrismaService.payment.update.mockResolvedValue({
        ...mockPayment,
        mpPaymentId: 'mp-456',
        mpStatus: 'rejected',
      });
      mockPrismaService.orderItem.findMany.mockResolvedValue([mockOrderItem]);
      mockPrismaService.productVariant.update.mockResolvedValue({});
      mockPrismaService.order.update.mockResolvedValue({
        ...mockOrder,
        status: 'FAILED',
      });

      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          type: 'payment',
          data: {
            id: 'mp-456',
            preference_id: 'pref_o0000000-0000-0000-0000-000000000001_123456',
            status: 'rejected',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ received: true });
          expect(mockPrismaService.order.update).toHaveBeenCalledWith(
            expect.objectContaining({
              where: { id: mockOrder.id },
              data: { status: 'FAILED' },
            }),
          );
        });
    });

    it('should return 200 without changes for ignored event type', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          type: 'merchant_order',
          data: { id: 'mo-789' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ received: true });
          expect(mockPrismaService.payment.findFirst).not.toHaveBeenCalled();
          expect(mockPrismaService.order.update).not.toHaveBeenCalled();
        });
    });

    it('should return 200 without changes when data.id is missing', () => {
      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          type: 'payment',
          data: {},
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ received: true });
          expect(mockPrismaService.payment.findFirst).not.toHaveBeenCalled();
          expect(mockPrismaService.order.update).not.toHaveBeenCalled();
        });
    });

    it('should return 200 when payment is not found in database', () => {
      mockPrismaService.payment.findFirst.mockResolvedValue(null);

      return request(app.getHttpServer())
        .post('/api/v1/payments/webhook')
        .send({
          type: 'payment',
          data: {
            id: 'mp-000',
            preference_id: 'pref_nonexistent',
            status: 'approved',
          },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({ received: true });
          expect(mockPrismaService.order.update).not.toHaveBeenCalled();
        });
    });
  });
});
