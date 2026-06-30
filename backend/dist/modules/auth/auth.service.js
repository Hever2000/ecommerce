"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const google_auth_library_1 = require("google-auth-library");
const prisma_service_1 = require("../../prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.logger = new common_1.Logger(AuthService_1.name);
        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (clientId) {
            this.googleClient = new google_auth_library_1.OAuth2Client(clientId);
        }
    }
    async login(dto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user || !user.isActive || user.deletedAt || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const { roleNames, permissions } = (await this.getUserWithPermissions(user.id));
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
    async register(dto) {
        const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existing) {
            throw new common_1.ConflictException('Email already registered');
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
        const { roleNames, permissions } = (await this.getUserWithPermissions(user.id));
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
    async googleLogin(dto) {
        if (!this.googleClient) {
            throw new common_1.UnauthorizedException('Google OAuth is not configured');
        }
        let ticketPayload;
        try {
            const ticket = await this.googleClient.verifyIdToken({
                idToken: dto.idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            ticketPayload = ticket.getPayload();
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        if (!ticketPayload) {
            throw new common_1.UnauthorizedException('Invalid Google token');
        }
        const googleId = ticketPayload.sub;
        const email = ticketPayload.email;
        if (!email) {
            throw new common_1.UnauthorizedException('Google account has no email');
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
            throw new common_1.UnauthorizedException('Account is inactive');
        }
        const { roleNames, permissions } = (await this.getUserWithPermissions(user.id));
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
    async logout(dto) {
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
    async refresh(refreshToken) {
        const hashedToken = this.hashToken(refreshToken);
        const storedToken = await this.prisma.refreshToken.findFirst({
            where: { token: hashedToken, revokedAt: null, expiresAt: { gt: new Date() } },
        });
        if (!storedToken) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        const result = await this.getUserWithPermissions(storedToken.userId);
        if (!result) {
            throw new common_1.UnauthorizedException('User not found or inactive');
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
    async getUserWithPermissions(userId) {
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
        const rolePermNames = userRoles.flatMap((ur) => ur.role.rolePermissions.map((rp) => rp.permission.name));
        const grantedPerms = userPermissions.filter((up) => up.granted).map((up) => up.permission.name);
        const revokedPerms = userPermissions
            .filter((up) => !up.granted)
            .map((up) => up.permission.name);
        const permissions = [...new Set([...rolePermNames, ...grantedPerms])].filter((p) => !revokedPerms.includes(p));
        return { user, roleNames, permissions };
    }
    generateTokens(userId, email, role, permissions) {
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
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
    async storeRefreshToken(refreshToken, userId) {
        const hashedToken = this.hashToken(refreshToken);
        await this.prisma.refreshToken.create({
            data: {
                token: hashedToken,
                userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map