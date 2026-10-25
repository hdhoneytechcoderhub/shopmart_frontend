import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { User, Package, Heart, MapPin, CreditCard, Settings, LogOut, ChevronRight, Bell, Award, RotateCcw, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CartDrawer from '../components/cart/CartDrawer';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../utils/format';
import ErrorBoundary from '../components/common/ErrorBoundary';

const LINKS = [
  { to: '/dashboard', label: 'Overview', icon: ChevronRight, end: true },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
  { to: '/dashboard/orders', label: 'Orders', icon: Package },
  { to: '/dashboard/returns', label: 'Returns', icon: RotateCcw },
  { to: '/dashboard/loyalty', label: 'Loyalty', icon: Award },
  { to: '/dashboard/notifications', label: 'Notifications', icon: Bell },
  { to: '/dashboard/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/dashboard/addresses', label: 'Addresses', icon: MapPin },
  { to: '/dashboard/payments', label: 'Payments', icon: CreditCard },
  { to: '/dashboard/security', label: 'Security', icon: ShieldCheck },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="container-page flex-1 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700">
                  {initials(user?.name)}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{user?.name || 'Guest'}</p>
                  <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                </div>
              </div>
            </div>
            <nav className="mt-3 card overflow-hidden p-1.5">
              {LINKS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="h-4.5 w-4.5" /> {label}
                </NavLink>
              ))}
              <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="h-4.5 w-4.5" /> Log out
              </button>
            </nav>
          </aside>

          <section className="min-w-0">
            <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
          </section>
        </div>
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
}
