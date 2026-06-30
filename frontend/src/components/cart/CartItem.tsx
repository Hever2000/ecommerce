'use client';

import { useCartStore } from '@/lib/cart-store';
import type { CartItem } from '@/types';
import { Minus, Plus, Trash2 } from 'lucide-react';

interface CartItemProps {
  item: CartItem;
}

export default function CartItemComponent({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const subtotal = item.variant.price * item.quantity;
  const variantLabel = Object.values(item.variant.attributes).join(', ');

  return (
    <div className="flex gap-6 border-b border-cream-200 pb-6">
      <div className="h-28 w-28 flex-shrink-0 overflow-hidden bg-cream-200 sm:h-36 sm:w-36">
        <div
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${item.variant.image || item.product.images[0]?.url || ''})` }}
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-medium text-ink">{item.product.name}</h3>
              {variantLabel && (
                <p className="mt-0.5 text-xs text-ink-lighter">{variantLabel}</p>
              )}
            </div>
            <p className="text-sm font-semibold text-ink">${subtotal.toLocaleString('es-AR')}</p>
          </div>
          <p className="mt-1 text-xs text-ink-lighter">
            ${item.variant.price.toLocaleString('es-AR')} ea
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-cream-200">
            <button
              onClick={() => updateQuantity(item.variant.id, item.quantity - 1)}
              disabled={item.quantity <= 1}
              className="flex h-9 w-9 items-center justify-center text-ink-lighter hover:bg-cream-200 disabled:opacity-30 transition-colors"
            >
              <Minus size={14} strokeWidth={1.5} />
            </button>
            <span className="flex h-9 w-10 items-center justify-center text-xs font-medium text-ink">
              {item.quantity}
            </span>
            <button
              onClick={() => updateQuantity(item.variant.id, item.quantity + 1)}
              disabled={item.quantity >= item.variant.stock}
              className="flex h-9 w-9 items-center justify-center text-ink-lighter hover:bg-cream-200 disabled:opacity-30 transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} />
            </button>
          </div>

          <button
            onClick={() => removeItem(item.variant.id)}
            className="text-ink-lighter hover:text-ink transition-colors"
            aria-label="Remove"
          >
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
