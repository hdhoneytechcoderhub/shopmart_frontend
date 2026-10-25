import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-[7rem] font-bold leading-none text-brand-600">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Page not found</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        The page you’re looking for doesn’t exist or may have been moved. Let’s get you back on track.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Link to="/" className="btn-primary">
          <Home className="h-4 w-4" /> Back home
        </Link>
        <Link to="/shop" className="btn-outline">
          <Search className="h-4 w-4" /> Browse shop
        </Link>
      </div>
    </div>
  );
}
