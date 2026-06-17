import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const mockFile = (overrides: Partial<Express.Multer.File> = {}): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'test-image.webp',
    encoding: '7bit',
    mimetype: 'image/webp',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  beforeAll(() => {
    process.env.AWS_REGION = 'us-east-2';
    process.env.AWS_ACCESS_KEY_ID = 'test-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
    process.env.AWS_S3_BUCKET_NAME = 'ecommerce-bucket-santiagocoronel';
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  describe('constructor', () => {
    it('should throw if neither AWS_S3_BUCKET_NAME nor AWS_S3_BUCKET is set', () => {
      const oldName = process.env.AWS_S3_BUCKET_NAME;
      const oldBucket = process.env.AWS_S3_BUCKET;
      delete process.env.AWS_S3_BUCKET_NAME;
      delete process.env.AWS_S3_BUCKET;
      expect(() => new StorageService()).toThrow('S3 bucket not configured');
      process.env.AWS_S3_BUCKET_NAME = oldName;
      process.env.AWS_S3_BUCKET = oldBucket;
    });

    it('should use AWS_S3_BUCKET as fallback', () => {
      const oldName = process.env.AWS_S3_BUCKET_NAME;
      const oldBucket = process.env.AWS_S3_BUCKET;
      delete process.env.AWS_S3_BUCKET_NAME;
      process.env.AWS_S3_BUCKET = 'fallback-bucket';
      const fallback = new StorageService();
      expect(fallback.getBucket()).toBe('fallback-bucket');
      process.env.AWS_S3_BUCKET_NAME = oldName;
      process.env.AWS_S3_BUCKET = oldBucket;
    });
  });

  describe('validateFile', () => {
    it('should throw on null file', () => {
      expect(() => service.validateFile(null as any)).toThrow(BadRequestException);
    });

    it('should accept valid mime types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
      for (const mimetype of validTypes) {
        expect(() => service.validateFile(mockFile({ mimetype }))).not.toThrow();
      }
    });

    it('should reject invalid mime types', () => {
      const invalidTypes = ['application/pdf', 'application/zip', 'image/svg+xml', 'application/x-msdownload'];
      for (const mimetype of invalidTypes) {
        expect(() => service.validateFile(mockFile({ mimetype }))).toThrow(BadRequestException);
      }
    });

    it('should reject files over 10MB', () => {
      const oversized = mockFile({ size: 11 * 1024 * 1024 });
      expect(() => service.validateFile(oversized)).toThrow(BadRequestException);
    });

    it('should accept files under 10MB', () => {
      const valid = mockFile({ size: 9 * 1024 * 1024 });
      expect(() => service.validateFile(valid)).not.toThrow();
    });
  });

  describe('generateKey', () => {
    it('should generate key with product folder structure', () => {
      const key = service.generateKey('abc-123', 'front.webp');
      expect(key).toMatch(/^products\/abc-123\/front-[a-f0-9]+\.webp$/);
    });

    it('should sanitize filename', () => {
      const key = service.generateKey('abc', 'My Cool Image!.png');
      expect(key).toMatch(/^products\/abc\/my-cool-image--[a-f0-9]+\.png$/);
    });

    it('should handle filenames without extension', () => {
      const key = service.generateKey('abc', 'noext');
      expect(key).toMatch(/^products\/abc\/noext-[a-f0-9]+\.webp$/);
    });
  });

  describe('getPublicUrl', () => {
    it('should generate correct S3 URL', () => {
      const url = service.getPublicUrl('products/abc/test.webp');
      expect(url).toBe(
        'https://ecommerce-bucket-santiagocoronel.s3.us-east-2.amazonaws.com/products/abc/test.webp',
      );
    });
  });

  describe('extractKeyFromUrl', () => {
    it('should extract key from regional S3 URL', () => {
      const url = 'https://ecommerce-bucket-santiagocoronel.s3.us-east-2.amazonaws.com/products/abc/test.webp';
      expect(service.extractKeyFromUrl(url)).toBe('products/abc/test.webp');
    });

    it('should extract key from legacy S3 URL', () => {
      const url = 'https://ecommerce-bucket-santiagocoronel.s3.amazonaws.com/products/abc/test.webp';
      expect(service.extractKeyFromUrl(url)).toBe('products/abc/test.webp');
    });

    it('should return null for unrecognized URLs', () => {
      expect(service.extractKeyFromUrl('https://other-bucket.s3.amazonaws.com/test.webp')).toBeNull();
    });
  });

  describe('getBucket', () => {
    it('should return the configured bucket name', () => {
      expect(service.getBucket()).toBe('ecommerce-bucket-santiagocoronel');
    });
  });

  describe('getRegion', () => {
    it('should return the configured region', () => {
      expect(service.getRegion()).toBe('us-east-2');
    });
  });
});
