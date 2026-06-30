import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';
import { Express } from 'express';
import { v4 as uuid } from 'uuid';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BUCKET_NAME = 'products';

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

@Injectable()
export class SupabaseStorageService {
  private readonly logger = new Logger(SupabaseStorageService.name);
  private readonly client: StorageClient;

  constructor(private config: ConfigService) {
    const supabaseUrl = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars');
    }

    this.client = new StorageClient(`${supabaseUrl}/storage/v1`, {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    });
  }

  validateFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype as (typeof ALLOWED_MIME_TYPES)[number])) {
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

  generatePath(productId: string, originalname: string): string {
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

    return `${BUCKET_NAME}/${productId}/${name}-${suffix}.${ext}`;
  }

  async upload(params: {
    file: Express.Multer.File;
    path: string;
    contentType: string;
  }): Promise<UploadResult> {
    const { file, path, contentType } = params;

    try {
      const { error } = await this.client.from(BUCKET_NAME).upload(path, file.buffer, {
        contentType,
        upsert: true,
      });

      if (error) throw error;

      const supabaseUrl = this.config.get<string>('SUPABASE_URL');
      const url = `${supabaseUrl}/storage/v1/object/public/${path}`;

      this.logger.log(`File uploaded: ${url}`);

      return { url, path, bucket: BUCKET_NAME, contentType, size: file.size };
    } catch (error) {
      this.logger.error(`Supabase upload failed: ${error}`, (error as Error).stack);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async delete(path: string): Promise<DeleteResult> {
    try {
      const { error } = await this.client.from(BUCKET_NAME).remove([path]);
      if (error) throw error;

      this.logger.log(`File deleted: ${path}`);
      return { path, bucket: BUCKET_NAME };
    } catch (error) {
      this.logger.error(`Supabase delete failed: ${error}`, (error as Error).stack);
      throw new BadRequestException('Failed to delete file');
    }
  }

  extractPathFromUrl(url: string): string | null {
    const prefix = `/storage/v1/object/public/`;
    const idx = url.indexOf(prefix);
    if (idx === -1) return null;
    return url.slice(idx + prefix.length);
  }
}
