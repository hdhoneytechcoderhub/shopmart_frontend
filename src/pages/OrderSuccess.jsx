import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Download, FileText, Truck } from 'lucide-react';
import { accountService } from '../services/accountService';
import { downloadInvoice } from '../utils/invoice';
import { formatPrice, formatDate } from '../utils/format';
import Spinner from '../components/common/Spinner';

export default function OrderSuccess() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);

  useEffect(() => {
    if (order) return;
    let active = true;
    accountService.getOrder(id)
      .then((data) => { if (active) setOrder(data); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, order]);

  const total = order?.total ?? (order?.items?.reduce((s, it) => s + it.price * it.quantity, 0) || 0) + (order?.shipping || 0) - (order?.discount || 0);

  return (
    <div className="container-page flex flex-col items-center py-12 text-center">
      <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-100 text-emerald-600 animate-slide-up">
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h1 className="mt-6 text-3xl font-bold">Order confirmed!</h1>
      <p className="mt-2 max-w-md text-ink-muted">
        Thank you for your purchase. We've emailed your receipt and will notify you when your order ships.
      </p>

      <div className="mt-6 w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-left">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-ink-muted">Order number</p>
            <p className="text-lg font-bold tracking-wide">#{id}</p>
          </div>
          {order && (
            <div className="text-right">
              <p className="text-xs text-ink-muted">Order date</p>
              <p className="text-sm font-medium text-ink">{formatDate(order.createdAt || Date.now())}</p>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-8 text-brand-600"><Spinner className="h-6 w-6" /></div>
        ) : order ? (
          <>
            <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              {(order.items || []).map((it, i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{it.name}</p>
                    <p className="text-xs text-ink-muted">Qty {it.quantity}{it.size ? ` · ${it.size}` : ''}{it.color ? ` · ${it.color}` : ''}</p>
                  </div>
                  <span className="text-sm font-semibold text-ink">{formatPrice(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>
            <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Payment</dt><dd className="font-medium text-ink">{order.paymentMethod} · {order.paymentStatus || 'Paid'}</dd></div>
              <div className="flex justify-between text-base font-bold text-ink"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
            </dl>
            {order.estimatedDelivery && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                <Truck className="h-3.5 w-3.5" /> Estimated delivery by {formatDate(order.estimatedDelivery)}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-ink-muted">Your order has been placed successfully.</p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {order && (
          <button onClick={() => downloadInvoice(order)} className="btn-primary">
            <Download className="h-4 w-4" /> Download Invoice
          </button>
        )}
        <Link to={`/dashboard/orders/${id}`} className="btn-outline"><FileText className="h-4 w-4" /> View Order</Link>
        <Link to={`/track?id=${id}`} className="btn-outline"><Package className="h-4 w-4" /> Track Order</Link>
        <Link to="/shop" className="btn-ghost">Continue shopping <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}
