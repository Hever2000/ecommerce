import { ConfigService } from '@nestjs/config';
export interface UploadResult {
    url: string;
    path: string;
    bucket: string;
    contentType: string;
    size: number;
}
export interface DeleteResult {
    path: string;
    bucket: string;
}
export declare class SupabaseStorageService {
    private config;
    private readonly logger;
    private readonly client;
    constructor(config: ConfigService);
    validateFile(file: Express.Multer.File): void;
    generatePath(productId: string, originalname: string): string;
    upload(params: {
        file: Express.Multer.File;
        path: string;
        contentType: string;
    }): Promise<UploadResult>;
    delete(path: string): Promise<DeleteResult>;
    extractPathFromUrl(url: string): string | null;
}
