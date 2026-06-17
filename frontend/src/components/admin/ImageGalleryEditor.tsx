'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, Reorder } from 'framer-motion';
import { Trash2, GripVertical, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  order: number;
}

interface ImageGalleryEditorProps {
  productId: string;
  images: ProductImage[];
  onImagesChange: () => void;
}

async function deleteImage(productId: string, imageId: string) {
  await api.del(`/products/${productId}/images/${imageId}`);
}

async function reorderImages(productId: string, imageIds: string[]) {
  await api.patch(`/products/${productId}/images/reorder`, { imageIds });
}

export default function ImageGalleryEditor({
  productId,
  images,
  onImagesChange,
}: ImageGalleryEditorProps) {
  const [items, setItems] = useState(images);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const sorted = [...items].sort((a, b) => a.order - b.order);

  const handleDelete = async (imageId: string) => {
    setDeleting((prev) => new Set(prev).add(imageId));
    setError(null);
    try {
      await deleteImage(productId, imageId);
      setItems((prev) => prev.filter((img) => img.id !== imageId));
      onImagesChange();
    } catch (err) {
      setError('Error al eliminar la imagen');
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(imageId);
        return next;
      });
    }
  };

  const handleReorder = async (reordered: ProductImage[]) => {
    setItems(reordered);
    setError(null);
    try {
      const ids = reordered.map((img) => img.id);
      await reorderImages(productId, ids);
      onImagesChange();
    } catch {
      setItems(sorted);
      setError('Error al reordenar');
    }
  };

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-cream-300 bg-cream-50 p-8">
        <p className="text-sm text-ink-lighter">Sin imágenes. Arrastrá archivos más arriba para agregar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <p className="text-xs font-medium text-ink-light uppercase tracking-wider">
        {sorted.length} imagen(es) — Arrastrá para reordenar
      </p>

      <Reorder.Group
        axis="y"
        values={sorted}
        onReorder={handleReorder}
        className="space-y-2"
      >
        {sorted.map((image) => (
          <Reorder.Item
            key={image.id}
            value={image}
            className="relative flex items-center gap-3 rounded-xl border border-cream-200 bg-white p-2 transition-shadow hover:shadow-sm"
          >
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical size={16} className="text-ink-lighter" />
            </div>

            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-cream-100">
              <Image
                src={image.url}
                alt={image.alt ?? ''}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {image.alt || `Imagen ${image.order + 1}`}
              </p>
              <p className="truncate text-xs text-ink-lighter">
                {image.url.split('/').pop()}
              </p>
            </div>

            <button
              onClick={() => handleDelete(image.id)}
              disabled={deleting.has(image.id)}
              className="rounded-lg p-2 text-red-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
            >
              <Trash2 size={16} />
            </button>
          </Reorder.Item>
        ))}
      </Reorder.Group>
    </div>
  );
}
