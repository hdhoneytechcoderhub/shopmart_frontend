import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, UserCheck, IndianRupee, Repeat, Eye, PieChart } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice, formatDate, initials } from '../../utils/format';
import { AdminPageHeader, StatCard, AdminTable } from '../../components/admin/AdminUI';
import { ChartCard, StatusPie } from '../../components/admin/Charts';
import { SkeletonTableRows } from '../../components/common/Skeleton';

export default function AdminCustomers() {
  const [q, setQ] = useState('');
  const { data: customers, loading } = useFetch(() => analyticsService.getCustomers(), []);
  const { data: analytics } = useFetch(() => analyticsService.getCustomerAnalytics(), []);

  const list = customers || [];
  const filtered = list.filter(
    (c) => c.name.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <AdminPageHeader
        title="Customers"
        subtitle="Customer base, analytics, and search."
        action={<Link to="/admin/customers/segments" className="btn-outline"><PieChart className="h-4 w-4" /> Segmentation</Link>}
      />

      {/* Customer analytics */}
      {analytics && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={Users} label="Total customers" value={analytics.totalCustomers.toLocaleString('en-IN')} tone="brand" />
            <StatCard icon={UserCheck} label="Active customers" value={analytics.activeCustomers} tone="emerald" />
            <StatCard icon={Repeat} label="Returning rate" value={`${analytics.newVsReturning.find((x) => x.name === 'Returning')?.value ?? 0}%`} tone="purple" />
            <StatCard icon={IndianRupee} label="Avg. lifetime value" value={formatPrice(analytics.avgLifetimeValue)} tone="amber" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title="New vs returning" subtitle="Share of customers"><StatusPie data={analytics.newVsReturning} /></ChartCard>
            <div className="card p-5">
              <h3 className="font-semibold text-ink">Top customers by spend</h3>
              <ul className="mt-4 space-y-3">
                {analytics.topCustomers.map((c) => (
                  <li key={c.id}>
                    <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-slate-50">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{initials(c.name)}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.name}</span>
                      <span className="text-sm font-semibold text-ink">{formatPrice(c.spent)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}

      <div className="relative mb-4 mt-6 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search customers…" />
      </div>

      {loading ? (
        <AdminTable columns={['Customer', 'Orders', 'Total spent', 'Joined', 'Status', '']}>
          <SkeletonTableRows columns={6} />
        </AdminTable>
      ) : (
        <AdminTable columns={['Customer', 'Orders', 'Total spent', 'Joined', 'Status', '']}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">
                    {initials(c.name)}
                  </span>
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{c.orders}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(c.spent)}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(c.joined)}</td>
              <td className="px-4 py-3">
                <span className={`badge ${c.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {c.status}
                </span>
              </td>
              <td className="px-4 py-3">
                <Link to={`/admin/customers/${c.id}`} className="btn-ghost h-8 w-8 p-0 inline-flex" aria-label="View details"><Eye className="h-4 w-4" /></Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
