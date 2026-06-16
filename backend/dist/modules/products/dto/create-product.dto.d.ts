declare class CreateVariantDto {
    sku: string;
    price: number;
    stock: number;
    attributeValueIds?: string[];
}
declare class CreateAttributeDto {
    attributeId: string;
}
export declare class CreateProductDto {
    name: string;
    slug: string;
    description?: string;
    basePrice: number;
    categoryId?: string;
    attributes?: CreateAttributeDto[];
    variants?: CreateVariantDto[];
}
export {};
