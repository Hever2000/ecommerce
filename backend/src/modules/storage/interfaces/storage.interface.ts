export interface UploadResult {
  url: string;
  key: string;
  bucket: string;
  contentType: string;
  size: number;
}

export interface DeleteResult {
  key: string;
  bucket: string;
}

export interface IStorageService {
  upload(params: {
    file: Express.Multer.File;
    key: string;
    contentType: string;
  }): Promise<UploadResult>;

  delete(key: string): Promise<DeleteResult>;

  getPublicUrl(key: string): string;

  getBucket(): string;

  getRegion(): string;
}
