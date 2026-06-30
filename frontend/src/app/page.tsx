import { api } from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';
import Hero from '@/components/home/Hero';
import DisciplineSelector from '@/components/home/DisciplineSelector';
import BrandCarousel from '@/components/home/BrandCarousel';
import TrendingProducts from '@/components/home/TrendingProducts';
import ValueProposition from '@/components/home/ValueProposition';

async function getProducts(): Promise<Product[]> {
  try {
    const res = await api.get<PaginatedResponse<Product>>('/products', {
      limit: '8',
      published: 'true',
      sort: 'newest',
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const products = await getProducts();

  return (
    <>
      <Hero />
      <DisciplineSelector />
      <BrandCarousel />
      <TrendingProducts products={products} />
      <ValueProposition />
    </>
  );
}
