import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, X } from 'lucide-react';
import { catalogService } from '../../services/catalogService';
import { useDebounce } from '../../hooks/useDebounce';
import { formatPrice } from '../../utils/format';
import { getRecentSearches, addRecentSearch, clearRecentSearches } from '../../utils/recent';

const TRENDING = ['Headphones', 'Smart watch', 'Sneakers', 'Backpack'];

export default function SearchBox({ onNavigate }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ products: [], categories: [] });
  const [loading, setLoading] = useState(false);
  const [recents, setRecents] = useState(getRecentSearches());
  const boxRef = useRef(null);
  const debounced = useDebounce(q, 220);

  useEffect(() => {
    let active = true;
    if (!debounced.trim()) { setResults({ products: [], categories: [] }); return undefined; }
    setLoading(true);
    catalogService.suggest(debounced)
      .then((r) => { if (active) setResults(r); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [debounced]);

  useEffect(() => {
    const onDocClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const go = (term) => {
    const t = (term ?? q).trim();
    if (!t) return;
    setRecents(addRecentSearch(t));
    setOpen(false);
    setQ('');
    onNavigate?.();
    navigate(`/shop?q=${encodeURIComponent(t)}`);
  };

  const openProduct = (p) => {
    setRecents(addRecentSearch(p.name));
    setOpen(false);
    setQ('');
    onNavigate?.();
    navigate(`/product/${p.slug}`);
  };

  const hasQuery = q.trim().length > 0;
  const showPanel = open && (hasQuery || recents.length > 0);

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <form onSubmit={(e) => { e.preventDefault(); go(); }}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search for products, brands and more"
            className="field pl-10 pr-9"
            aria-label="Search products"
          />
          {hasQuery && (
            <button type="button" onClick={() => { setQ(''); setOpen(true); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink" aria-label="Clear">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop dark:border-slate-800 dark:bg-slate-900">
          {!hasQuery ? (
            <div className="p-3">
              {recents.length > 0 && (
                <div className="mb-3">
                  <div className="mb-1 flex items-center justify-between px-1">
                    <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Recent</span>
                    <button onClick={() => { clearRecentSearches(); setRecents([]); }} className="text-xs text-ink-muted hover:text-ink">Clear</button>
                  </div>
                  {recents.map((r) => (
                    <button key={r} onClick={() => go(r)} className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Clock className="h-4 w-4 text-slate-400" /> {r}
                    </button>
                  ))}
                </div>
              )}
              <div>
                <span className="mb-1 block px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">Trending</span>
                <div className="flex flex-wrap gap-2 px-1 pb-1">
                  {TRENDING.map((t) => (
                    <button key={t} onClick={() => go(t)} className="chip hover:border-brand-300"><TrendingUp className="h-3 w-3" /> {t}</button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              {loading && <p className="px-4 py-3 text-sm text-ink-muted">Searching…</p>}
              {!loading && results.products.length === 0 && results.categories.length === 0 && (
                <p className="px-4 py-3 text-sm text-ink-muted">No matches. Press Enter to search all products.</p>
              )}
              {results.categories.length > 0 && (
                <div className="border-b border-slate-100 p-2 dark:border-slate-800">
                  {results.categories.map((c) => (
                    <button key={c.id} onClick={() => { setOpen(false); setQ(''); onNavigate?.(); navigate(`/shop?category=${c.slug}`); }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                      <Search className="h-4 w-4 text-slate-400" /> in <span className="font-medium">{c.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.products.map((p) => (
                <button key={p.id} onClick={() => openProduct(p)} className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800">
                  <img src={p.images?.[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{p.name}</span>
                    <span className="block text-xs text-ink-muted">{p.brandName}</span>
                  </span>
                  <span className="text-sm font-semibold text-ink">{formatPrice(p.price)}</span>
                </button>
              ))}
              {hasQuery && (
                <button onClick={() => go()} className="block w-full border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand-700 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800">
                  See all results for “{q.trim()}”
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
