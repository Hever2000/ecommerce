import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LogoutDto } from './dto/logout.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
      this.googleClient = new OAuth2Client(clientId);
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive || user.deletedAt || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { roleNames, permissions } = (await this.getUserWithPermissions(user.id))!;
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

    await this.storeRefreshToken(tokens.refreshToken, user.id);

    this.logger.log(`User ${user.email} logged in`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleNames[0],
        permissions,
      },
    };
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    let userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
    if (!userRole) {
      userRole = await this.prisma.role.create({
        data: { name: 'USER', description: 'Regular customer' },
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        userRoles: { create: { roleId: userRole.id } },
      },
    });

    const { roleNames, permissions } = (await this.getUserWithPermissions(user.id))!;
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

    await this.storeRefreshToken(tokens.refreshToken, user.id);

    this.logger.log(`User registered: ${user.email}`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: roleNames[0],
        permissions,
      },
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    if (!this.googleClient) {
      throw new UnauthorizedException('Google OAuth is not configured');
    }

    let ticketPayload: any;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: dto.idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      ticketPayload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google token');
    }

    if (!ticketPayload) {
      throw new UnauthorizedException('Invalid Google token');
    }

    const googleId = ticketPayload.sub as string;
    const email = ticketPayload.email as string;

    if (!email) {
      throw new UnauthorizedException('Google account has no email');
    }

    let user = await this.prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
    });

    if (user && !user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: ticketPayload.picture },
      });
    }

    if (!user) {
      let userRole = await this.prisma.role.findUnique({ where: { name: 'USER' } });
      if (!userRole) {
        userRole = await this.prisma.role.create({
          data: { name: 'USER', description: 'Regular customer' },
        });
      }

      user = await this.prisma.user.create({
        data: {
          email,
          googleId,
          firstName: ticketPayload.given_name || email.split('@')[0],
          lastName: ticketPayload.family_name || '',
          avatar: ticketPayload.picture,
          userRoles: { create: { roleId: userRole.id } },
        },
      });
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive');
    }

    const { roleNames, permissions } = (await this.getUserWithPermissions(user.id))!;
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

    await this.storeRefreshToken(tokens.refreshToken, user.id);

    this.logger.log(`User ${user.email} logged in via Google`);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: roleNames[0],
        permissions,
      },
    };
  }

  async logout(dto: LogoutDto): Promise<{ message: string }> {
    const hashedToken = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { token: hashedToken, revokedAt: null },
    });

    if (!storedToken) {
      this.logger.log('Logout attempt with invalid or already revoked token');
      return { message: 'Logout successful' };
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId: storedToken.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    this.logger.log(`All refresh tokens revoked for user ${storedToken.userId}`);
    return { message: 'Logout successful' };
  }

  async refresh(refreshToken: string) {
    const hashedToken = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: { token: hashedToken, revokedAt: null, expiresAt: { gt: new Date() } },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const result = await this.getUserWithPermissions(storedToken.userId);
    if (!result) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { user, roleNames, permissions } = result;

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

    await this.storeRefreshToken(tokens.refreshToken, user.id);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  private async getUserWithPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive || user.deletedAt) {
      return null;
    }

    const [userRoles, userPermissions] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { userId },
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } },
      }),
      this.prisma.userPermission.findMany({
        where: { userId },
        include: { permission: true },
      }),
    ]);

    const roleNames = userRoles.map((ur) => ur.role.name);
    const rolePermNames = userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.name),
    );
    const grantedPerms = userPermissions.filter((up) => up.granted).map((up) => up.permission.name);
    const revokedPerms = userPermissions
      .filter((up) => !up.granted)
      .map((up) => up.permission.name);

    const permissions = [...new Set([...rolePermNames, ...grantedPerms])].filter(
      (p) => !revokedPerms.includes(p),
    );

    return { user, roleNames, permissions };
  }

  private generateTokens(userId: string, email: string, role: string, permissions: string[]) {
    const payload = { sub: userId, email, role, permissions };
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }),
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async storeRefreshToken(refreshToken: string, userId: string): Promise<void> {
    const hashedToken = this.hashToken(refreshToken);
    await this.prisma.refreshToken.create({
      data: {
        token: hashedToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
}
