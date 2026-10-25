import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export default function Logo({ className = '', light = false }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <span className={`font-display text-xl font-800 font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
        Shop<span className="text-accent-500">Mart</span>
      </span>
    </Link>
  );
}
