import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  PackageSearch, Search, Check, Truck, Package, Home, ClipboardCheck, XCircle, MapPin,
  Copy, Phone, Mail, Smartphone, ArrowLeft, ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { accountService } from '../services/accountService';
import { mockOrders, orderTotal } from '../services/mockAccount';
import { ORDER_STATUS_META } from '../utils/constants';
import { formatPrice, formatDate, formatDateTime } from '../utils/format';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Spinner from '../components/common/Spinner';

const FLOW = [
  { key: 'PLACED', label: 'Placed', icon: ClipboardCheck },
  { key: 'PACKED', label: 'Packed', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Package },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];
const STATUS_TO_INDEX = {
  PENDING: 0, PLACED: 0, PAYMENT_INITIATED: 0,
  PAID: 1, CONFIRMED: 1, PROCESSING: 1, PACKED: 1,
  SHIPPED: 2, IN_TRANSIT: 2,
  OUT_FOR_DELIVERY: 3,
  DELIVERED: 4, RETURNED: 4,
};

export default function OrderTracking() {
  const [params, setParams] = useSearchParams();
  const [orderId, setOrderId] = useState(params.get('id') || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const lookup = async (id) => {
    const trimmed = id.trim();
    if (!trimmed) { setError('Please enter an order ID'); return; }
    setLoading(true); setError(''); setSearched(true);
    try {
      const data = await accountService.getOrder(trimmed);
      setOrder(data || null);
      if (!data) setError('No order found with that ID.');
    } catch (err) {
      if (!err?.response) {
        const found = mockOrders.find((o) => o.id.toLowerCase() === trimmed.toLowerCase());
        setOrder(found || null);
        if (!found) setError(`We couldn't find order "${trimmed}". Try SM-100238 (demo).`);
      } else { setOrder(null); setError('No order found with that ID.'); }
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const id = params.get('id');
    if (id) lookup(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = () => { setParams(orderId ? { id: orderId.trim() } : {}); lookup(orderId); };
  const copyTracking = () => { if (order?.trackingId) { navigator.clipboard?.writeText(order.trackingId); toast.success('Tracking ID copied'); } };

  const cancelled = order?.status === 'CANCELLED';
  const activeIndex = order ? (STATUS_TO_INDEX[order.status] ?? 0) : 0;
  const meta = order ? (ORDER_STATUS_META[order.status] || {}) : {};

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Track Order' }]} />

      {/* Search */}
      <div className="mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={orderId} onChange={(e) => setOrderId(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            className="field pl-10" placeholder="Enter order ID e.g. SM-100238" />
        </div>
        <button onClick={onSearch} className="btn-primary sm:w-auto">{loading ? <Spinner /> : <PackageSearch className="h-4 w-4" />} Track</button>
      </div>
      {error && <p className="mt-4 max-w-xl rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>}

      {order && !loading && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Main */}
          <div className="card p-6">
            <Link to="/dashboard/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-2xl font-bold text-ink">Order Tracking</h1>
              <span className={`badge ${meta.tone || ''}`}>{meta.label || order.status}</span>
            </div>
            <p className="mt-1 text-sm text-ink-muted">
              Order ID: <span className="font-medium text-ink">#{order.id}</span>
              <span className="mx-2">·</span>Placed on: {formatDateTime(order.createdAt)}
            </p>

            {/* Stepper */}
            {cancelled ? (
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50/60 p-5">
                <XCircle className="h-6 w-6 text-red-500" />
                <div><p className="font-semibold text-red-700">This order was cancelled</p><p className="text-sm text-red-600/80">Any payment made will be refunded to the original method.</p></div>
              </div>
            ) : (
              <div className="mt-8 flex items-start">
                {FLOW.map((step, i) => {
                  const done = i < activeIndex;
                  const current = i === activeIndex;
                  const Icon = step.icon;
                  const t = order.tracking?.find((x) => x.done && x.label.toLowerCase().includes(step.label.split(' ')[0].toLowerCase()));
                  return (
                    <div key={step.key} className="flex flex-1 items-start last:flex-none">
                      <div className="flex w-20 flex-col items-center text-center">
                        <span className={`grid h-11 w-11 place-items-center rounded-full border-2 transition ${
                          done ? 'border-emerald-500 bg-emerald-500 text-white'
                          : current ? 'border-brand-600 bg-brand-600 text-white ring-4 ring-brand-100'
                          : 'border-slate-200 bg-white text-slate-300'}`}>
                          {done ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                        </span>
                        <span className={`mt-2 text-[11px] font-semibold ${done || current ? 'text-ink' : 'text-ink-muted'}`}>{step.label}</span>
                        <span className="text-[10px] text-ink-muted">{current ? (t ? formatDate(t.date) : 'In progress') : done && t ? formatDate(t.date) : current ? '' : 'Expected'}</span>
                      </div>
                      {i < FLOW.length - 1 && <div className={`mt-5 h-0.5 flex-1 ${i < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
                    </div>
                  );
                })}
              </div>
            )}

            {/* In-transit banner */}
            {!cancelled && order.status === 'SHIPPED' && (
              <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
                <Truck className="h-5 w-5 text-emerald-600" />
                <div><p className="text-sm font-semibold text-emerald-700">Your order is in transit</p><p className="text-xs text-emerald-600/80">Your order is on the way to your delivery address.</p></div>
              </div>
            )}

            <hr className="my-6 border-slate-100" />

            <div className="grid gap-8 sm:grid-cols-2">
              {/* Tracking details */}
              <div>
                <h3 className="font-semibold text-ink">Tracking Details</h3>
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between gap-4"><dt className="text-ink-muted">Courier Partner</dt><dd className="font-medium text-ink">{order.courier || 'ShopMart Logistics'}</dd></div>
                  <div className="flex items-center justify-between gap-4">
                    <dt className="text-ink-muted">Tracking ID</dt>
                    <dd className="inline-flex items-center gap-1.5 font-medium text-ink">{order.trackingId || '—'}{order.trackingId && <button onClick={copyTracking}><Copy className="h-3.5 w-3.5 text-slate-400 hover:text-ink" /></button>}</dd>
                  </div>
                  <div className="flex justify-between gap-4"><dt className="text-ink-muted">Estimated Delivery</dt><dd className="font-medium text-ink">{order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'TBD'}</dd></div>
                  {order.address && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Delivery Address</dt>
                      <dd className="text-right font-medium text-ink">{order.address.name}<span className="block font-normal text-ink-muted">{order.address.line1}, {order.address.city}, {order.address.state} - {order.address.pincode}</span></dd>
                    </div>
                  )}
                </dl>
                <button onClick={() => toast('Map view opens once live courier tracking is connected.')} className="btn-outline mt-4 h-9 text-sm"><MapPin className="h-4 w-4" /> View on Map</button>
              </div>

              {/* Tracking history */}
              <div>
                <h3 className="font-semibold text-ink">Tracking History</h3>
                <ol className="mt-3 space-y-4">
                  {[...(order.tracking || [])].filter((t) => t.done).reverse().map((t, i) => (
                    <li key={i} className="relative flex gap-3 pb-1">
                      <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${i === 0 ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
                      <div>
                        <p className="text-sm font-medium text-ink">{t.label}</p>
                        {t.note && <p className="text-xs text-ink-muted">{t.note}</p>}
                        <p className="text-[11px] text-slate-400">{formatDateTime(t.date)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* App banner */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-50 p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="h-6 w-6 text-brand-600" />
                <div><p className="text-sm font-semibold text-brand-800">Easier &amp; faster with our App!</p><p className="text-xs text-ink-muted">Track your orders in real-time. Get instant updates and notifications.</p></div>
              </div>
              <button onClick={() => toast('App coming soon!')} className="btn-outline h-9 text-sm">Download App</button>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="card p-5">
              <h2 className="font-semibold text-ink">Order Summary</h2>
              <dl className="mt-4 space-y-2.5 text-sm">
                <div className="flex justify-between"><dt className="text-ink-muted">Order ID</dt><dd className="font-medium text-ink">#{order.id}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Order Date</dt><dd className="font-medium text-ink">{formatDate(order.createdAt)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Payment Method</dt><dd className="font-medium text-ink">{order.paymentMethod}</dd></div>
                <div className="flex items-center justify-between"><dt className="text-ink-muted">Payment Status</dt><dd><span className={`badge ${order.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-700' : order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{order.paymentStatus || 'Paid'}</span></dd></div>
              </dl>
              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm font-medium text-ink">
                {order.items.length} Item{order.items.length > 1 ? 's' : ''} <ChevronDown className="h-4 w-4 text-slate-400" />
              </div>
              <ul className="mt-3 space-y-3">
                {order.items.map((it, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <img src={it.image} alt={it.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{it.name}</p><p className="text-xs text-ink-muted">Qty: {it.quantity}</p></div>
                    <span className="text-sm font-semibold text-ink">{formatPrice(it.price * it.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-medium">{formatPrice(order.items.reduce((s, it) => s + it.price * it.quantity, 0))}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="font-semibold text-emerald-600">{order.shipping ? formatPrice(order.shipping) : 'FREE'}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Discount</dt><dd className="font-medium">- {formatPrice(0)}</dd></div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink"><dt>Total Amount</dt><dd>{formatPrice(orderTotal(order))}</dd></div>
              </dl>
            </div>

            <div className="card p-5">
              <h3 className="font-semibold text-ink">Need Help?</h3>
              <p className="mt-1 text-xs text-ink-muted">If you have any questions about your order, our support team is here to help.</p>
              <div className="mt-3 space-y-2 text-sm">
                <a href="tel:+919876543210" className="flex items-center gap-2 text-brand-700 hover:text-brand-800"><Phone className="h-4 w-4" /> +91 98765 43210</a>
                <a href="mailto:support@shopmart.com" className="flex items-center gap-2 text-brand-700 hover:text-brand-800"><Mail className="h-4 w-4" /> support@shopmart.com</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {!order && !loading && !searched && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl bg-slate-50 py-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-brand-600 shadow-card"><PackageSearch className="h-7 w-7" /></span>
          <p className="max-w-sm text-sm text-ink-muted">Enter an order ID above to track it. Have an account? <Link to="/dashboard/orders" className="link">View all your orders</Link>.</p>
        </div>
      )}
    </div>
  );
}
