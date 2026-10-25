import { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, ClipboardCheck, ScrollText, BarChart3, Settings,
  LogOut, Menu, Store, Crown, CalendarClock, Building2, Server, CreditCard, HeartPulse,
} from 'lucide-react';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../utils/format';

const LINKS = [
  { to: '/superadmin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/superadmin/admins', label: 'Admin Management', icon: ShieldCheck },
  { to: '/superadmin/approvals', label: 'Product Approvals', icon: ClipboardCheck },
  { to: '/superadmin/companies', label: 'Companies', icon: Building2 },
  { to: '/superadmin/tenants', label: 'Tenants', icon: Server },
  { to: '/superadmin/subscriptions', label: 'Subscriptions', icon: CreditCard },
  { to: '/superadmin/health', label: 'System Health', icon: HeartPulse },
  { to: '/superadmin/activity', label: 'Activity Logs', icon: ScrollText },
  { to: '/superadmin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/superadmin/attendance', label: 'Attendance Reports', icon: CalendarClock },
  { to: '/superadmin/settings', label: 'Platform Settings', icon: Settings },
];

export default function SuperAdminLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const Sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center gap-2 px-5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 text-white"><Crown className="h-5 w-5" /></span>
        <span className="font-display text-lg font-bold text-white">Super <span className="text-accent-400">Admin</span></span>
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
        <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5 hover:text-white">
          <Store className="h-4.5 w-4.5" /> Admin panel
        </Link>
        <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-400 hover:bg-white/5">
          <LogOut className="h-4.5 w-4.5" /> Log out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 lg:block">{Sidebar}</aside>

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
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-600">
            <Crown className="h-3.5 w-3.5" /> Super Admin
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-ink-muted sm:inline">{user?.email}</span>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
              {initials(user?.name || 'SA')}
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-5 lg:p-8">
          <ErrorBoundary key={location.pathname}><Outlet /></ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
