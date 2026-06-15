'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

const PRICE_RANGES = [
  { label: 'All Prices', value: '' },
  { label: 'Under $25', value: '0-25' },
  { label: '$25 — $50', value: '25-50' },
  { label: '$50 — $100', value: '50-100' },
  { label: '$100 — $200', value: '100-200' },
  { label: '$200+', value: '200-' },
];

interface ProductFiltersProps {
  categories: { slug: string; name: string }[];
}

export default function ProductFilters({ categories }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get('category') || '';
  const currentPrice = searchParams.get('priceRange') || '';
  const currentSearch = searchParams.get('search') || '';

  function updateParam(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    router.push(`/products?${sp.toString()}`);
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      updateParam('search', (e.target as HTMLInputElement).value);
    }
  }

  function handleClear() {
    router.push('/products');
  }

  const hasFilters = currentCategory || currentPrice || currentSearch;

  return (
    <aside className="space-y-8">
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lighter" strokeWidth={1.5} />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Search..."
            onKeyDown={handleSearch}
            className="w-full border border-cream-200 bg-transparent py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-lighter">
          Category
        </h4>
        <div className="space-y-2">
          <button
            onClick={() => updateParam('category', '')}
            className={`block w-full text-left text-sm transition-colors ${
              !currentCategory ? 'font-semibold text-ink' : 'text-ink-lighter hover:text-ink'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => updateParam('category', cat.slug)}
              className={`block w-full text-left text-sm transition-colors ${
                currentCategory === cat.slug ? 'font-semibold text-ink' : 'text-ink-lighter hover:text-ink'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-lighter">
          Price
        </h4>
        <div className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => updateParam('priceRange', range.value)}
              className={`block w-full text-left text-sm transition-colors ${
                currentPrice === range.value ? 'font-semibold text-ink' : 'text-ink-lighter hover:text-ink'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={handleClear}
          className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-accent-dark transition-colors"
        >
          Clear All
        </button>
      )}
    </aside>
  );
}
