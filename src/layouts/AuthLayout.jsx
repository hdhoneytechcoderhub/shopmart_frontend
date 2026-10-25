import { Outlet, Link, useLocation } from 'react-router-dom';
import Logo from '../components/common/Logo';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default function AuthLayout() {
  const location = useLocation();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-600/60 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-accent-500/30 blur-3xl" />
        <Logo light />
        <div className="relative z-10 max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Shopping, simplified.
          </h2>
          <p className="mt-4 text-brand-100">
            Sign in to track orders, save your favourites, and check out faster. Your cart follows you everywhere.
          </p>
        </div>
        <p className="relative z-10 text-sm text-brand-200">Trusted by thousands of shoppers across India.</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col">
        <div className="flex items-center justify-between p-6 lg:hidden">
          <Logo />
          <Link to="/" className="text-sm text-ink-muted hover:text-brand-700">Back to store</Link>
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md">
            <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
