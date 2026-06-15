import { api } from '@/lib/api';
import type { Product, PaginatedResponse } from '@/types';
import Hero from '@/components/home/Hero';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import NewArrivals from '@/components/home/NewArrivals';
import BrandStory from '@/components/home/BrandStory';
import FeaturedCollection from '@/components/home/FeaturedCollection';
import LifestyleSection from '@/components/home/LifestyleSection';
import Benefits from '@/components/home/Benefits';
import Reviews from '@/components/home/Reviews';
import Newsletter from '@/components/home/Newsletter';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const res = await api.get<PaginatedResponse<Product>>('/products', {
      featured: 'true',
      limit: '8',
      published: 'true',
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

async function getProducts(): Promise<Product[]> {
  try {
    const res = await api.get<PaginatedResponse<Product>>('/products', {
      limit: '8',
      published: 'true',
    });
    return res.data ?? [];
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [featured, products] = await Promise.all([
    getFeaturedProducts(),
    getProducts(),
  ]);

  const newArrivals = products;

  return (
    <>
      <Hero />
      <FeaturedCategories />
      <NewArrivals products={newArrivals} />
      <BrandStory />
      <FeaturedCollection products={featured} />
      <LifestyleSection />
      <Benefits />
      <Reviews />
      <Newsletter />
    </>
  );
}
