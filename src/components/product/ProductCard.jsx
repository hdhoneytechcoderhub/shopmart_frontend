import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Scale } from 'lucide-react';
import Rating from '../common/Rating';
import { formatPrice, discountPercent } from '../../utils/format';
import { useCart } from '../../hooks/useCart';
import { useWishlist } from '../../hooks/useWishlist';
import { useCompare } from '../../hooks/useCompare';

export default function ProductCard({ product }) {
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const { isComparing, toggle: toggleCompare } = useCompare();
  const wishlisted = isWishlisted(product.id);
  const comparing = isComparing(product.id);
  const off = discountPercent(product.mrp, product.price);
  const outOfStock = product.stock === 0;

  return (
    <div className="group card overflow-hidden transition hover:shadow-pop">
      <div className="relative">
        <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden bg-slate-100">
          <img
            src={product.images?.[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {off > 0 && <span className="badge bg-accent-500 text-white">{off}% OFF</span>}
          {product.newArrival && <span className="badge bg-brand-600 text-white">New</span>}
        </div>
        <div className="absolute right-3 top-3 flex flex-col gap-1.5">
          <button
            onClick={() => toggle(product)}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink-soft shadow-sm backdrop-blur transition hover:text-accent-600"
          >
            <Heart className={`h-4.5 w-4.5 ${wishlisted ? 'fill-accent-500 text-accent-500' : ''}`} />
          </button>
          <button
            onClick={() => toggleCompare(product)}
            aria-label={comparing ? 'Remove from compare' : 'Add to compare'}
            className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:text-brand-600 ${comparing ? 'text-brand-600' : 'text-ink-soft'}`}
          >
            <Scale className="h-4.5 w-4.5" />
          </button>
        </div>
        {outOfStock && (
          <div className="absolute inset-0 grid place-items-center bg-white/60">
            <span className="badge bg-ink text-white">Out of stock</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{product.brandName}</span>
        <Link to={`/product/${product.slug}`} className="line-clamp-2 text-sm font-semibold text-ink hover:text-brand-700">
          {product.name}
        </Link>
        <Rating value={product.rating} count={product.reviewCount} />
        <div className="mt-1 flex items-center gap-2">
          <span className="text-base font-bold text-ink">{formatPrice(product.price)}</span>
          {off > 0 && <span className="text-sm text-ink-muted line-through">{formatPrice(product.mrp)}</span>}
        </div>
        <button
          className="btn-primary mt-2 w-full"
          disabled={outOfStock}
          onClick={() =>
            add({
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              image: product.images?.[0],
              size: product.variants?.sizes?.[0],
              color: product.variants?.colors?.[0],
              quantity: 1,
            })
          }
        >
          <ShoppingCart className="h-4 w-4" />
          {outOfStock ? 'Sold out' : 'Add to cart'}
        </button>
      </div>
    </div>
  );
}
