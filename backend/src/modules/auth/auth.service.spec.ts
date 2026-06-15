import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

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

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
      },
    };

    const mockJwtService = {
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService);

    jest.spyOn(bcrypt, 'compare').mockImplementation(async (plain, hash) => {
      return plain === 'Correct123!' && hash === mockUser.password;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('should return a new access token with a valid refresh token', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: 'ADMIN', permissions: [] };
      jwtService.verify.mockReturnValue(payload);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwtService.sign.mockReturnValue('new-access-token');

      const result = await authService.refresh('valid-refresh-token');

      expect(result).toEqual({ accessToken: 'new-access-token' });
      expect(jwtService.verify).toHaveBeenCalledWith('valid-refresh-token');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        include: expect.any(Object),
      });
    });

    it('should throw UnauthorizedException when refresh token is expired or invalid', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(authService.refresh('expired-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user from token is inactive', async () => {
      const payload = { sub: mockUser.id, email: mockUser.email, role: 'ADMIN', permissions: [] };
      jwtService.verify.mockReturnValue(payload);
      prisma.user.findUnique.mockResolvedValue(mockInactiveUser);

      await expect(authService.refresh('token-for-inactive')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user from token does not exist', async () => {
      const payload = { sub: 'nonexistent-id', email: 'gone@ecommerce.com', role: 'ADMIN', permissions: [] };
      jwtService.verify.mockReturnValue(payload);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(authService.refresh('token-for-gone-user')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
