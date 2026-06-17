import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Express } from 'express';
import { v4 as uuid } from 'uuid';
import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  BUCKET_FOLDERS,
  BUCKET_REGION,
} from './constants/storage.constants';
import type { UploadResult, DeleteResult, IStorageService } from './interfaces/storage.interface';

@Injectable()
export class StorageService implements IStorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.bucket = this.resolveBucket();
    this.region = process.env.AWS_REGION || BUCKET_REGION;

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  private resolveBucket(): string {
    const bucket = process.env.AWS_S3_BUCKET_NAME || process.env.AWS_S3_BUCKET;
    if (!bucket) {
      throw new Error(
        'S3 bucket not configured. Set AWS_S3_BUCKET_NAME or AWS_S3_BUCKET in env',
      );
    }
    return bucket;
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as typeof ALLOWED_MIME_TYPES[number])) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }
  }

  generateKey(productId: string, originalname: string): string {
    const dotIndex = originalname.lastIndexOf('.');
    let ext: string;
    let name: string;

    if (dotIndex > 0) {
      ext = originalname.slice(dotIndex + 1).toLowerCase();
      name = originalname.slice(0, dotIndex);
    } else {
      ext = 'webp';
      name = originalname;
    }

    name = name
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .toLowerCase()
      .slice(0, 40);

    const suffix = uuid().slice(0, 8);

    return `${BUCKET_FOLDERS.PRODUCTS}/${productId}/${name}-${suffix}.${ext}`;
  }

  async upload(params: {
    file: Express.Multer.File;
    key: string;
    contentType: string;
  }): Promise<UploadResult> {
    const { file, key, contentType } = params;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
    });

    try {
      await this.client.send(command);

      const url = this.getPublicUrl(key);

      this.logger.log(`File uploaded: ${url}`);

      return {
        url,
        key,
        bucket: this.bucket,
        contentType,
        size: file.size,
      };
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error}`, (error as Error).stack);
      throw new BadRequestException('Failed to upload file to S3');
    }
  }

  async delete(key: string): Promise<DeleteResult> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      this.logger.log(`File deleted: ${key}`);

      return {
        key,
        bucket: this.bucket,
      };
    } catch (error) {
      this.logger.error(`S3 delete failed: ${error}`, (error as Error).stack);
      throw new BadRequestException('Failed to delete file from S3');
    }
  }

  getPublicUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  extractKeyFromUrl(url: string): string | null {
    const prefix = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;
    if (url.startsWith(prefix)) {
      return url.slice(prefix.length);
    }

    const altPrefix = `https://${this.bucket}.s3.amazonaws.com/`;
    if (url.startsWith(altPrefix)) {
      return url.slice(altPrefix.length);
    }

    return null;
  }

  getBucket(): string {
    return this.bucket;
  }

  getRegion(): string {
    return this.region;
  }
}
