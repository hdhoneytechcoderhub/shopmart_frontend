import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Eye, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminOrdersService } from '../../services/adminOrdersService';
import { ORDER_STATUS, ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDate, formatDateTime } from '../../utils/format';
import { AdminPageHeader, AdminTable, StatusBadge } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';

const PAGE_SIZE = 20;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(() => searchParams.get('q') || '');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [viewing, setViewing] = useState(null);
  const [history, setHistory] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [updating, setUpdating] = useState(null);

  // Real server-side pagination + filtering — GET /admin/orders — instead of
  // fetching up to 200 and slicing client-side.
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
    } catch (err) {
      setOrders((list) => list.map((o) => (o.orderId === order.orderId ? { ...o, status: previous } : o)));
      toast.error(err?.response?.data?.message || 'Could not update the order status');
    } finally {
      setUpdating(null);
    }
  };

  const view = (order) => {
    setViewing(order);
    setHistory(null);
    setHistoryLoading(true);
    adminOrdersService.getHistory(order.orderId)
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  };

  const payBadge = (s) => {
    const meta = PAYMENT_STATUS_META[s] || PAYMENT_STATUS_META.PAID;
    return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
  };

  return (
    <div>
      <AdminPageHeader title="Orders" subtitle="Review payments and update order statuses." />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search by order or customer…" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="field w-auto">
          <option value="ALL">All statuses</option>
          {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
      <AdminTable columns={['Order', 'Customer', 'Date', 'Total', 'Payment', 'Pay status', 'Order status', 'Update', '']}>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-slate-50/60">
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
                {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{ORDER_STATUS_META[s].label}</option>)}
              </select>
            </td>
            <td className="px-4 py-3">
              <button onClick={() => view(o)} className="btn-ghost h-8 w-8 p-0" aria-label="View details"><Eye className="h-4 w-4" /></button>
            </td>
          </tr>
        ))}
      </AdminTable>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      {/* Order / payment details + timeline */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={`Order ${viewing?.id || ''}`}
        footer={<button onClick={() => setViewing(null)} className="btn-ghost">Close</button>}>
        {viewing && (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-ink-muted">Customer</dt><dd className="font-medium text-ink">{viewing.customer}</dd></div>
              <div><dt className="text-ink-muted">Total amount</dt><dd className="font-medium text-ink">{formatPrice(viewing.total)}</dd></div>
              <div><dt className="text-ink-muted">Payment method</dt><dd className="font-medium text-ink">{viewing.paymentMethod}</dd></div>
              <div><dt className="text-ink-muted">Payment status</dt><dd>{payBadge(viewing.paymentStatus)}</dd></div>
              <div className="col-span-2"><dt className="text-ink-muted">Razorpay Order ID</dt><dd className="font-mono text-xs text-ink">{viewing.razorpayOrderId || '—'}</dd></div>
              <div className="col-span-2"><dt className="text-ink-muted">Razorpay Payment ID</dt><dd className="font-mono text-xs text-ink">{viewing.razorpayPaymentId || '—'}</dd></div>
              <div><dt className="text-ink-muted">Order status</dt><dd><StatusBadge status={viewing.status} /></dd></div>
              <div><dt className="text-ink-muted">Date</dt><dd className="font-medium text-ink">{formatDate(viewing.date)}</dd></div>
            </dl>

            <div className="border-t border-slate-100 pt-4">
              <h4 className="mb-3 text-sm font-semibold text-ink">Order timeline</h4>
              {historyLoading ? (
                <div className="flex justify-center py-4 text-brand-600"><Spinner className="h-5 w-5" /></div>
              ) : !history?.length ? (
                <p className="text-sm text-ink-muted">No status history recorded yet.</p>
              ) : (
                <ol className="space-y-4">
                  {history.map((h, i) => (
                    <li key={i} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {i === history.length - 1
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          : <Circle className="h-4 w-4 text-slate-300" />}
                        {i < history.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-slate-200" />}
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
