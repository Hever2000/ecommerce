import { Injectable, UnauthorizedException, ConflictException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
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
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    if (!user || !user.isActive || user.deletedAt || !user.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { roleNames, permissions } = this.extractRolesAndPermissions(user);
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

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
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    const { roleNames, permissions } = this.extractRolesAndPermissions(user);
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

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
      include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
    });

    if (user && !user.googleId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId, avatar: ticketPayload.picture },
        include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
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
        include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
      });
    }

    if (!user.isActive || user.deletedAt) {
      throw new UnauthorizedException('Account is inactive');
    }

    const { roleNames, permissions } = this.extractRolesAndPermissions(user);
    const tokens = this.generateTokens(user.id, user.email, roleNames[0], permissions);

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
    this.logger.log(`Logout attempt for refresh token`);
    return { message: 'Logout successful' };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
      });

      if (!user || !user.isActive || user.deletedAt) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const { roleNames, permissions } = this.extractRolesAndPermissions(user);
      const newAccessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: roleNames[0], permissions },
        { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' },
      );

      return { accessToken: newAccessToken };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private extractRolesAndPermissions(user: any) {
    const roleNames = user.userRoles.map((ur: any) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles
          .flatMap((ur: any) => ur.role.rolePermissions)
          .map((rp: any) => rp.permission.name),
      ),
    ) as string[];
    return { roleNames, permissions };
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
}
