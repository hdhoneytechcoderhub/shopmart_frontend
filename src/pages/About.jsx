import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, HeartHandshake, Sparkles, Target, Users } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';

const STATS = [
  { value: '2M+', label: 'Happy customers' },
  { value: '50k+', label: 'Products shipped monthly' },
  { value: '120+', label: 'Brand partners' },
  { value: '4.8/5', label: 'Average rating' },
];

const VALUES = [
  { icon: Sparkles, title: 'Curated quality', text: 'Every product is hand-picked and quality-checked before it reaches your cart.' },
  { icon: HeartHandshake, title: 'Customer first', text: 'Friendly support, easy returns, and a promise to make things right.' },
  { icon: ShieldCheck, title: 'Shop with trust', text: 'Secure payments, genuine products, and transparent pricing — always.' },
  { icon: Truck, title: 'Fast, reliable delivery', text: 'Dependable nationwide shipping with real-time tracking on every order.' },
];

export default function About() {
  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'About Us' }]} />

      {/* Hero */}
      <section className="mt-6 grid items-center gap-10 lg:grid-cols-2">
        <div>
          <span className="chip">Our story</span>
          <h1 className="mt-4 font-display text-3xl font-bold leading-tight text-ink sm:text-4xl">
            Shopping made simple, joyful, and dependable.
          </h1>
          <p className="mt-4 text-ink-muted">
            ShopMart started with a simple idea: bring great products, fair prices, and a delightful
            experience together in one place. What began as a small catalog has grown into a destination
            trusted by millions — but our obsession with quality and service hasn’t changed.
          </p>
          <p className="mt-3 text-ink-muted">
            From everyday essentials to standout pieces, we work directly with brands we believe in so
            you can shop with confidence, every single time.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/shop" className="btn-primary">Start shopping</Link>
            <Link to="/contact" className="btn-outline">Get in touch</Link>
          </div>
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-card">
          <img src="https://picsum.photos/seed/about-hero/900/700" alt="Our team" className="h-full w-full object-cover" />
        </div>
      </section>

      {/* Stats */}
      <section className="mt-12 grid grid-cols-2 gap-4 rounded-3xl bg-brand-600 p-8 text-white sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-3xl font-bold">{s.value}</p>
            <p className="mt-1 text-sm text-white/80">{s.label}</p>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="mt-12">
        <h2 className="text-center font-display text-2xl font-bold text-ink">What we stand for</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUES.map((v) => (
            <div key={v.title} className="card p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                <v.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 font-semibold text-ink">{v.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{v.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="card flex flex-col gap-3 p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-50 text-accent-600">
            <Target className="h-6 w-6" />
          </span>
          <h3 className="font-display text-xl font-bold text-ink">Our mission</h3>
          <p className="text-ink-muted">
            To make quality products accessible to everyone, paired with an experience so smooth you’ll
            never want to shop anywhere else.
          </p>
        </div>
        <div className="card flex flex-col gap-3 p-8">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Users className="h-6 w-6" />
          </span>
          <h3 className="font-display text-xl font-bold text-ink">Our people</h3>
          <p className="text-ink-muted">
            A passionate team of curators, technologists, and support specialists working behind the
            scenes to earn your trust with every order.
          </p>
        </div>
      </section>
    </div>
  );
}
