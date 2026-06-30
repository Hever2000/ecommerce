'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'newest' },
  { label: 'Precio: menor a mayor', value: 'price_asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc' },
  { label: 'Nombre: A-Z', value: 'name_asc' },
  { label: 'Nombre: Z-A', value: 'name_desc' },
];

export default function ProductFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get('search') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  function updateParam(key: string, value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (value) sp.set(key, value);
    else sp.delete(key);
    sp.delete('page');
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleSearch(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      updateParam('search', (e.target as HTMLInputElement).value);
    }
  }

  function handleClear() {
    router.push(pathname);
  }

  const hasFilters = currentSearch || currentSort !== 'newest';

  return (
    <aside className="space-y-8">
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-lighter" strokeWidth={1.5} />
          <input
            type="text"
            defaultValue={currentSearch}
            placeholder="Buscar..."
            onKeyDown={handleSearch}
            className="w-full border border-cream-200 bg-transparent py-3 pl-10 pr-4 text-sm text-ink placeholder:text-ink-lighter focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-lighter">
          Ordenar por
        </h4>
        <select
          value={currentSort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="w-full border border-cream-200 bg-transparent px-3 py-3 text-sm text-ink focus:border-ink focus:outline-none"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          onClick={handleClear}
          className="text-xs font-semibold uppercase tracking-wider text-accent hover:text-accent-dark transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </aside>
  );
}
