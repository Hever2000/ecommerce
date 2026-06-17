export const STORAGE_PROVIDER_TOKEN = 'STORAGE_PROVIDER';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const BUCKET_FOLDERS = {
  PRODUCTS: 'products',
} as const;

export const BUCKET_REGION = process.env.AWS_REGION || 'us-east-2';
