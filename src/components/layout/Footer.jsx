import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import Logo from '../common/Logo';

const COLUMNS = [
  { title: 'Shop', links: [['All products', '/shop'], ['Electronics', '/shop?category=electronics'], ['Fashion', '/shop?category=fashion'], ['New arrivals', '/shop?sort=newest']] },
  { title: 'Company', links: [['About us', '/about'], ['Blog', '/blog'], ['Contact', '/contact'], ['FAQ', '/faq']] },
  { title: 'Support', links: [['Track order', '/track'], ['Returns', '/faq'], ['Privacy policy', '/privacy'], ['Terms & conditions', '/terms']] },
];

export default function Footer() {
  const [email, setEmail] = useState('');
  const subscribe = (e) => {
    e.preventDefault();
    if (!email) return;
    toast.success('Subscribed. Watch your inbox for deals.');
    setEmail('');
  };

  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="container-page py-12">
        <div className="grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-ink-muted">
              Everything you need, delivered. Quality products, fair prices, and easy returns — all in one place.
            </p>
            <form onSubmit={subscribe} className="mt-5 flex max-w-sm gap-2">
              <div className="relative flex-1">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email address" className="field pl-9" />
              </div>
              <button className="btn-primary whitespace-nowrap">Subscribe</button>
            </form>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-ink">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-sm text-ink-muted hover:text-brand-700">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row">
          <p className="text-sm text-ink-muted">© {new Date().getFullYear()} ShopMart. All rights reserved.</p>
          <div className="flex gap-1">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="btn-ghost h-9 w-9 p-0 text-ink-muted" aria-label="Social link">
                <Icon className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
