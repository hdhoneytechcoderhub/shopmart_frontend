import { Link } from 'react-router-dom';
import { X, ShoppingCart, Scale } from 'lucide-react';
import { useCompare } from '../hooks/useCompare';
import { useCart } from '../hooks/useCart';
import Rating from '../components/common/Rating';
import EmptyState from '../components/common/EmptyState';
import { formatPrice } from '../utils/format';

const ROWS = [
  { label: 'Price', render: (p) => <span className="font-semibold text-ink">{formatPrice(p.price)}</span> },
  { label: 'MRP', render: (p) => (p.mrp && p.mrp > p.price ? <span className="text-ink-muted line-through">{formatPrice(p.mrp)}</span> : '—') },
  { label: 'Rating', render: (p) => <Rating value={p.rating} count={p.reviewCount} /> },
  { label: 'Category', render: (p) => p.categoryName || '—' },
  { label: 'Brand', render: (p) => p.brandName || '—' },
  { label: 'Stock', render: (p) => (p.stock === 0 ? <span className="text-red-600">Out of stock</span> : `${p.stock} available`) },
  { label: 'Description', render: (p) => <p className="line-clamp-4 text-sm text-ink-muted">{p.description}</p> },
];

export default function Compare() {
  const { items, remove, clear } = useCompare();
  const { add } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <EmptyState icon={Scale} title="Nothing to compare yet" description="Add products to compare from the shop using the compare icon on any product card." action={<Link to="/shop" className="btn-primary">Browse products</Link>} />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compare products</h1>
        <button onClick={clear} className="btn-ghost text-sm text-red-600">Clear all</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-0">
          <thead>
            <tr>
              <th className="w-32"></th>
              {items.map((p) => (
                <th key={p.id} className="px-3 pb-4 text-left align-top">
                  <div className="relative w-44 rounded-xl border border-slate-200 bg-white p-3">
                    <button onClick={() => remove(p.id)} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-slate-400 shadow ring-1 ring-slate-200 hover:text-red-600" aria-label="Remove">
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <Link to={`/product/${p.slug}`}>
                      <img src={p.images?.[0]} alt={p.name} className="aspect-square w-full rounded-lg object-cover" />
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink">{p.name}</p>
                    </Link>
                    <button onClick={() => add({ ...p, quantity: 1 })} className="btn-primary mt-3 h-8 w-full text-xs">
                      <ShoppingCart className="h-3.5 w-3.5" /> Add to cart
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} className="border-t border-slate-100">
                <td className="px-3 py-3 text-sm font-medium text-ink-muted">{row.label}</td>
                {items.map((p) => (
                  <td key={p.id} className="px-3 py-3 align-top">{row.render(p)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
