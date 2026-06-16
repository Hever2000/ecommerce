export declare class QueryProductDto {
    search?: string;
    categorySlug?: string;
    published?: boolean;
    featured?: boolean;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
