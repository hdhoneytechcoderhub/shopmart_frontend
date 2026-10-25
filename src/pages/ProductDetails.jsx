import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Truck, RotateCcw, ShieldCheck, Check } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { useProductsVersion } from '../hooks/useProductsVersion';
import Rating from '../components/common/Rating';
import Reviews from '../components/product/Reviews';
import ImageGallery from '../components/product/ImageGallery';
import FrequentlyBoughtTogether from '../components/product/FrequentlyBoughtTogether';
import RecentlyViewed from '../components/product/RecentlyViewed';
import QuantityStepper from '../components/common/QuantityStepper';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Loader from '../components/common/Loader';
import ProductGrid from '../components/product/ProductGrid';
import { addRecentlyViewed } from '../utils/recent';
import { formatPrice, discountPercent } from '../utils/format';

export default function ProductDetails() {
  const { slug } = useParams();
  const { add } = useCart();
  const { isWishlisted, toggle } = useWishlist();
  const version = useProductsVersion();

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);

  const [size, setSize] = useState(null);
  const [color, setColor] = useState(null);
  const [qty, setQty] = useState(1);

  const wishlisted = isWishlisted(product?.id);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const p = await catalogService.getProductBySlug(slug);
      if (!alive) return;
      setProduct(p);
      addRecentlyViewed(p);
      setSize(p.variants?.sizes?.[0] || null);
      setColor(p.variants?.colors?.[0] || null);
      setQty(1);
      const [rel] = await Promise.all([catalogService.getRelated(p)]);
      if (!alive) return;
      setRelated(rel || []);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [slug, version]);

  if (loading || !product) return <Loader label="Loading product…" />;

  const off = discountPercent(product.mrp, product.price);
  const outOfStock = product.stock === 0;

  const handleAdd = () =>
    add({
      productId: product.id, slug: product.slug, name: product.name,
      price: product.price, image: product.images?.[0], size, color, quantity: qty,
    });

  return (
    <div className="container-page py-6">
      <Breadcrumbs
        items={[
          { label: 'Home', to: '/' },
          { label: product.categoryName, to: `/shop?category=${product.categoryName?.toLowerCase().replace(/\s+/g, '-')}` },
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <ImageGallery images={product.images} name={product.name} />

        {/* Info */}
        <div>
          <Link to={`/shop?brand=${product.brandName?.toLowerCase()}`} className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            {product.brandName}
          </Link>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.name}</h1>
          <div className="mt-2"><Rating value={product.rating} count={product.reviewCount} /></div>

          <div className="mt-4 flex items-end gap-3">
            <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
            {off > 0 && (
              <>
                <span className="text-lg text-ink-muted line-through">{formatPrice(product.mrp)}</span>
                <span className="badge bg-accent-100 text-accent-700">{off}% off</span>
              </>
            )}
          </div>
          <p className="mt-1 text-sm text-emerald-600">{outOfStock ? '' : 'Inclusive of all taxes'}</p>

          <p className="mt-5 text-sm leading-relaxed text-ink-soft">{product.description}</p>

          {/* Variants */}
          {product.variants?.sizes?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[3rem] rounded-xl border px-3 py-2 text-sm font-medium transition ${size === s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-slate-400'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {product.variants?.colors?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${color === c ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 hover:border-slate-400'}`}
                  >
                    {color === c && <Check className="h-3.5 w-3.5" />} {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={Math.max(1, product.stock)} />
            <button onClick={handleAdd} disabled={outOfStock} className="btn-primary flex-1">
              <ShoppingCart className="h-4.5 w-4.5" /> {outOfStock ? 'Out of stock' : 'Add to cart'}
            </button>
            <button
              onClick={() => toggle(product)}
              className="btn-outline h-11 w-11 p-0"
              aria-label="Wishlist"
            >
              <Heart className={`h-5 w-5 ${wishlisted ? 'fill-accent-500 text-accent-500' : ''}`} />
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-slate-100 pt-6 text-center">
            {[[Truck, 'Free shipping'], [RotateCcw, '30-day returns'], [ShieldCheck, '1-year warranty']].map(([Icon, label]) => (
              <div key={label} className="flex flex-col items-center gap-1.5 text-xs text-ink-soft">
                <Icon className="h-5 w-5 text-brand-600" /> {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Frequently bought together */}
      <FrequentlyBoughtTogether product={product} related={related} />

      {/* Reviews */}
      <Reviews productId={product.id} baseRating={product.rating} baseCount={product.reviewCount} />

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-5 text-xl font-bold">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* Recently viewed */}
      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
