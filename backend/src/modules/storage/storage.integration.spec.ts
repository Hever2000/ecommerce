import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

jest.mock('@aws-sdk/client-s3', () => {
  const mockSend = jest.fn();
  const mockS3Client = jest.fn(() => ({
    send: mockSend,
  }));

  const MockCommand = jest.fn((input: unknown) => ({ input }));

  return {
    S3Client: mockS3Client,
    PutObjectCommand: MockCommand,
    DeleteObjectCommand: MockCommand,
  };
});

import { S3Client } from '@aws-sdk/client-s3';

describe('StorageService (Integration)', () => {
  let service: StorageService;
  let mockS3Send: jest.Mock;

  const mockFile = (): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'integration-test.webp',
    encoding: '7bit',
    mimetype: 'image/webp',
    buffer: Buffer.from('test-image-data-for-integration'),
    size: 1024,
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
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

    const s3Client = (service as any).client as jest.Mocked<S3Client>;
    mockS3Send = s3Client.send as unknown as jest.Mock;
    mockS3Send.mockResolvedValue({});
  });

  afterEach(() => {
    mockS3Send.mockReset();
  });

  describe('upload', () => {
    it('should upload file and return url and key', async () => {
      const file = mockFile();
      const key = 'products/test-product/test.webp';

      const result = await service.upload({
        file,
        key,
        contentType: file.mimetype,
      });

      expect(result).toEqual({
        url: 'https://ecommerce-bucket-santiagocoronel.s3.us-east-2.amazonaws.com/products/test-product/test.webp',
        key: 'products/test-product/test.webp',
        bucket: 'ecommerce-bucket-santiagocoronel',
        contentType: 'image/webp',
        size: 1024,
      });

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'ecommerce-bucket-santiagocoronel',
            Key: 'products/test-product/test.webp',
            ContentType: 'image/webp',
          }),
        }),
      );
    });

    it('should throw on S3 failure', async () => {
      mockS3Send.mockRejectedValue(new Error('Network error'));

      await expect(
        service.upload({
          file: mockFile(),
          key: 'test.webp',
          contentType: 'image/webp',
        }),
      ).rejects.toThrow('Failed to upload file to S3');
    });
  });

  describe('delete', () => {
    it('should delete object from S3', async () => {
      const result = await service.delete('products/test-product/test.webp');

      expect(result).toEqual({
        key: 'products/test-product/test.webp',
        bucket: 'ecommerce-bucket-santiagocoronel',
      });

      expect(mockS3Send).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: 'ecommerce-bucket-santiagocoronel',
            Key: 'products/test-product/test.webp',
          }),
        }),
      );
    });

    it('should throw on S3 delete failure', async () => {
      mockS3Send.mockRejectedValue(new Error('Access denied'));

      await expect(
        service.delete('products/test-product/test.webp'),
      ).rejects.toThrow('Failed to delete file from S3');
    });
  });
});
