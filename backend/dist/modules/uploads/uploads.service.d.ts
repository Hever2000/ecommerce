export declare class UploadsService {
    private readonly logger;
    private s3;
    constructor();
    private getBucket;
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    uploadMultiple(files: Express.Multer.File[], folder?: string): Promise<string[]>;
    deleteFile(url: string): Promise<void>;
}
