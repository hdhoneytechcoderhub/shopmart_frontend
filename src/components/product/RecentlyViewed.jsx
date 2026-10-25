import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import ProductCard from './ProductCard';
import { getRecentlyViewed } from '../../utils/recent';

export default function RecentlyViewed({ excludeId, title = 'Recently viewed', max = 6 }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    setItems(getRecentlyViewed().filter((p) => p.id !== excludeId).slice(0, max));
  }, [excludeId, max]);

  if (items.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-5 inline-flex items-center gap-2 text-xl font-bold text-ink">
        <History className="h-5 w-5 text-brand-600" /> {title}
      </h2>
      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {items.map((p) => (
          <div key={p.id} className="w-44 shrink-0 snap-start sm:w-52">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
