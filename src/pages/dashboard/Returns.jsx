import { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Plus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { returnsService, RETURN_REASONS, subscribeReturns } from '../../services/returnsService';
import { formatPrice, formatDate } from '../../utils/format';
import Modal from '../../components/common/Modal';
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

const EMPTY = { orderId: '', product: '', reason: RETURN_REASONS[0], comment: '' };

export default function Returns() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    returnsService.listMine()
      .then((list) => setItems(list))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeReturns(load), [load]);

  const update = (e) => { const { name, value } = e.target; setForm((f) => ({ ...f, [name]: value })); };

  const submit = async () => {
    if (!form.orderId.trim() || !form.product.trim()) { toast.error('Order ID and product are required'); return; }
    setSaving(true);
    try {
      await returnsService.create({ ...form, orderId: form.orderId.trim().toUpperCase() });
      toast.success('Return request submitted');
      setOpen(false); setForm(EMPTY);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not submit the request');
    } finally {
      setSaving(false);
    }
  };

  const list = items || [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Returns</h1>
          <p className="text-sm text-ink-muted">Request a return or track an existing one.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary"><Plus className="h-4 w-4" /> Request return</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <EmptyState icon={RotateCcw} title="No returns yet" description="You haven't requested any returns." />
      ) : (
        <div className="space-y-3">
          {list.map((r) => (
            <div key={r.id} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-100 text-slate-500"><Package className="h-5 w-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">{r.product}</p>
                <p className="text-xs text-ink-muted">RMA-{r.id} · Order {r.orderId} · {r.reason}</p>
              </div>
              <div className="text-right">
                {r.amount ? <p className="text-sm font-semibold text-ink">{formatPrice(r.amount)}</p> : null}
                <p className="text-xs text-ink-muted">{formatDate(r.createdAt)}</p>
              </div>
              <span className={`badge ${STATUS_STYLE[r.status] || 'bg-slate-100 text-slate-600'}`}>{label(r.status)}</span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => !saving && setOpen(false)}
        title="Request a return"
        footer={(
          <>
            <button onClick={() => setOpen(false)} disabled={saving} className="btn-ghost">Cancel</button>
            <button onClick={submit} disabled={saving} className="btn-primary">{saving ? <Spinner /> : null} Submit request</button>
          </>
        )}
      >
        <div className="grid gap-4">
          <div>
            <label className="label">Order ID</label>
            <input name="orderId" value={form.orderId} onChange={update} className="field uppercase" placeholder="e.g. SM-100238" />
          </div>
          <div>
            <label className="label">Product</label>
            <input name="product" value={form.product} onChange={update} className="field" placeholder="Which item are you returning?" />
          </div>
          <div>
            <label className="label">Reason</label>
            <select name="reason" value={form.reason} onChange={update} className="field">
              {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Comment (optional)</label>
            <textarea name="comment" rows={3} value={form.comment} onChange={update} className="field resize-none" placeholder="Add any details that help us process your return" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
