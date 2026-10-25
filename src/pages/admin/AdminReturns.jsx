import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { returnsService, RETURN_STATUS, subscribeReturns } from '../../services/returnsService';
import { formatPrice, formatDate } from '../../utils/format';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';

const STATUS_STYLE = {
  REQUESTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REFUNDED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
};
const label = (s) => s.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

const TABS = ['ALL', ...RETURN_STATUS];

export default function AdminReturns() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('ALL');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    returnsService.listAll().then((list) => setItems(list)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeReturns(load), [load]);

  const decide = async (r, approve) => {
    setBusyId(r.id);
    const nextStatus = approve ? 'REFUNDED' : 'REJECTED'; // approving auto-processes the refund — see returnsService.decide
    setItems((list) => list.map((x) => (x.id === r.id ? { ...x, status: nextStatus } : x))); // optimistic
    try {
      await returnsService.decide(r.id, approve);
      toast.success(`RMA-${r.id} ${approve ? 'approved & refunded' : 'rejected'}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not process this return');
      load();
    } finally {
      setBusyId(null);
    }
  };

  const list = items || [];
  const count = (s) => (s === 'ALL' ? list.length : list.filter((r) => r.status === s).length);
  const visible = tab === 'ALL' ? list : list.filter((r) => r.status === tab);

  return (
    <div>
      <AdminPageHeader title="Returns" subtitle="Review and process customer return requests." />

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              tab === t ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>
            {t === 'ALL' ? 'All' : label(t)}
            <span className={`rounded-full px-1.5 text-xs ${tab === t ? 'bg-white/20' : 'bg-white'}`}>{count(t)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : visible.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No returns" description="Nothing to show in this tab." />
      ) : (
        <AdminTable columns={['RMA', 'Customer', 'Product', 'Order', 'Amount', 'Reason', 'When', 'Status', 'Decision']}>
          {visible.map((r) => (
            <tr key={r.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">RMA-{r.id}</td>
              <td className="px-4 py-3 text-ink-soft">{r.customer || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{r.product || '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{r.orderId}</td>
              <td className="px-4 py-3 font-medium text-ink">{r.amount ? formatPrice(r.amount) : '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{r.reason}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(r.createdAt)}</td>
              <td className="px-4 py-3"><span className={`badge ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-600'}`}>{label(r.status)}</span></td>
              <td className="px-4 py-3">
                {r.status === 'REQUESTED' ? (
                  <div className="flex gap-1.5">
                    <button disabled={busyId === r.id} onClick={() => decide(r, true)}
                      className="btn-outline h-7 gap-1 px-2 text-xs !text-emerald-700 hover:!bg-emerald-50">
                      <Check className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button disabled={busyId === r.id} onClick={() => decide(r, false)}
                      className="btn-outline h-7 gap-1 px-2 text-xs !text-red-700 hover:!bg-red-50">
                      <X className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                ) : (
                  <span className="text-xs text-ink-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
    </div>
  );
}
