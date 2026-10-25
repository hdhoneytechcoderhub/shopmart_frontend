import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, RotateCcw, Award } from 'lucide-react';
import { catalogService } from '../services/catalogService';
import { useFetch } from '../hooks/useFetch';
import { useProductsVersion } from '../hooks/useProductsVersion';
import ProductGrid from '../components/product/ProductGrid';
import BestSellers from '../components/product/BestSellers';
import RecentlyViewed from '../components/product/RecentlyViewed';

function Hero({ banners }) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!banners?.length) return;
    const t = setInterval(() => setActive((a) => (a + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners]);

  if (!banners?.length) return null;
  const b = banners[active];

  return (
    <section className="container-page pt-6">
      <div className="relative overflow-hidden rounded-2xl bg-ink">
        <img src={b.image} alt="" className="h-[clamp(260px,40vw,440px)] w-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-xl px-6 sm:px-10">
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent-400">ShopMart</p>
            <h1 className="font-display text-3xl font-bold text-white sm:text-5xl">{b.title}</h1>
            <p className="mt-3 text-base text-slate-200 sm:text-lg">{b.subtitle}</p>
            <Link to={b.href} className="btn-accent mt-6">
              {b.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-10">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-white' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUE_PROPS = [
  { icon: Award, title: '100% Original Products', text: 'Sourced directly from trusted brands' },
  { icon: ShieldCheck, title: 'Secure Payments', text: 'Multiple secure payment options available' },
  { icon: Truck, title: 'Fast & Free Delivery', text: 'Free delivery on orders above ₹499' },
  { icon: RotateCcw, title: 'Easy Returns', text: 'Hassle-free returns within 7 days' },
];

function Section({ title, subtitle, to, children }) {
  return (
    <section className="container-page mt-14">
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {to && (
          <Link to={to} className="link inline-flex items-center gap-1 text-sm font-semibold">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export default function Home() {
  const version = useProductsVersion();
  const { data: bannersRaw } = useFetch(() => catalogService.getBanners(), []);
  const { data: categoriesRaw } = useFetch(() => catalogService.getStorefrontCategories(), []);
  const { data: brandsRaw } = useFetch(() => catalogService.getBrands(), []);
  const { data: feeds, loading } = useFetch(() => catalogService.getHomeFeeds(), [version]);
  const banners = Array.isArray(bannersRaw) ? bannersRaw : [];
  const categories = Array.isArray(categoriesRaw) ? categoriesRaw : [];
  const brands = Array.isArray(brandsRaw) ? brandsRaw : [];

  return (
    <div className="pb-4">
      <Hero banners={banners} />

      {/* Value props */}
      <section className="container-page mt-6">
        <div className="grid grid-cols-2 divide-slate-200 rounded-2xl border border-slate-200 bg-white sm:grid-cols-4 sm:divide-x">
          {VALUE_PROPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-tight text-ink">{title}</p>
                <p className="text-xs text-ink-muted">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Best Sellers — ranked */}
      <BestSellers products={feeds?.bestSellers || []} />

      {/* Categories */}
      <Section title="Shop by category" subtitle="Find what you're looking for" to="/shop">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {(categories || []).map((c) => (
            <Link
              key={c.id}
              to={`/shop?category=${c.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-card"
            >
              <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                <img src={c.image} alt={c.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              </div>
              <p className="p-3 text-center text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="Featured products" subtitle="Hand-picked by our team" to="/shop?sort=popular">
        <ProductGrid products={feeds?.featured || []} loading={loading} />
      </Section>

      {/* Promo strip */}
      <section className="container-page mt-14">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-brand-600 p-8 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-200">Limited time</p>
              <h3 className="mt-1 text-2xl font-bold">Members save more</h3>
              <p className="mt-1 text-brand-100">Extra 10% off your first order</p>
              <Link to="/register" className="btn-accent mt-4">Join now</Link>
            </div>
          </div>
          <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-ink p-8 text-white">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">Clearance</p>
              <h3 className="mt-1 text-2xl font-bold">Up to 50% off</h3>
              <p className="mt-1 text-slate-300">On selected seasonal styles</p>
              <Link to="/shop?sort=price_asc" className="btn-outline mt-4 border-white/20 bg-white/10 text-white hover:bg-white/20">Shop sale</Link>
            </div>
          </div>
        </div>
      </section>

      <Section title="New arrivals" subtitle="Fresh in this week" to="/shop?sort=newest">
        <ProductGrid products={feeds?.newArrivals || []} loading={loading} />
      </Section>

      {brands.length > 0 && (
        <Section title="Shop by brand" subtitle="Explore products from your favorite brands">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {brands.slice(0, 10).map((b) => (
              <Link
                key={b.id}
                to={`/shop?brand=${b.slug}`}
                className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-card"
              >
                {b.logo ? (
                  <img src={b.logo} alt={b.name} className="h-8 max-w-[80%] object-contain" />
                ) : (
                  <span className="text-sm font-semibold text-ink">{b.name}</span>
                )}
              </Link>
            ))}
          </div>
        </Section>
      )}

      <div className="container-page">
        <RecentlyViewed />
      </div>
    </div>
  );
}
