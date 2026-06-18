import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common';
import { Express } from 'express';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
  ) {}

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({
      where: { slug: dto.slug },
    });
    if (existing) {
      throw new ConflictException('Product slug already exists');
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

  private transformVariants(variants: any[]): any[] {
    return variants.map((v) => ({
      ...v,
      price: Number(v.price),
      attributes: (v.variantAttributeValues ?? []).reduce(
        (acc: Record<string, string>, vav: any) => {
          if (vav.attributeValue?.attribute?.name && vav.attributeValue?.value) {
            acc[vav.attributeValue.attribute.name] = vav.attributeValue.value;
          }
          return acc;
        },
        {} as Record<string, string>,
      ),
    }));
  }

  async findAll(query: QueryProductDto) {
    const where: Prisma.ProductWhereInput = {
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
      if (query.minPrice !== undefined) where.basePrice.gte = query.minPrice;
      if (query.maxPrice !== undefined) where.basePrice.lte = query.maxPrice;
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
      data: products.map((p) => {
        const basePrice = Number(p.basePrice);
        return {
          ...p,
          basePrice,
          price: basePrice,
          variants: this.transformVariants(p.variants),
        };
      }),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  private transformProduct(product: any) {
    const basePrice = Number(product.basePrice);
    return {
      ...product,
      basePrice,
      price: basePrice,
      variants: this.transformVariants(product.variants ?? []),
    };
  }

  async findOne(id: string) {
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
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async findBySlug(slug: string) {
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
      throw new NotFoundException('Product not found');
    }

    return this.transformProduct(product);
  }

  async update(id: string, dto: UpdateProductDto) {
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

  async uploadImage(
    productId: string,
    file: Express.Multer.File,
    alt?: string,
    variantId?: string,
  ) {
    await this.findOne(productId);

    this.storage.validateFile(file);

    const key = this.storage.generateKey(productId, file.originalname);

    const result = await this.storage.upload({
      file,
      key,
      contentType: file.mimetype,
    });

    const maxOrder = await this.prisma.productImage.aggregate({
      where: { productId },
      _max: { order: true },
    });

    const image = await this.prisma.productImage.create({
      data: {
        productId,
        variantId: variantId ?? null,
        url: result.url,
        alt: alt ?? null,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    this.logger.log(`Image uploaded for product ${productId}: ${image.id}`);
    return image;
  }

  async uploadMultipleImages(
    productId: string,
    files: Express.Multer.File[],
  ) {
    const uploads = files.map((file) => this.uploadImage(productId, file));
    return Promise.all(uploads);
  }

  async deleteImage(productId: string, imageId: string) {
    const image = await this.prisma.productImage.findFirst({
      where: { id: imageId, productId },
    });

    if (!image) {
      throw new NotFoundException('Image not found for this product');
    }

    const key = this.storage.extractKeyFromUrl(image.url);
    if (key) {
      await this.storage.delete(key);
    }

    await this.prisma.productImage.delete({ where: { id: imageId } });

    this.logger.log(`Image ${imageId} deleted for product ${productId}`);
  }

  async reorderImages(
    productId: string,
    imageIds: string[],
  ) {
    const existing = await this.prisma.productImage.findMany({
      where: { productId },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((img) => img.id));
    const allValid = imageIds.every((id) => existingIds.has(id));
    if (!allValid) {
      throw new BadRequestException('Some image IDs do not belong to this product');
    }

    if (imageIds.length !== existing.length) {
      throw new BadRequestException('Must include all product images');
    }

    await this.prisma.$transaction(
      imageIds.map((id, index) =>
        this.prisma.productImage.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    this.logger.log(`Images reordered for product ${productId}`);
  }

  async softDelete(id: string) {
    await this.findOne(id);

    const images = await this.prisma.productImage.findMany({
      where: { productId: id },
      select: { url: true },
    });

    for (const image of images) {
      const key = this.storage.extractKeyFromUrl(image.url);
      if (key) {
        try {
          await this.storage.delete(key);
        } catch (error) {
          this.logger.warn(`Failed to delete S3 image ${key}: ${error}`);
        }
      }
    }

    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.logger.log(`Product soft-deleted: ${id} with ${images.length} images cleaned from S3`);
  }
}
