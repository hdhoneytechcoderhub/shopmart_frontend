import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, RotateCcw } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const FILTERS = ['ALL', 'PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    let active = true;
    accountService.getOrders()
      .then((data) => { if (active) setOrders(Array.isArray(data) ? data : data?.content || []); })
      .catch(() => { if (active) setOrders([]); })
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
            const pay = PAYMENT_STATUS_META[o.paymentStatus] || PAYMENT_STATUS_META.PENDING;
            const unpaid = o.paymentStatus !== 'PAID' && o.status !== 'CANCELLED';
            const items = o.items || [];
            return (
              <div key={o.id} className="card flex flex-wrap items-center gap-4 p-4 transition hover:shadow-pop">
                <Link to={`/dashboard/orders/${o.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex -space-x-3">
                    {items.slice(0, 3).map((it, i) => (
                      it.image
                        ? <img key={i} src={it.image} alt={it.name} className="h-14 w-14 rounded-xl border-2 border-white object-cover" />
                        : <span key={i} className="grid h-14 w-14 place-items-center rounded-xl border-2 border-white bg-slate-100 text-slate-400"><Package className="h-5 w-5" /></span>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{o.orderNumber || o.id}</p>
                      <span className={`badge ${meta.tone || ''}`}>{meta.label || o.status}</span>
                      <span className={`badge ${pay.tone}`}>{pay.label}</span>
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatDate(o.createdAt)} · {o.itemCount ?? items.reduce((n, it) => n + (it.quantity || 1), 0)} item(s)
                    </p>
                  </div>
                  <p className="hidden font-semibold text-ink sm:block">{formatPrice(o.total)}</p>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </Link>
                {unpaid && (
                  <Link to={`/checkout?order=${o.id}`} className="btn-outline h-8 text-xs">
                    <RotateCcw className="h-3.5 w-3.5" /> Retry payment
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
