import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle2, Circle, Truck, Download, Package, RotateCcw } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDateTime } from '../../utils/format';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    accountService.getOrder(id)
      .then((data) => { if (active) setOrder(data); })
      .catch(() => { if (active) setOrder(null); })
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
  const pay = PAYMENT_STATUS_META[order.paymentStatus] || PAYMENT_STATUS_META.PENDING;
  const items = order.items || [];
  const subtotal = order.subtotal ?? items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const total = order.total ?? (subtotal + Number(order.shipping || 0) - Number(order.discount || 0));
  const unpaid = order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED';

  return (
    <div>
      <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">{order.orderNumber || order.id}</h1>
          <p className="text-sm text-ink-muted">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${pay.tone}`}>{pay.label}</span>
          <span className={`badge ${meta.tone || ''}`}>{meta.label || order.status}</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/track?id=${order.orderNumber || order.id}`} className="btn-outline h-9 w-fit text-sm">
          <Truck className="h-4 w-4" /> Track shipment
        </Link>
        <button
          onClick={async () => {
            const { downloadInvoice } = await import('../../utils/invoice');
            downloadInvoice({ ...order, total });
          }}
          className="btn-outline h-9 w-fit text-sm"
        >
          <Download className="h-4 w-4" /> Download invoice
        </button>
        {unpaid && (
          <Link to={`/checkout?order=${order.id}`} className="btn-accent h-9 w-fit text-sm">
            <RotateCcw className="h-4 w-4" /> Retry payment
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          {/* Items */}
          <div className="card overflow-hidden">
            <h2 className="border-b border-slate-100 px-5 py-3 font-semibold text-ink">Items</h2>
            <ul className="divide-y divide-slate-100">
              {items.map((it, i) => (
                <li key={i} className="flex items-center gap-4 px-5 py-4">
                  {it.image
                    ? <img src={it.image} alt={it.name} className="h-16 w-16 rounded-xl object-cover" />
                    : <span className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-slate-400"><Package className="h-6 w-6" /></span>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-ink-muted">
                      {[it.size, it.color].filter(Boolean).join(' · ')}{[it.size, it.color].filter(Boolean).length ? ' · ' : ''}Qty {it.quantity}
                    </p>
                  </div>
                  <p className="font-semibold text-ink">{formatPrice((it.price || 0) * (it.quantity || 1))}</p>
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
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="font-medium">{Number(order.shipping) > 0 ? formatPrice(order.shipping) : 'Free'}</dd></div>
              {Number(order.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd className="font-medium">−{formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
            </dl>
            <div className="mt-3 space-y-1 text-xs text-ink-muted">
              <p>Payment method: <span className="font-medium text-ink">{order.paymentMethod === 'RAZORPAY' ? 'Razorpay' : (order.paymentMethod || '—')}</span></p>
              <p>Payment status: <span className={`badge ${pay.tone}`}>{pay.label}</span></p>
              {order.razorpayPaymentId && <p className="break-all">Razorpay payment: <span className="font-mono">{order.razorpayPaymentId}</span></p>}
              {order.razorpayOrderId && <p className="break-all">Razorpay order: <span className="font-mono">{order.razorpayOrderId}</span></p>}
            </div>
          </div>

          {/* Address */}
          {order.address && (
            <div className="card p-5">
              <h2 className="mb-2 inline-flex items-center gap-2 font-semibold text-ink">
                <MapPin className="h-4 w-4 text-brand-600" /> Delivery address
              </h2>
              <p className="text-sm font-medium text-ink">{order.address.name}</p>
              <p className="text-sm text-ink-muted">
                {[order.address.line1, order.address.line2, order.address.city, order.address.state, order.address.postalCode || order.address.pincode, order.address.country].filter(Boolean).join(', ')}
              </p>
              <p className="text-sm text-ink-muted">Phone: {order.address.phone}</p>
              {order.address.email && <p className="text-sm text-ink-muted">Email: {order.address.email}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
