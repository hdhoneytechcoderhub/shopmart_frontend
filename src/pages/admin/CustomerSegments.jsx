import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analyticsService';
import { adminOrdersService } from '../../services/adminOrdersService';
import { computeSegment, SEGMENT_META } from '../../services/customerIntelService';
import { AdminPageHeader } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';
import { formatPrice, initials } from '../../utils/format';

const SEGMENT_ORDER = ['VIP', 'HIGH_VALUE', 'RETURNING', 'NEW', 'INACTIVE'];

export default function CustomerSegments() {
  const [loading, setLoading] = useState(true);
  const [buckets, setBuckets] = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [customers, ordersPage] = await Promise.all([
        analyticsService.getCustomers(),
        adminOrdersService.search({ size: 200 }),
      ]);
      // Aggregate real orders per customer by name match (same approximation
      // documented in customerIntelService — no customerId filter exists on
      // the backend yet). Falls back to whatever the directory itself
      // reports (real numbers in demo mode; 0 on the real API until the
      // backend adds per-customer aggregates).
      const orders = ordersPage.content || [];
      const grouped = {};
      SEGMENT_ORDER.forEach((s) => { grouped[s] = []; });

      customers.forEach((c) => {
        const matched = orders.filter((o) => (o.customer || '').toLowerCase().trim() === (c.name || '').toLowerCase().trim());
        const spent = matched.length ? matched.reduce((sum, o) => sum + (Number(o.total) || 0), 0) : (c.spent || 0);
        const orderCount = matched.length || c.orders || 0;
        const lastOrderAt = matched.length ? matched.map((o) => o.date).sort().reverse()[0] : null;
        const segment = computeSegment({ orders: orderCount, spent, joined: c.joined, lastOrderAt });
        grouped[segment].push({ ...c, orders: orderCount, spent });
      });

      Object.values(grouped).forEach((list) => list.sort((a, b) => b.spent - a.spent));
      setBuckets(grouped);
    } catch {
      toast.error('Failed to load segmentation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>;

  const total = Object.values(buckets).reduce((sum, l) => sum + l.length, 0);

  return (
    <div>
      <AdminPageHeader title="Customer Segmentation" subtitle="Computed from real order and account data — updates as orders come in." />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Segments are rules applied to real data (order count, spend, recency), not a stored/manual list. On the real backend, per-customer order aggregates are approximated by matching order records to customers by name — ask for a dedicated endpoint if this needs to scale precisely.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {SEGMENT_ORDER.map((seg) => {
          const meta = SEGMENT_META[seg];
          const list = buckets[seg] || [];
          return (
            <section key={seg} className="card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="inline-flex items-center gap-2 font-semibold text-ink">
                  <span className={`badge ${meta.tone}`}>{meta.label}</span>
                  <span className="text-sm font-normal text-ink-muted">{list.length} customer{list.length === 1 ? '' : 's'}{total ? ` · ${Math.round(list.length / total * 100)}%` : ''}</span>
                </h2>
              </div>
              {list.length === 0 ? (
                <p className="text-sm text-ink-muted">No customers in this segment.</p>
              ) : (
                <ul className="space-y-2">
                  {list.slice(0, 6).map((c) => (
                    <li key={c.id}>
                      <Link to={`/admin/customers/${c.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-slate-50">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">{initials(c.name)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-ink">{c.name}</span>
                          <span className="block text-xs text-ink-muted">{c.orders} orders</span>
                        </span>
                        <span className="shrink-0 text-sm font-medium text-ink">{formatPrice(c.spent)}</span>
                      </Link>
                    </li>
                  ))}
                  {list.length > 6 && <li className="pl-2 text-xs text-ink-muted">+{list.length - 6} more</li>}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
