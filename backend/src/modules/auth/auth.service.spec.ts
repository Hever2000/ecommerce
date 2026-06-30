import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const mockPermissions = [
  { permission: { name: 'CREATE_PRODUCT' } },
  { permission: { name: 'UPDATE_PRODUCT' } },
  { permission: { name: 'DELETE_PRODUCT' } },
  { permission: { name: 'VIEW_ORDERS' } },
  { permission: { name: 'UPDATE_ORDER_STATUS' } },
  { permission: { name: 'ADJUST_INVENTORY' } },
  { permission: { name: 'VIEW_INVENTORY' } },
];

const mockUser = {
  id: 'a0000000-0000-0000-0000-000000000001',
  email: 'admin@ecommerce.com',
  password: '$2b$10$hashedpassword123',
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

const mockInactiveUser = {
  ...mockUser,
  isActive: false,
};

const mockLoginResponse = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: {
    id: mockUser.id,
    email: mockUser.email,
    firstName: mockUser.firstName,
    lastName: mockUser.lastName,
    role: 'ADMIN',
    permissions: [
      'CREATE_PRODUCT',
      'UPDATE_PRODUCT',
      'DELETE_PRODUCT',
      'VIEW_ORDERS',
      'UPDATE_ORDER_STATUS',
      'ADJUST_INVENTORY',
      'VIEW_INVENTORY',
    ],
  },
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: any;
  let jwtService: any;
  let bcryptCompareMock: jest.Mock;

  const mockPrismaRefreshToken = {
    create: jest.fn().mockResolvedValue({}),
    findFirst: jest.fn(),
    update: jest.fn().mockResolvedValue({}),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
  };

  beforeEach(async () => {
    mockPrismaRefreshToken.create.mockClear();
    mockPrismaRefreshToken.findFirst.mockClear();
    mockPrismaRefreshToken.update.mockClear();
    mockPrismaRefreshToken.updateMany.mockClear();

    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
      refreshToken: mockPrismaRefreshToken,
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };
    jwtService = mockJwtService;

    bcryptCompareMock = jest.fn().mockImplementation(async (plain, hash) => {
      return plain === 'Correct123!' && hash === mockUser.password;
    });
    (bcrypt.compare as any) = bcryptCompareMock;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
  });

  describe('login', () => {
    it('should return tokens and user with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('mock-access-token')
        .mockReturnValueOnce('mock-refresh-token');

      const result = await authService.login({
        email: 'admin@ecommerce.com',
        password: 'Correct123!',
      });

      expect(result).toEqual(mockLoginResponse);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@ecommerce.com' },
        include: expect.any(Object),
      });
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
      expect(prisma.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          token: sha256('mock-refresh-token'),
          userId: mockUser.id,
        }),
      });
    });

    it('should throw UnauthorizedException when email does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@ecommerce.com',
          password: 'Correct123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.login({
          email: 'admin@ecommerce.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      prisma.user.findUnique.mockResolvedValue(mockInactiveUser);

      await expect(
        authService.login({
          email: 'admin@ecommerce.com',
          password: 'Correct123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    const validToken = 'valid-refresh-token';
    const validHash = sha256(validToken);
    const mockStoredToken = {
      id: 'token-id-1',
      token: validHash,
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    };

    it('should return a new token pair with a valid refresh token', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await authService.refresh(validToken);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { token: validHash, revokedAt: null, expiresAt: { gt: expect.any(Date) } },
      });
      expect(prisma.refreshToken.update).toHaveBeenCalledWith({
        where: { id: mockStoredToken.id },
        data: { revokedAt: expect.any(Date) },
      });
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when refresh token is not in DB', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(authService.refresh('unknown-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when stored token is expired', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      await expect(authService.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user from token is inactive', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      prisma.user.findUnique.mockResolvedValue(mockInactiveUser);

      await expect(authService.refresh(validToken)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user from token does not exist', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh(validToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    const validToken = 'valid-token';
    const validHash = sha256(validToken);
    const mockStoredToken = {
      id: 'token-id-1',
      token: validHash,
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
    };

    it('should revoke all tokens for the user and return success', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(mockStoredToken);

      const result = await authService.logout({ refreshToken: validToken });

      expect(result).toEqual({ message: 'Logout successful' });
      expect(prisma.refreshToken.findFirst).toHaveBeenCalledWith({
        where: { token: validHash, revokedAt: null },
      });
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });

    it('should return success even if token is already revoked', async () => {
      prisma.refreshToken.findFirst.mockResolvedValue(null);

      const result = await authService.logout({ refreshToken: 'already-revoked' });

      expect(result).toEqual({ message: 'Logout successful' });
      expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
    });
  });
});
