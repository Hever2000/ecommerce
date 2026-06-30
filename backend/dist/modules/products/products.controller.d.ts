import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
import { ReorderImagesDto } from './dto/reorder-images.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
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
            price: import("@prisma/client/runtime/library").Decimal;
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
        basePrice: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryId: string | null;
    }>;
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
    findBySlug(slug: string): Promise<any>;
    findOne(id: string): Promise<any>;
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
            price: import("@prisma/client/runtime/library").Decimal;
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
        basePrice: import("@prisma/client/runtime/library").Decimal;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        categoryId: string | null;
    }>;
    uploadImage(id: string, file: Express.Multer.File): Promise<{
        id: string;
        createdAt: Date;
        variantId: string | null;
        url: string;
        alt: string | null;
        order: number;
        productId: string;
    }>;
    uploadMultipleImages(id: string, files: Express.Multer.File[]): Promise<{
        id: string;
        createdAt: Date;
        variantId: string | null;
        url: string;
        alt: string | null;
        order: number;
        productId: string;
    }[]>;
    deleteImage(id: string, imageId: string): Promise<{
        deleted: boolean;
    }>;
    reorderImages(id: string, dto: ReorderImagesDto): Promise<{
        reordered: boolean;
    }>;
    remove(id: string): Promise<void>;
}
