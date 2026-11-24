import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Eye, CheckCircle2, Circle, Package, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminOrdersService } from '../../services/adminOrdersService';
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDate, formatDateTime } from '../../utils/format';
import { AdminPageHeader, AdminTable, StatusBadge } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 20;
const FULFILLMENT_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    adminOrdersService.search({ status: filter === 'ALL' ? undefined : filter, q: q || undefined, page, size: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        setOrders(data.content);
        setTotalPages(data.totalPages);
      })
      .catch(() => { if (active) toast.error('Failed to load orders'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filter, q, page]);

  useEffect(() => load(), [load]);
  useEffect(() => { setPage(0); }, [filter, q]);

  const setStatus = async (order, status) => {
    const previous = order.status;
    setUpdating(order.orderId);
    setOrders((list) => list.map((o) => (o.orderId === order.orderId ? { ...o, status } : o)));
    try {
      await adminOrdersService.updateStatus(order.orderId, status);
      toast.success(`Order ${order.id} → ${ORDER_STATUS_META[status]?.label || status}`);
      if (viewing?.orderId === order.orderId) setViewing((v) => ({ ...v, status }));
    } catch (err) {
      setOrders((list) => list.map((o) => (o.orderId === order.orderId ? { ...o, status: previous } : o)));
      toast.error(err?.response?.data?.message || 'Could not update the order status');
    } finally {
      setUpdating(null);
    }
  };

  const view = (order) => {
    setViewing(order);
    setDetailLoading(true);
    adminOrdersService.getOrder(order.orderId)
      .then((detail) => setViewing((current) => (current?.orderId === order.orderId ? detail : current)))
      .catch(() => toast.error('Could not load the full order details'))
      .finally(() => setDetailLoading(false));
  };

  const payBadge = (s) => {
    const meta = PAYMENT_STATUS_META[s] || PAYMENT_STATUS_META.PENDING;
    return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
  };

  const statusOptions = (order) => {
    const base = order.paymentStatus === 'PAID' ? FULFILLMENT_STATUSES : ['CANCELLED'];
    return Array.from(new Set([order.status, ...base]));
  };

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="Review payments and update order statuses." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search by order, customer or email…" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field w-auto">
          <option value="ALL">All statuses</option>
          {Object.keys(ORDER_STATUS_META).map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
        <AdminTable columns={['Order', 'Customer', 'Date', 'Total', 'Payment', 'Pay status', 'Order status', 'Update', '']}>
          {orders.map((o) => (
            <tr key={o.orderId} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{o.id}</td>
              <td className="px-4 py-3 text-ink-soft">{o.customer}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(o.date)}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(o.total)}</td>
              <td className="px-4 py-3 text-ink-soft">{o.paymentMethod}</td>
              <td className="px-4 py-3">{payBadge(o.paymentStatus)}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  disabled={updating === o.orderId}
                  onChange={(e) => setStatus(o, e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs focus:border-brand-500 focus:outline-none disabled:opacity-50"
                >
                  {statusOptions(o).map((s) => (
                    <option key={s} value={s}>{ORDER_STATUS_META[s]?.label || s}</option>
                  ))}
                </select>
              </td>
              <td className="px-4 py-3">
                <button onClick={() => view(o)} className="btn-ghost h-8 w-8 p-0" aria-label="View details"><Eye className="h-4 w-4" /></button>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr><td colSpan={9} className="px-4 py-10 text-center text-sm text-ink-muted">No orders found.</td></tr>
          )}
        </AdminTable>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.id || ''}`}
        footer={<button onClick={() => setViewing(null)} className="btn-ghost">Close</button>}>
        {viewing && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-ink-muted">ShopMart order ID</dt><dd className="font-medium text-ink">{viewing.id}</dd></div>
              <div><dt className="text-ink-muted">Order date/time</dt><dd className="font-medium text-ink">{formatDateTime(viewing.date)}</dd></div>
              <div><dt className="text-ink-muted">Customer</dt><dd className="font-medium text-ink">{viewing.customer}</dd></div>
              <div><dt className="text-ink-muted">Mobile</dt><dd className="font-medium text-ink">{viewing.customerPhone || viewing.address?.phone || '—'}</dd></div>
              <div className="col-span-2"><dt className="text-ink-muted">Customer email</dt><dd className="font-medium text-ink">{viewing.customerEmail || viewing.address?.email || '—'}</dd></div>
              <div><dt className="text-ink-muted">Payment method</dt><dd className="font-medium text-ink">{viewing.paymentMethod}</dd></div>
              <div><dt className="text-ink-muted">Payment status</dt><dd>{payBadge(viewing.paymentStatus)}</dd></div>
              <div className="col-span-2"><dt className="text-ink-muted">Razorpay Order ID</dt><dd className="break-all font-mono text-xs text-ink">{viewing.razorpayOrderId || '—'}</dd></div>
              <div className="col-span-2"><dt className="text-ink-muted">Razorpay Payment ID</dt><dd className="break-all font-mono text-xs text-ink">{viewing.razorpayPaymentId || '—'}</dd></div>
              <div><dt className="text-ink-muted">Order status</dt><dd><StatusBadge status={viewing.status} /></dd></div>
              {viewing.paidAt && <div><dt className="text-ink-muted">Paid at</dt><dd className="font-medium text-ink">{formatDateTime(viewing.paidAt)}</dd></div>}
            </dl>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"><Package className="h-4 w-4 text-brand-600" /> Products</h4>
              {detailLoading ? (
                <div className="flex justify-center py-4 text-brand-600"><Spinner className="h-5 w-5" /></div>
              ) : !viewing.items?.length ? (
                <p className="text-sm text-ink-muted">No line items recorded.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {viewing.items.map((it, i) => (
                    <div key={i} className="flex items-center gap-3 py-3">
                      {it.image ? (
                        <img src={it.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-lg bg-slate-100 text-slate-400"><Package className="h-5 w-5" /></div>
                      )}
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="truncate font-medium text-ink">{it.name}</p>
                        <p className="text-xs text-ink-muted">Qty {it.quantity} · {formatPrice(it.price)} each</p>
                      </div>
                      <span className="text-sm font-semibold text-ink">{formatPrice(it.lineTotal ?? it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}

              <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
                <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd>{formatPrice(viewing.subtotal || 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-ink-muted">Shipping charges</dt><dd>{Number(viewing.shipping) > 0 ? formatPrice(viewing.shipping) : 'Free'}</dd></div>
                {Number(viewing.discount) > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>−{formatPrice(viewing.discount)}</dd></div>}
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-ink"><dt>Total paid</dt><dd>{formatPrice(viewing.total || 0)}</dd></div>
              </dl>
            </div>

            {viewing.address && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink"><MapPin className="h-4 w-4 text-brand-600" /> Delivery address</h4>
                <p className="text-sm font-medium text-ink">{viewing.address.name}</p>
                <p className="text-sm text-ink-muted">
                  {[viewing.address.line1, viewing.address.line2, viewing.address.city, viewing.address.state, viewing.address.postalCode, viewing.address.country].filter(Boolean).join(', ')}
                </p>
                <p className="text-sm text-ink-muted">Mobile: {viewing.address.phone || '—'}{viewing.address.email ? ` · Email: ${viewing.address.email}` : ''}</p>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-ink">Order timeline</h4>
              {!viewing.history?.length ? (
                <p className="text-sm text-ink-muted">No status history recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {viewing.history.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {i === viewing.history.length - 1
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <Circle className="h-4 w-4 text-slate-300" />}
                        {i < viewing.history.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-slate-200" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-sm font-medium text-ink">{ORDER_STATUS_META[h.status]?.label || h.status}</p>
                        {h.note && <p className="text-xs text-ink-muted">{h.note}</p>}
                        <p className="text-xs text-slate-400">{formatDateTime(h.at)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
