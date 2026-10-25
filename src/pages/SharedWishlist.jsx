import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import ProductGrid from '../components/product/ProductGrid';
import Breadcrumbs from '../components/common/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';

export default function SharedWishlist() {
  const [params] = useSearchParams();
  const ids = (params.get('items') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (ids.length === 0) { setLoading(false); return undefined; }
    catalogService.getProducts({ size: 100 })
      .then((data) => {
        if (!active) return;
        const all = data?.content || [];
        const byId = new Map(all.map((p) => [String(p.id), p]));
        setProducts(ids.map((id) => byId.get(String(id))).filter(Boolean));
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Shared wishlist' }]} />

      <header className="mt-6 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-50 text-accent-600">
          <Heart className="h-6 w-6 fill-accent-500 text-accent-500" />
        </span>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">A shared wishlist</h1>
          <p className="text-sm text-ink-muted">Someone shared {ids.length} item{ids.length === 1 ? '' : 's'} with you.</p>
        </div>
      </header>

      <div className="mt-8">
        {!loading && products.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="Nothing to show"
            description="This shared wishlist is empty or the link is invalid."
            action={<Link to="/shop" className="btn-primary">Browse products</Link>}
          />
        ) : (
          <ProductGrid products={products} loading={loading} skeletonCount={ids.length || 4} />
        )}
      </div>
    </div>
  );
}
