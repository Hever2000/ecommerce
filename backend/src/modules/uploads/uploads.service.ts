import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { Express } from 'express';

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);
  private s3: AWS.S3;

  constructor() {
    AWS.config.update({
      region: process.env.AWS_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    });

    this.s3 = new AWS.S3();
  }

  private getBucket(): string {
    return process.env.AWS_S3_BUCKET || 'ecommerce-aws-products';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'products',
  ): Promise<string> {
    const key = `${folder}/${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;

    try {
      await this.s3
        .upload({
          Bucket: this.getBucket(),
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
        })
        .promise();

      const url = `https://${this.getBucket()}.s3.amazonaws.com/${key}`;
      this.logger.log(`File uploaded: ${url}`);
      return url;
    } catch (error) {
      this.logger.error(`S3 upload failed: ${error}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder: string = 'products',
  ): Promise<string[]> {
    const uploads = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploads);
  }

  async deleteFile(url: string) {
    const key = url.split('.amazonaws.com/')[1];
    if (!key) {
      this.logger.warn(`Invalid S3 URL: ${url}`);
      return;
    }

    try {
      await this.s3
        .deleteObject({
          Bucket: this.getBucket(),
          Key: key,
        })
        .promise();

      this.logger.log(`File deleted: ${key}`);
    } catch (error) {
      this.logger.error(`S3 delete failed: ${error}`);
    }
  }
}
