import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Circle, Truck, Download } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { mockOrders, orderTotal } from '../../services/mockAccount';
import { ORDER_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDateTime } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Package } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    accountService.getOrder(id)
      .then((data) => { if (active) setOrder(data); })
      .catch((err) => {
        if (active && !err?.response) setOrder(mockOrders.find((o) => o.id === id) || null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  }

  if (!order) {
    return (
      <EmptyState
        icon={Package}
        title="Order not found"
        description="We couldn’t find that order."
        action={<Link to="/dashboard/orders" className="btn-primary">Back to orders</Link>}
      />
    );
  }

  const meta = ORDER_STATUS_META[order.status] || {};
  const subtotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <div>
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{order.id}</h1>
          <p className="text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <span className={`badge ${meta.tone || ''}`}>{meta.label || order.status}</span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/track?id=${order.id}`} className="btn-outline h-9 w-fit text-sm">
          <Truck className="h-4 w-4" /> Track shipment
        </Link>
        <button
          onClick={async () => {
            const { downloadInvoice } = await import('../../utils/invoice');
            downloadInvoice({ ...order, total: orderTotal(order) });
          }}
          className="btn-outline h-9 w-fit text-sm"
        >
          <Download className="h-4 w-4" /> Download invoice
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Items */}
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-3 font-semibold text-ink">Items</h2>
            <ul className="divide-y divide-slate-100">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  <img src={it.image} alt={it.name} className="h-16 w-16 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-ink-muted">
                      {[it.size, it.color].filter(Boolean).join(' · ')} · Qty {it.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">{formatPrice(it.price * it.quantity)}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Tracking */}
          {order.tracking?.length > 0 && (
            <div className="card p-5">
              <h2 className="mb-4 font-semibold text-ink">Tracking</h2>
              <ol className="space-y-4">
                {order.tracking.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                    )}
                    <div>
                      <p className={`text-sm font-medium ${step.done ? 'text-ink' : 'text-ink-muted'}`}>{step.label}</p>
                      {step.date && <p className="text-xs text-ink-muted">{formatDateTime(step.date)}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div className="card p-5">
            <h2 className="mb-3 font-semibold text-ink">Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="font-medium">{order.shipping ? formatPrice(order.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink"><dt>Total</dt><dd>{formatPrice(orderTotal(order))}</dd></div>
            </dl>
            <p className="mt-3 text-xs text-ink-muted">Paid via {order.paymentMethod}</p>
          </div>

          {/* Address */}
          {order.address && (
            <div className="card p-5">
              <h2 className="mb-2 inline-flex items-center gap-2 font-semibold text-ink">
                <MapPin className="h-4 w-4 text-brand-600" /> Delivery address
              </h2>
              <p className="text-sm font-medium text-ink">{order.address.name}</p>
              <p className="text-sm text-ink-muted">
                {order.address.line1}, {order.address.city}, {order.address.state} {order.address.pincode}
              </p>
              <p className="text-sm text-ink-muted">Phone: {order.address.phone}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
