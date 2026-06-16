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
var RolesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let RolesService = RolesService_1 = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(RolesService_1.name);
    }
    async create(dto) {
        const existing = await this.prisma.role.findUnique({ where: { name: dto.name } });
        if (existing) {
            throw new common_1.ConflictException('Role already exists');
        }
        const role = await this.prisma.role.create({
            data: {
                name: dto.name,
                description: dto.description,
                rolePermissions: dto.permissionIds
                    ? {
                        create: dto.permissionIds.map((permissionId) => ({
                            permissionId,
                        })),
                    }
                    : undefined,
            },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        });
        this.logger.log(`Role created: ${role.name}`);
        return role;
    }
    async findAll() {
        return this.prisma.role.findMany({
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        });
    }
    async findOne(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    include: { permission: true },
                },
            },
        });
        if (!role) {
            throw new common_1.NotFoundException('Role not found');
        }
        return role;
    }
    async updatePermissions(id, permissionIds) {
        const role = await this.findOne(id);
        await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
        await this.prisma.rolePermission.createMany({
            data: permissionIds.map((permissionId) => ({
                roleId: id,
                permissionId,
            })),
        });
        this.logger.log(`Role permissions updated: ${role.name}`);
        return this.findOne(id);
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.role.delete({ where: { id } });
        this.logger.log(`Role deleted: ${id}`);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = RolesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map