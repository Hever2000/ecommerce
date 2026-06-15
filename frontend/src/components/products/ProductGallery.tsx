'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductGalleryProps {
  images: string[];
  name: string;
}

export default function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selected, setSelected] = useState(0);
  const [zoomed, setZoomed] = useState(false);

  if (!images.length) {
    return (
      <div className="aspect-[4/5] bg-cream-200 flex items-center justify-center">
        <span className="text-xs uppercase tracking-wider text-ink-lighter">No Image</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[4/5] overflow-hidden bg-cream-200 cursor-crosshair"
        onMouseEnter={() => setZoomed(true)}
        onMouseLeave={() => setZoomed(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${images[selected]})`,
              transform: zoomed ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.3s ease-out',
            }}
          />
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border-2 transition-colors ${
                i === selected ? 'border-ink' : 'border-transparent hover:border-ink/30'
              }`}
            >
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${img})` }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
