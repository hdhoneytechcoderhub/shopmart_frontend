import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Star, Flame } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { formatPrice, discountPercent } from '../../utils/format';

function RankBadge({ rank }) {
  if (rank === 1) {
    return (
      <span className="absolute left-0 top-3 z-10 inline-flex items-center rounded-r-md bg-accent-500 py-1 pl-2 pr-3 text-[11px] font-bold uppercase tracking-wide text-white shadow-sm">
        Bestseller
      </span>
    );
  }
  return (
    <span className="absolute left-3 top-3 z-10 grid h-7 w-7 place-items-center rounded-md bg-slate-700/90 text-xs font-bold text-white">
      {rank}
    </span>
  );
}

function BestSellerCard({ product, rank }) {
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const wishlisted = isWishlisted(product.id);
  const off = discountPercent(product.mrp, product.price);
  const outOfStock = product.stock === 0;

  return (
    <div className="group flex flex-col rounded-2xl border border-slate-200 bg-white transition hover:shadow-pop">
      <div className="relative">
        <RankBadge rank={rank} />
        <button
          onClick={() => toggle(product)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur transition hover:text-accent-600"
        >
          <Heart className={`h-4 w-4 ${wishlisted ? 'fill-accent-500 text-accent-500' : ''}`} />
        </button>
        <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden rounded-t-2xl bg-slate-50 p-4">
          <img src={product.images?.[0]} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-500 group-hover:scale-105" />
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-2">
        <Link to={`/product/${product.slug}`} className="line-clamp-1 text-sm font-semibold text-ink hover:text-brand-700">
          {product.name}
        </Link>
        <div className="flex items-center gap-1 text-xs">
          <span className="inline-flex items-center gap-0.5 font-medium text-amber-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {Number(product.rating).toFixed(1)}
          </span>
          <span className="text-ink-muted">({product.reviewCount?.toLocaleString('en-IN')})</span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          <span className="text-base font-bold text-ink">{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-xs text-ink-muted line-through">{formatPrice(product.mrp)}</span>}
          {off > 0 && <span className="text-xs font-semibold text-emerald-600">{off}% OFF</span>}
        </div>
        <button
          className="btn-outline mt-2 w-full text-sm"
          disabled={outOfStock}
          onClick={() => add({
            productId: product.id, slug: product.slug, name: product.name, price: product.price,
            image: product.images?.[0], size: product.variants?.sizes?.[0], color: product.variants?.colors?.[0], quantity: 1,
          })}
        >
          <ShoppingCart className="h-4 w-4" /> {outOfStock ? 'Sold out' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

export default function BestSellers({ products = [] }) {
  if (!products.length) return null;
  return (
    <section className="container-page mt-14">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="inline-flex items-center gap-2 text-2xl font-bold text-ink">
            Best Sellers <Flame className="h-6 w-6 text-accent-500" />
          </h2>
          <p className="mt-1 text-sm text-ink-muted">Our most popular and top-rated products</p>
        </div>
        <Link to="/shop?sort=popular" className="link inline-flex shrink-0 items-center gap-1 text-sm font-semibold">
          View All Best Sellers →
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {products.slice(0, 6).map((p, i) => (
          <BestSellerCard key={p.id} product={p} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}
