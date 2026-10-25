import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useFetch } from '../hooks/useFetch';
import { useProductsVersion } from '../hooks/useProductsVersion';
import ProductGrid from '../components/product/ProductGrid';
import Pagination from '../components/common/Pagination';
import Breadcrumbs from '../components/common/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import { SORT_OPTIONS } from '../utils/constants';
import { formatPrice } from '../utils/format';

const PAGE_SIZE = 12;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const version = useProductsVersion();

  const { data: categories } = useFetch(() => catalogService.getStorefrontCategories(), []);
  const { data: brands } = useFetch(() => catalogService.getBrands(), []);

  // Derive query object from URL search params.
  const query = useMemo(
    () => ({
      q: params.get('q') || '',
      category: params.get('category') || '',
      brand: params.get('brand') || '',
      deal: params.get('deal') === 'true',
      minPrice: params.get('minPrice') || '',
      maxPrice: params.get('maxPrice') || '',
      rating: params.get('rating') || '',
      sort: params.get('sort') || 'newest',
      page: Number(params.get('page') || 0),
    }),
    [params]
  );

  const { data, loading } = useFetch(
    () => catalogService.getProducts({ ...query, size: PAGE_SIZE }),
    [params.toString(), version]
  );

  const products = data?.content || [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements ?? products.length;

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === '' || value == null) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const clearAll = () => setParams(new URLSearchParams());
  const activeFilters = ['category', 'brand', 'minPrice', 'maxPrice', 'rating'].filter((k) => query[k]);

  useEffect(() => { setFiltersOpen(false); }, [params]);

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <h4 className="mb-3 text-sm font-semibold">Category</h4>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="cat" checked={!query.category} onChange={() => setParam('category', '')} className="accent-brand-600" />
            All categories
          </label>
          {(categories || []).map((c) => (
            <label key={c.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="cat" checked={query.category === c.slug} onChange={() => setParam('category', c.slug)} className="accent-brand-600" />
              {c.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Brand</h4>
        <div className="space-y-1.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="radio" name="brand" checked={!query.brand} onChange={() => setParam('brand', '')} className="accent-brand-600" />
            All brands
          </label>
          {(brands || []).map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="brand" checked={query.brand === b.slug} onChange={() => setParam('brand', b.slug)} className="accent-brand-600" />
              {b.name}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Price range</h4>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" defaultValue={query.minPrice} onBlur={(e) => setParam('minPrice', e.target.value)} className="field" />
          <span className="text-ink-muted">–</span>
          <input type="number" placeholder="Max" defaultValue={query.maxPrice} onBlur={(e) => setParam('maxPrice', e.target.value)} className="field" />
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold">Rating</h4>
        <div className="space-y-1.5">
          {[4, 3, 2].map((r) => (
            <label key={r} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="radio" name="rating" checked={query.rating === String(r)} onChange={() => setParam('rating', String(r))} className="accent-brand-600" />
              {r}★ &amp; up
            </label>
          ))}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <button onClick={clearAll} className="btn-outline w-full">Clear all filters</button>
      )}
    </div>
  );

  return (
    <div className="container-page py-6">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shop' }]} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{query.q ? `Results for “${query.q}”` : 'All products'}</h1>
          <p className="text-sm text-ink-muted">{totalElements} products</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="btn-outline lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeFilters.length > 0 && <span className="badge bg-brand-600 text-white">{activeFilters.length}</span>}
          </button>
          <select value={query.sort} onChange={(e) => setParam('sort', e.target.value)} className="field w-auto" aria-label="Sort by">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="card sticky top-24 p-5">{FilterPanel}</div>
        </aside>

        <div>
          {!loading && products.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={<button onClick={clearAll} className="btn-primary">Reset filters</button>}
            />
          ) : (
            <>
              <ProductGrid products={products} loading={loading} skeletonCount={PAGE_SIZE} />
              <Pagination page={query.page} totalPages={totalPages} onChange={(p) => setParam('page', p)} />
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setFiltersOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] animate-slide-in overflow-y-auto bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setFiltersOpen(false)} className="btn-ghost h-8 w-8 p-0"><X className="h-5 w-5" /></button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}
