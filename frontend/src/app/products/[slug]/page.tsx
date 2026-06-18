'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api, ApiError } from '@/lib/api';
import { useCartStore } from '@/lib/cart-store';
import ProductGallery from '@/components/products/ProductGallery';
import ProductCard from '@/components/products/ProductCard';
import Container from '@/components/ui/Container';
import Button from '@/components/ui/Button';
import type { Product, ProductVariant, PaginatedResponse } from '@/types';
import { Check, ChevronDown, Ruler, Truck, RotateCcw, ShieldCheck } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({});
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const prod = await api.get<Product>(`/products/slug/${slug}`);

        let relatedProducts: Product[] = [];
        try {
          const res = await api.get<PaginatedResponse<Product>>('/products', {
            categorySlug: prod.category?.slug ?? '',
            limit: '4',
            published: 'true',
          });
          relatedProducts = (res.data ?? []).filter((p) => p.id !== prod.id).slice(0, 4);
        } catch {
          /* ignore */
        }

        setProduct(prod);
        setRelated(relatedProducts);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setError('Product not found');
        } else {
          setError('Error loading product');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const attrNames = useMemo(() => {
    if (!product) return [];
    const set = new Set<string>();
    product.variants.forEach((v) => Object.keys(v.attributes).forEach((k) => set.add(k)));
    return Array.from(set);
  }, [product]);

  const options = useMemo(() => {
    if (!product) return {};
    const opts: Record<string, string[]> = {};
    attrNames.forEach((name) => {
      const vals = new Set<string>();
      product.variants.forEach((v) => {
        if (v.attributes[name]) vals.add(v.attributes[name]);
      });
      opts[name] = Array.from(vals);
    });
    return opts;
  }, [product, attrNames]);

  const selectedVariant = useMemo((): ProductVariant | null => {
    if (!product) return null;
    if (attrNames.length === 0) return product.variants[0] ?? null;
    return product.variants.find((v) =>
      attrNames.every((name) => v.attributes[name] === selectedAttrs[name])
    ) ?? null;
  }, [product, attrNames, selectedAttrs]);

  const outOfStock = selectedVariant ? selectedVariant.stock === 0 : false;

  function handleAdd() {
    if (!product || !selectedVariant) return;
    addItem(product, selectedVariant, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          <div className="aspect-[4/5] animate-pulse bg-cream-200" />
          <div className="mt-8 space-y-6 lg:mt-0">
            <div className="h-10 w-3/4 animate-pulse bg-cream-200" />
            <div className="h-8 w-1/4 animate-pulse bg-cream-200" />
            <div className="h-24 animate-pulse bg-cream-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <Container className="py-28 text-center">
        <h2 className="font-display text-4xl text-ink">{error ?? 'Product not found'}</h2>
        <p className="mt-4 text-ink-lighter">This product doesn&apos;t exist or was removed.</p>
        <Link href="/products" className="mt-8 inline-block text-sm font-semibold uppercase tracking-wider text-ink underline underline-offset-4 hover:text-accent">
          Back to Products
        </Link>
      </Container>
    );
  }

  return (
    <div className="pt-28">
      <Container>
        <nav className="mb-8 flex items-center gap-2 text-xs text-ink-lighter">
          <Link href="/" className="hover:text-ink transition-colors">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-ink transition-colors">Products</Link>
          {product.category && (
            <>
              <span>/</span>
              <Link href={`/products?category=${product.category.slug}`} className="hover:text-ink transition-colors">
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-ink">{product.name}</span>
        </nav>
      </Container>

      <Container className="pb-20 lg:pb-32">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ProductGallery images={product.images} name={product.name} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 lg:mt-0 lg:sticky lg:top-32 lg:self-start"
          >
            {product.category && (
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-lighter">
                {product.category.name}
              </p>
            )}
            <h1 className="font-display text-4xl font-bold text-ink lg:text-5xl">
              {product.name}
            </h1>

            <div className="mt-6 flex items-baseline gap-4">
              <span className="font-display text-3xl font-bold text-ink">
                ${((selectedVariant ? selectedVariant.price : product.price) ?? 0).toLocaleString('es-AR')}
              </span>
              {product.comparePrice != null && (
                <span className="text-lg text-ink-lighter line-through">
                  ${product.comparePrice.toLocaleString('es-AR')}
                </span>
              )}
            </div>

            <p className="mt-6 text-base leading-relaxed text-ink-light">
              {product.description}
            </p>

            {attrNames.length > 0 && (
              <div className="mt-8 space-y-6">
                {attrNames.map((name) => (
                  <div key={name}>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink-lighter">
                      {name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {options[name]?.map((value) => {
                        const isSelected = selectedAttrs[name] === value;
                        return (
                          <button
                            key={value}
                            onClick={() => setSelectedAttrs((prev) => ({ ...prev, [name]: value }))}
                            className={`px-5 py-2 text-sm transition-all duration-200 ${
                              isSelected
                                ? 'bg-ink text-cream-50'
                                : 'border border-cream-200 text-ink hover:border-ink'
                            }`}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-6">
              {selectedVariant && (
                <p className={`text-sm ${outOfStock ? 'text-red-500' : 'text-ink-lighter'}`}>
                  {outOfStock
                    ? 'Out of Stock'
                    : `${selectedVariant.stock} unit${selectedVariant.stock !== 1 ? 's' : ''} available`}
                </p>
              )}
            </div>

            <div className="mt-8 space-y-3">
              <Button
                onClick={handleAdd}
                disabled={!selectedVariant || outOfStock}
                className="w-full"
                size="xl"
              >
                {added ? (
                  <span className="flex items-center gap-2">
                    <Check size={16} /> Added to Cart
                  </span>
                ) : !selectedVariant && attrNames.length > 0 ? (
                  'Select Options'
                ) : outOfStock ? (
                  'Out of Stock'
                ) : (
                  'Add to Cart'
                )}
              </Button>
            </div>

            <div className="mt-10 space-y-4 border-t border-cream-200 pt-8">
              {[
                { icon: Ruler, text: 'Find your perfect fit — see our size guide.', link: 'Size Guide' },
                { icon: Truck, text: 'Free shipping on orders over $150.', link: 'Shipping Info' },
                { icon: RotateCcw, text: '30-day easy returns. No questions asked.', link: 'Returns' },
                { icon: ShieldCheck, text: 'Premium quality guaranteed.', link: 'Quality Promise' },
              ].map((item) => (
                <div key={item.link} className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-ink-lighter" strokeWidth={1.5} />
                  <p className="text-sm text-ink-lighter">
                    {item.text}{' '}
                    <button className="font-medium text-ink underline underline-offset-2 hover:text-accent transition-colors">
                      {item.link}
                    </button>
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <span className="mb-3 block text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
              Complete the Look
            </span>
            <h2 className="font-display text-4xl font-bold text-ink lg:text-5xl">
              You May Also Like
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {related.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <ProductCard product={p} />
              </motion.div>
            ))}
          </div>
        </Container>
      )}
    </div>
  );
}
