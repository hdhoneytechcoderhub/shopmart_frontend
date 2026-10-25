import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, Tags, Award, ShoppingBag, Users,
  Ticket, FileText, BarChart3, Settings, LogOut, Menu, X, Store, Clock, Crown, RotateCcw, Cpu, Wrench, ClipboardList,
  Bell, Radio, LineChart,
} from 'lucide-react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Logo from '../components/common/Logo';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../utils/format';

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/brands', label: 'Brands', icon: Award },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/returns', label: 'Returns', icon: RotateCcw },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/attendance', label: 'Attendance', icon: Clock },
  { to: '/admin/machines', label: 'Machines', icon: Cpu },
  { to: '/admin/services', label: 'Services', icon: Wrench },
  { to: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { to: '/admin/blogs', label: 'Blogs', icon: FileText },
  { to: '/admin/notification-templates', label: 'Notification Templates', icon: Bell },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Radio },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/admin/analytics/advanced', label: 'Advanced Analytics', icon: LineChart },
  { to: '/admin/inventory-report', label: 'Inventory Report', icon: ClipboardList },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const location = useLocation();
  const { user, logout, isSuperAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <div className="flex h-full flex-col bg-ink text-slate-300">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white"><Store className="h-5 w-5" /></span>
        <span className="font-display text-lg font-bold text-white">ShopMart <span className="text-accent-400">Admin</span></span>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {LINKS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="h-4.5 w-4.5" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        {isSuperAdmin && (
          <Link to="/superadmin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-accent-300 hover:bg-white/5 hover:text-accent-200">
            <Crown className="h-4.5 w-4.5" /> Super Admin
          </Link>
        )}
        <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hover:text-white">
          <Store className="h-4.5 w-4.5" /> View store
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-white/5">
          <LogOut className="h-4.5 w-4.5" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white">
        Skip to content
      </a>
      <aside className="hidden w-64 shrink-0 lg:block">{Sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 animate-slide-in">{Sidebar}</div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-5">
          <button className="btn-ghost h-10 w-10 p-0 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display font-semibold lg:hidden">Admin</span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{user?.email}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(user?.name || 'Admin')}
            </span>
          </div>
        </header>
        <main id="main-content" className="flex-1 overflow-x-hidden p-5 lg:p-8">
          <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
