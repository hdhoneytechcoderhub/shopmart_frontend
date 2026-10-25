import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { mockOrders, orderTotal } from '../../services/mockAccount';
import { ORDER_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const FILTERS = ['ALL', 'PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    accountService.getOrders()
      .then((data) => { if (active) setOrders(Array.isArray(data) ? data : data?.content || []); })
      .catch((err) => { if (active && !err?.response) setOrders(mockOrders); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">My orders</h1>
      <p className="mt-1 text-sm text-ink-muted">Track, review, and re-order your purchases.</p>

      <div className="mt-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
            }`}
          >
            {f === 'ALL' ? 'All' : (ORDER_STATUS_META[f]?.label || f)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders here"
            description="When you place orders, they’ll show up in this list."
            action={<Link to="/shop" className="btn-primary">Start shopping</Link>}
          />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {filtered.map((o) => {
            const meta = ORDER_STATUS_META[o.status] || {};
            return (
              <Link
                key={o.id}
                to={`/dashboard/orders/${o.id}`}
                className="card flex items-center gap-4 p-4 transition hover:shadow-pop"
              >
                <div className="flex -space-x-3">
                  {o.items.slice(0, 3).map((it, i) => (
                    <img
                      key={i}
                      src={it.image}
                      alt={it.name}
                      className="h-14 w-14 rounded-xl border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink">{o.id}</p>
                    <span className={`badge ${meta.tone || ''}`}>{meta.label || o.status}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDate(o.createdAt)} · {o.items.length} item(s)
                  </p>
                </div>
                <p className="hidden font-semibold text-ink sm:block">{formatPrice(orderTotal(o))}</p>
                <ChevronRight className="h-5 w-5 text-slate-300" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
