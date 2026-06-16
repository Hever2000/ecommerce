import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(dto: CreateProductDto): Promise<{
        category: {
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
            parentId: string | null;
        } | null;
        attributes: ({
            attribute: {
                values: {
                    id: string;
                    createdAt: Date;
                    attributeId: string;
                    value: string;
                }[];
            } & {
                name: string;
                id: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            attributeId: string;
            productId: string;
        })[];
        variants: ({
            variantAttributeValues: ({
                attributeValue: {
                    attribute: {
                        name: string;
                        id: string;
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
            order: number;
            id: string;
            createdAt: Date;
            variantId: string | null;
            url: string;
            alt: string | null;
            productId: string;
        }[];
    } & {
        description: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
    }>;
    findAll(query: QueryProductDto): Promise<{
        data: {
            basePrice: number;
            variants: any[];
            category: {
                name: string;
                id: string;
                slug: string;
            } | null;
            _count: {
                variants: number;
            };
            images: {
                order: number;
                id: string;
                createdAt: Date;
                variantId: string | null;
                url: string;
                alt: string | null;
                productId: string;
            }[];
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
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
            description: string | null;
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            slug: string;
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
            order: number;
            id: string;
            createdAt: Date;
            variantId: string | null;
            url: string;
            alt: string | null;
            productId: string;
        }[];
    } & {
        description: string | null;
        name: string;
        id: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        slug: string;
        basePrice: import("@prisma/client/runtime/library").Decimal;
        categoryId: string | null;
    }>;
    remove(id: string): Promise<void>;
}
