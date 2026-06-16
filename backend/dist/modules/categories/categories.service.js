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
var CategoriesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let CategoriesService = CategoriesService_1 = class CategoriesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CategoriesService_1.name);
    }
    async create(dto) {
        const existing = await this.prisma.category.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Category slug already exists');
        }
        if (dto.parentId) {
            const parent = await this.prisma.category.findUnique({
                where: { id: dto.parentId },
            });
            if (!parent) {
                throw new common_1.NotFoundException('Parent category not found');
            }
        }
        const category = await this.prisma.category.create({ data: dto });
        this.logger.log(`Category created: ${category.name}`);
        return category;
    }
    async findAll() {
        return this.prisma.category.findMany({
            where: { deletedAt: null },
            include: {
                parent: { select: { id: true, name: true, slug: true } },
                children: {
                    where: { deletedAt: null, isActive: true },
                    include: {
                        children: {
                            where: { deletedAt: null, isActive: true },
                        },
                    },
                },
                _count: { select: { products: true } },
            },
            orderBy: { name: 'asc' },
        });
    }
    async findTree() {
        const categories = await this.prisma.category.findMany({
            where: { parentId: null, deletedAt: null, isActive: true },
            include: {
                children: {
                    where: { deletedAt: null, isActive: true },
                    include: {
                        children: {
                            where: { deletedAt: null, isActive: true },
                        },
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return categories;
    }
    async findOne(id) {
        const category = await this.prisma.category.findUnique({
            where: { id },
            include: {
                parent: true,
                children: {
                    where: { deletedAt: null },
                },
                _count: { select: { products: true } },
            },
        });
        if (!category || category.deletedAt) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async findBySlug(slug) {
        const category = await this.prisma.category.findUnique({
            where: { slug },
            include: {
                children: {
                    where: { deletedAt: null, isActive: true },
                },
            },
        });
        if (!category || category.deletedAt) {
            throw new common_1.NotFoundException('Category not found');
        }
        return category;
    }
    async update(id, dto) {
        await this.findOne(id);
        if (dto.parentId === id) {
            throw new common_1.ConflictException('A category cannot be its own parent');
        }
        const category = await this.prisma.category.update({
            where: { id },
            data: dto,
        });
        this.logger.log(`Category updated: ${category.name}`);
        return category;
    }
    async softDelete(id) {
        await this.findOne(id);
        const children = await this.prisma.category.findMany({
            where: { parentId: id, deletedAt: null },
        });
        if (children.length > 0) {
            await this.prisma.category.updateMany({
                where: { parentId: id },
                data: { parentId: null },
            });
        }
        await this.prisma.category.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        this.logger.log(`Category soft-deleted: ${id}`);
    }
};
exports.CategoriesService = CategoriesService;
exports.CategoriesService = CategoriesService = CategoriesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CategoriesService);
//# sourceMappingURL=categories.service.js.map