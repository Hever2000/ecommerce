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
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProductsService = ProductsService_1 = class ProductsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ProductsService_1.name);
    }
    async create(dto) {
        const existing = await this.prisma.product.findUnique({
            where: { slug: dto.slug },
        });
        if (existing) {
            throw new common_1.ConflictException('Product slug already exists');
        }
        const product = await this.prisma.product.create({
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                basePrice: dto.basePrice,
                categoryId: dto.categoryId,
                attributes: dto.attributes
                    ? { create: dto.attributes.map((a) => ({ attributeId: a.attributeId })) }
                    : undefined,
                variants: dto.variants
                    ? {
                        create: dto.variants.map((v) => ({
                            sku: v.sku,
                            price: v.price,
                            stock: v.stock,
                            variantAttributeValues: v.attributeValueIds
                                ? { create: v.attributeValueIds.map((avid) => ({ attributeValueId: avid })) }
                                : undefined,
                        })),
                    }
                    : undefined,
            },
            include: {
                category: true,
                attributes: { include: { attribute: { include: { values: true } } } },
                variants: {
                    include: {
                        variantAttributeValues: {
                            include: { attributeValue: { include: { attribute: true } } },
                        },
                    },
                },
                images: { orderBy: { order: 'asc' } },
            },
        });
        this.logger.log(`Product created: ${product.name}`);
        return product;
    }
    transformVariants(variants) {
        return variants.map((v) => ({
            ...v,
            price: Number(v.price),
            attributes: (v.variantAttributeValues ?? []).reduce((acc, vav) => {
                if (vav.attributeValue?.attribute?.name && vav.attributeValue?.value) {
                    acc[vav.attributeValue.attribute.name] = vav.attributeValue.value;
                }
                return acc;
            }, {}),
        }));
    }
    async findAll(query) {
        const where = {
            deletedAt: null,
            isActive: query.published ?? true,
        };
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: 'insensitive' } },
                { description: { contains: query.search, mode: 'insensitive' } },
            ];
        }
        if (query.categorySlug) {
            const category = await this.prisma.category.findUnique({
                where: { slug: query.categorySlug },
            });
            if (category) {
                where.categoryId = category.id;
            }
        }
        if (query.minPrice !== undefined || query.maxPrice !== undefined) {
            where.basePrice = {};
            if (query.minPrice !== undefined)
                where.basePrice.gte = query.minPrice;
            if (query.maxPrice !== undefined)
                where.basePrice.lte = query.maxPrice;
        }
        const page = query.page ?? 1;
        const limit = query.limit ?? 12;
        const skip = (page - 1) * limit;
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                skip,
                take: limit,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    variants: {
                        where: { isActive: true },
                        select: {
                            id: true,
                            sku: true,
                            price: true,
                            stock: true,
                            variantAttributeValues: {
                                include: {
                                    attributeValue: {
                                        include: { attribute: true },
                                    },
                                },
                            },
                        },
                    },
                    images: {
                        where: { variantId: null },
                        orderBy: { order: 'asc' },
                        take: 1,
                    },
                    _count: { select: { variants: true } },
                },
                orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            data: products.map((p) => ({
                ...p,
                basePrice: Number(p.basePrice),
                variants: this.transformVariants(p.variants),
            })),
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    transformProduct(product) {
        return {
            ...product,
            basePrice: Number(product.basePrice),
            variants: this.transformVariants(product.variants ?? []),
        };
    }
    async findOne(id) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                attributes: {
                    include: {
                        attribute: {
                            include: { values: true },
                        },
                    },
                },
                variants: {
                    where: { isActive: true },
                    include: {
                        variantAttributeValues: {
                            include: {
                                attributeValue: {
                                    include: { attribute: true },
                                },
                            },
                        },
                    },
                    orderBy: { price: 'asc' },
                },
                images: { orderBy: { order: 'asc' } },
            },
        });
        if (!product || product.deletedAt) {
            throw new common_1.NotFoundException('Product not found');
        }
        return this.transformProduct(product);
    }
    async findBySlug(slug) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
            include: {
                category: true,
                attributes: {
                    include: {
                        attribute: {
                            include: { values: true },
                        },
                    },
                },
                variants: {
                    where: { isActive: true },
                    include: {
                        variantAttributeValues: {
                            include: {
                                attributeValue: {
                                    include: { attribute: true },
                                },
                            },
                        },
                    },
                    orderBy: { price: 'asc' },
                },
                images: { orderBy: { order: 'asc' } },
            },
        });
        if (!product || product.deletedAt) {
            throw new common_1.NotFoundException('Product not found');
        }
        return this.transformProduct(product);
    }
    async update(id, dto) {
        await this.findOne(id);
        const product = await this.prisma.product.update({
            where: { id },
            data: {
                name: dto.name,
                slug: dto.slug,
                description: dto.description,
                basePrice: dto.basePrice,
                categoryId: dto.categoryId,
            },
            include: {
                category: true,
                variants: {
                    include: {
                        variantAttributeValues: {
                            include: { attributeValue: true },
                        },
                    },
                },
                images: true,
            },
        });
        this.logger.log(`Product updated: ${product.name}`);
        return product;
    }
    async softDelete(id) {
        await this.findOne(id);
        await this.prisma.product.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        this.logger.log(`Product soft-deleted: ${id}`);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProductsService);
//# sourceMappingURL=products.service.js.map