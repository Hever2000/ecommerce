import { UploadsService } from './uploads.service';
export declare class UploadsController {
    private readonly uploadsService;
    constructor(uploadsService: UploadsService);
    uploadSingle(file: Express.Multer.File): Promise<{
        url: string;
    }>;
    uploadMultiple(files: Express.Multer.File[]): Promise<{
        urls: string[];
    }>;
    delete(url: string): Promise<{
        deleted: boolean;
    }>;
}
