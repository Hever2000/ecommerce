'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import ImageDropzone from './ImageDropzone';
import ImageGalleryEditor from './ImageGalleryEditor';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface ProductImageManagerProps {
  productId: string | null;
  images: ProductImage[];
  onImagesChange: () => void;
}

export default function ProductImageManager({
  productId,
  images,
  onImagesChange,
}: ProductImageManagerProps) {
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    if (!productId) return;
    setUploadError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      await api.uploadMultiple(`/products/${productId}/images/multiple`, 'files', files);
      onImagesChange();
    } catch (err) {
      setUploadError('Error al subir imágenes');
      throw err;
    }
  };

  return (
    <div className="space-y-4">
      {!productId ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cream-300 bg-cream-50 p-8">
          <p className="text-sm text-ink-lighter">
            Creá el producto primero para poder agregar imágenes
          </p>
        </div>
      ) : (
        <>
          <ImageDropzone onUpload={handleUpload} />
          {uploadError && (
            <p className="text-xs text-red-500">{uploadError}</p>
          )}
          <ImageGalleryEditor
            productId={productId}
            images={images}
            onImagesChange={onImagesChange}
          />
        </>
      )}
    </div>
  );
}
