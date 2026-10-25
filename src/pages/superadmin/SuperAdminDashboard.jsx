import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, ClipboardCheck, ShoppingBag, IndianRupee, Users, ArrowRight, ScrollText, Building2, Server, CreditCard, HeartPulse } from 'lucide-react';
import { AdminPageHeader, StatCard } from '../../components/admin/AdminUI';
import { ChartCard, SalesChart, OrdersChart, RevenueChart, TopProductsChart, StatusPie } from '../../components/admin/Charts';
import { catalogService } from '../../services/catalogService';
import { analyticsService } from '../../services/analyticsService';
import { superAdminService, companyService, tenantService, subscriptionService, systemHealthService } from '../../services/superAdminService';
import { useProductsVersion } from '../../hooks/useProductsVersion';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice, timeAgo } from '../../utils/format';

export default function SuperAdminDashboard() {
  const version = useProductsVersion();
  const [pendingAll, setPendingAll] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const { data: stats } = useFetch(() => analyticsService.getSuperStats(), []);
  const { data: analytics } = useFetch(() => analyticsService.getAnalytics(), []);
  const { data: companies } = useFetch(() => companyService.list(), []);
  const { data: tenants } = useFetch(() => tenantService.list(), []);
  const { data: subs } = useFetch(() => subscriptionService.list(), []);
  const { data: health } = useFetch(() => systemHealthService.check(), []);
  const series = analytics?.salesSeries || [];
  const mrrTotal = (subs || []).filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + Number(s.mrr || 0), 0);

  useEffect(() => {
    let active = true;
    catalogService.getApprovals()
      .then((list) => {
        if (!active) return;
        setPendingAll((Array.isArray(list) ? list : []).filter((p) => p.status === 'PENDING'));
      })
      .catch(() => {});
    superAdminService.getActivityLogs()
      .then((list) => { if (active) setActivityLogs(list); })
      .catch(() => {});
    return () => { active = false; };
  }, [version]);

  const pending = pendingAll.slice(0, 4);

  return (
    <div>
      <AdminPageHeader title="Super Admin Dashboard" subtitle="Platform-wide overview and controls." />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard icon={ShieldCheck} label="Total Admins" value={stats?.totalAdmins ?? '—'} tone="brand" />
        <StatCard icon={ClipboardCheck} label="Pending Approvals" value={pendingAll.length} tone="amber" delta={pendingAll.length ? 'action needed' : 'all clear'} />
        <StatCard icon={ShoppingBag} label="Total Orders" value={(stats?.totalOrders ?? 0).toLocaleString('en-IN')} tone="purple" />
        <StatCard icon={IndianRupee} label="Revenue" value={formatPrice(stats?.revenue ?? 0)} tone="emerald" />
        <StatCard icon={Users} label="Active Users" value={stats?.activeUsers ?? '—'} tone="brand" />
      </div>

      {/* SaaS control plane overview */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link to="/superadmin/companies" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Building2 className="h-5 w-5" /></span>
          <div><p className="text-lg font-bold text-ink">{companies?.length ?? '—'}</p><p className="text-xs text-ink-muted">Companies</p></div>
        </Link>
        <Link to="/superadmin/subscriptions" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><CreditCard className="h-5 w-5" /></span>
          <div><p className="text-lg font-bold text-ink">{formatPrice(mrrTotal)}</p><p className="text-xs text-ink-muted">MRR</p></div>
        </Link>
        <Link to="/superadmin/tenants" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-50 text-purple-600"><Server className="h-5 w-5" /></span>
          <div><p className="text-lg font-bold text-ink">{tenants?.length ?? '—'}</p><p className="text-xs text-ink-muted">Tenants</p></div>
        </Link>
        <Link to="/superadmin/health" className="card flex items-center gap-3 p-4 hover:border-brand-300">
          <span className={`grid h-10 w-10 place-items-center rounded-xl ${health?.apiUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}><HeartPulse className="h-5 w-5" /></span>
          <div><p className="text-lg font-bold text-ink">{health ? (health.apiUp ? 'Up' : 'Down') : '—'}</p><p className="text-xs text-ink-muted">System health</p></div>
        </Link>
      </div>

      {/* Analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sales" subtitle="Last 30 days (₹ thousands)"><SalesChart data={series} /></ChartCard>
        <ChartCard title="Orders" subtitle="Orders per day"><OrdersChart data={series} /></ChartCard>
        <ChartCard title="Revenue" subtitle="Last 30 days (₹ thousands)"><RevenueChart data={series} /></ChartCard>
        <ChartCard title="Orders by status" subtitle="Current distribution"><StatusPie data={analytics?.ordersByStatus || []} /></ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <ChartCard title="Top products" subtitle="Best sellers by units" height={300}><TopProductsChart data={analytics?.topProducts || []} /></ChartCard>

        <div className="space-y-6">
          {/* Pending approvals */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-ink">Pending approvals</h3>
              <Link to="/superadmin/approvals" className="link inline-flex items-center gap-1 text-sm">Review <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {pending.length === 0 ? <p className="text-sm text-ink-muted">Nothing pending.</p> : (
              <ul className="space-y-3">
                {pending.map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <img src={a.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{a.name}</p>
                      <p className="text-xs text-ink-muted">by {a.submittedBy} · {timeAgo(a.submittedAt)}</p>
                    </div>
                    <span className="badge bg-amber-100 text-amber-700">Pending</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent activity */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="inline-flex items-center gap-2 font-semibold text-ink"><ScrollText className="h-4 w-4 text-brand-600" /> Recent activity</h3>
              <Link to="/superadmin/activity" className="link inline-flex items-center gap-1 text-sm">All <ArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-ink-muted">No recent activity.</p>
            ) : (
              <ul className="space-y-2.5">
                {activityLogs.slice(0, 5).map((l) => (
                  <li key={l.id} className="text-sm">
                    <span className="font-medium text-ink">{l.actor}</span>{' '}
                    <span className="text-ink-muted">{l.type.replace(/_/g, ' ').toLowerCase()}</span>{' '}
                    <span className="text-ink-soft">— {l.target}</span>
                    <span className="block text-xs text-slate-400">{timeAgo(l.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
