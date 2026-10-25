import { useMemo, useState } from 'react';
import { Plus, Check, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/format';

export default function FrequentlyBoughtTogether({ product, related = [] }) {
  const { add } = useCart();
  const bundle = useMemo(() => [product, ...related.slice(0, 2)].filter(Boolean), [product, related]);
  const [selected, setSelected] = useState(() => bundle.map((b) => b.id));

  if (bundle.length < 2) return null;

  const toggle = (id) => {
    if (id === product.id) return; // main item always included
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const chosen = bundle.filter((b) => selected.includes(b.id));
  const total = chosen.reduce((sum, b) => sum + b.price, 0);

  const addAll = () => {
    chosen.forEach((b) => add({
      productId: b.id, slug: b.slug, name: b.name, price: b.price, image: b.images?.[0],
      size: b.variants?.sizes?.[0], color: b.variants?.colors?.[0], quantity: 1,
    }));
    toast.success(`${chosen.length} item${chosen.length > 1 ? 's' : ''} added to cart`);
  };

  return (
    <section className="mt-12 card p-6">
      <h2 className="text-xl font-bold text-ink">Frequently bought together</h2>
      <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-center">
        {/* Visual bundle */}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {bundle.map((b, i) => (
            <div key={b.id} className="flex items-center gap-2">
              <label className="relative cursor-pointer">
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} disabled={b.id === product.id} className="peer sr-only" />
                <span className="block overflow-hidden rounded-xl border-2 border-slate-200 peer-checked:border-brand-500">
                  <img src={b.images?.[0]} alt={b.name} className="h-24 w-24 object-cover" />
                </span>
                <span className={`absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full text-white ${selected.includes(b.id) ? 'bg-brand-600' : 'bg-slate-300'}`}>
                  <Check className="h-3 w-3" />
                </span>
              </label>
              {i < bundle.length - 1 && <Plus className="h-5 w-5 shrink-0 text-slate-400" />}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:w-64">
          <ul className="space-y-1.5 text-sm">
            {bundle.map((b) => (
              <li key={b.id} className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(b.id)} onChange={() => toggle(b.id)} disabled={b.id === product.id} className="accent-brand-600" />
                <span className="min-w-0 flex-1 truncate text-ink-soft">{b.id === product.id ? 'This item: ' : ''}{b.name}</span>
                <span className="font-medium text-ink">{formatPrice(b.price)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-sm text-ink-muted">Total ({chosen.length})</span>
            <span className="text-lg font-bold text-ink">{formatPrice(total)}</span>
          </div>
          <button onClick={addAll} disabled={chosen.length === 0} className="btn-primary mt-3 w-full">
            <ShoppingCart className="h-4 w-4" /> Add {chosen.length} to cart
          </button>
        </div>
      </div>
    </section>
  );
}
