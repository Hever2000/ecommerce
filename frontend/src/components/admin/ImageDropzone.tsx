'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileImage, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

interface PreviewFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

interface ImageDropzoneProps {
  onUpload: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

export default function ImageDropzone({ onUpload, disabled }: ImageDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previews, setPreviews] = useState<PreviewFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Tipo no soportado: ${file.type}`;
    }
    if (file.size > MAX_SIZE) {
      return `Archivo muy grande (máx 10MB): ${file.name}`;
    }
    return null;
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const newPreviews: PreviewFile[] = [];
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      const error = validateFile(file);
      newPreviews.push({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error ?? undefined,
      });
    }

    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const removePreview = (id: string) => {
    setPreviews((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled || isUploading) return;
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleSelect = () => inputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    const pending = previews.filter((p) => p.status === 'pending');
    if (!pending.length) return;

    setIsUploading(true);

    setPreviews((prev) =>
      prev.map((p) => (p.status === 'pending' ? { ...p, status: 'uploading' as const, progress: 0 } : p)),
    );

    try {
      await onUpload(pending.map((p) => p.file));

      setPreviews((prev) =>
        prev.map((p) => (p.status === 'uploading' ? { ...p, status: 'done' as const, progress: 100 } : p)),
      );
    } catch {
      setPreviews((prev) =>
        prev.map((p) =>
          p.status === 'uploading'
            ? { ...p, status: 'error' as const, error: 'Error al subir' }
            : p,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const clearDone = () => {
    setPreviews((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return prev.filter((p) => p.status !== 'done');
    });
  };

  const hasPending = previews.some((p) => p.status === 'pending');

  return (
    <div className="space-y-3">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleSelect}
        className={clsx(
          'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all',
          isDragOver
            ? 'border-ink bg-cream-100'
            : 'border-cream-300 bg-cream-50 hover:border-ink/40 hover:bg-cream-100',
          disabled && 'pointer-events-none opacity-50',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
        <Upload size={32} className="mb-3 text-ink-light" />
        <p className="text-sm font-medium text-ink">Arrastrá imágenes o hacé clic para seleccionar</p>
        <p className="mt-1 text-xs text-ink-lighter">JPG, PNG, WebP — Máx 10MB por archivo</p>
      </div>

      <AnimatePresence>
        {previews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-light uppercase tracking-wider">
                {previews.length} archivo(s)
              </p>
              <div className="flex gap-2">
                {hasPending && (
                  <button
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-ink/80 disabled:opacity-50"
                  >
                    {isUploading ? 'Subiendo...' : 'Subir archivos'}
                  </button>
                )}
                <button
                  onClick={clearDone}
                  className="rounded-lg bg-cream-200 px-3 py-1.5 text-xs font-semibold text-ink transition-colors hover:bg-cream-300"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {previews.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group relative aspect-square overflow-hidden rounded-lg border border-cream-200 bg-cream-100"
                >
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="h-full w-full object-cover"
                  />

                  {item.status === 'uploading' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <div className="h-1 w-3/4 overflow-hidden rounded-full bg-white/30">
                        <motion.div
                          className="h-full bg-white"
                          initial={{ width: 0 }}
                          animate={{ width: '90%' }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </div>
                    </div>
                  )}

                  {item.status === 'done' && (
                    <div className="absolute right-1 top-1 rounded-full bg-emerald-500 p-0.5">
                      <CheckCircle2 size={14} className="text-white" />
                    </div>
                  )}

                  {item.status === 'error' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-red-500/20">
                      <div className="flex items-center gap-1 rounded-md bg-red-500 px-2 py-1 text-xs text-white">
                        <AlertCircle size={12} />
                        {item.error || 'Error'}
                      </div>
                    </div>
                  )}

                  {item.status !== 'uploading' && (
                    <button
                      onClick={() => removePreview(item.id)}
                      className="absolute right-1 top-1 rounded-full bg-black/50 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X size={12} className="text-white" />
                    </button>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 truncate bg-gradient-to-t from-black/60 to-transparent p-1.5">
                    <p className="truncate text-[10px] text-white">{item.file.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
