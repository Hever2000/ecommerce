import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { SupabaseStorageService } from '../supabase-storage/supabase-storage.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
export declare class ProductsService {
    private prisma;
    private storage;
    private readonly logger;
    constructor(prisma: PrismaService, storage: SupabaseStorageService);
    create(dto: CreateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            parentId: string | null;
        } | null;
        variants: ({
            variantAttributeValues: ({
                attributeValue: {
                    attribute: {
                        id: string;
                        name: string;
                        createdAt: Date;
                    };
                } & {
                    id: string;
                    createdAt: Date;
                    attributeId: string;
                    value: string;
                };
            } & {
                id: string;
                attributeValueId: string;
                variantId: string;
            })[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            price: Prisma.Decimal;
            stock: number;
            productId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            variantId: string | null;
            url: string;
            alt: string | null;
            order: number;
            productId: string;
        }[];
        attributes: ({
            attribute: {
                values: {
                    id: string;
                    createdAt: Date;
                    attributeId: string;
                    value: string;
                }[];
            } & {
                id: string;
                name: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            attributeId: string;
            productId: string;
        })[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        basePrice: Prisma.Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryId: string | null;
    }>;
    private transformVariants;
    findAll(query: QueryProductDto): Promise<{
        data: {
            basePrice: number;
            price: number;
            variants: any[];
            category: {
                id: string;
                name: string;
                slug: string;
                parentId: string | null;
                parent: {
                    slug: string;
                    parent: {
                        slug: string;
                    } | null;
                } | null;
            } | null;
            images: {
                id: string;
                createdAt: Date;
                variantId: string | null;
                url: string;
                alt: string | null;
                order: number;
                productId: string;
            }[];
            _count: {
                variants: number;
            };
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            categoryId: string | null;
        }[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private transformProduct;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, dto: UpdateProductDto): Promise<{
        category: {
            id: string;
            name: string;
            slug: string;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            parentId: string | null;
        } | null;
        variants: ({
            variantAttributeValues: ({
                attributeValue: {
                    id: string;
                    createdAt: Date;
                    attributeId: string;
                    value: string;
                };
            } & {
                id: string;
                attributeValueId: string;
                variantId: string;
            })[];
        } & {
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            sku: string;
            price: Prisma.Decimal;
            stock: number;
            productId: string;
        })[];
        images: {
            id: string;
            createdAt: Date;
            variantId: string | null;
            url: string;
            alt: string | null;
            order: number;
            productId: string;
        }[];
    } & {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        basePrice: Prisma.Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryId: string | null;
    }>;
    uploadImage(productId: string, file: Express.Multer.File, alt?: string, variantId?: string): Promise<{
        id: string;
        createdAt: Date;
        variantId: string | null;
        url: string;
        alt: string | null;
        order: number;
        productId: string;
    }>;
    uploadMultipleImages(productId: string, files: Express.Multer.File[]): Promise<{
        id: string;
        createdAt: Date;
        variantId: string | null;
        url: string;
        alt: string | null;
        order: number;
        productId: string;
    }[]>;
    deleteImage(productId: string, imageId: string): Promise<void>;
    reorderImages(productId: string, imageIds: string[]): Promise<void>;
    softDelete(id: string): Promise<void>;
}
