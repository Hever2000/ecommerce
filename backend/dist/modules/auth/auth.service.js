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
            include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
        });
        if (!user || !user.isActive || user.deletedAt || !user.password) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
            throw new common_1.UnauthorizedException('Account is inactive');
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
    async refresh(refreshToken) {
        try {
            const payload = this.jwtService.verify(refreshToken);
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
                include: { userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
            });
            if (!user || !user.isActive || user.deletedAt) {
                throw new common_1.UnauthorizedException('User not found or inactive');
            }
            const { roleNames, permissions } = this.extractRolesAndPermissions(user);
            const newAccessToken = this.jwtService.sign({ sub: user.id, email: user.email, role: roleNames[0], permissions }, { expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m' });
            return { accessToken: newAccessToken };
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    extractRolesAndPermissions(user) {
        const roleNames = user.userRoles.map((ur) => ur.role.name);
        const permissions = Array.from(new Set(user.userRoles
            .flatMap((ur) => ur.role.rolePermissions)
            .map((rp) => rp.permission.name)));
        return { roleNames, permissions };
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map