import { useState } from 'react';
import { Plus, Pencil, Trash2, BarChart2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { couponService } from '../../services/couponService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice, formatDate } from '../../utils/format';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';

const EMPTY = { code: '', type: 'PERCENT', value: '', minOrder: '', expiry: '', active: true };

export default function AdminCoupons() {
  const { data, loading, refetch } = useFetch(() => couponService.list(), []);
  const [items, setItems] = useState(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [viewingUsage, setViewingUsage] = useState(null);

  // Keep a local working copy so optimistic edits render instantly.
  const list = items ?? data ?? [];

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (c) => { setEditing(c); setForm(c); setOpen(true); };
  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const save = async () => {
    if (!form.code.trim() || !form.value) { toast.error('Code and value are required'); return; }
    setSaving(true);
    const payload = { ...form, code: form.code.toUpperCase(), value: Number(form.value), minOrder: Number(form.minOrder) || 0 };
    try {
      if (editing) {
        await couponService.update(editing.id, payload);
        toast.success('Coupon updated');
      } else {
        await couponService.create(payload);
        toast.success('Coupon created');
      }
      setItems(null); // drop the optimistic override so the next render uses fresh server data
      await refetch();
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the coupon');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    setItems(list.filter((x) => x.id !== c.id)); // optimistic
    try {
      await couponService.remove(c.id);
      toast.success('Coupon removed');
      setItems(null);
      refetch();
    }
    catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove the coupon');
      setItems(null); // drop the optimistic removal so refetch's real data actually renders
      refetch();
    }
  };

  const valueLabel = (c) => (c.type === 'PERCENT' ? `${c.value}% off` : `${formatPrice(c.value)} off`);

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        subtitle="Create and manage discount codes."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> New coupon</button>}
      />

      {loading && !items ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
      <AdminTable columns={['Code', 'Discount', 'Min order', 'Expiry', 'Used', 'Status', '']}>
        {list.map((c) => (
          <tr key={c.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-3"><span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs font-semibold text-ink">{c.code}</span></td>
            <td className="px-4 py-3 font-medium text-ink">{valueLabel(c)}</td>
            <td className="px-4 py-3 text-ink-soft">{c.minOrder ? formatPrice(c.minOrder) : '—'}</td>
            <td className="px-4 py-3 text-ink-muted">{formatDate(c.expiry)}</td>
            <td className="px-4 py-3">
              <button onClick={() => setViewingUsage(c)} className="group flex items-center gap-2 text-left" title="View usage breakdown">
                <span className="text-ink-soft group-hover:text-brand-600">{c.used}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</span>
                {c.usageLimit ? (
                  <span className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (c.used / c.usageLimit) * 100)}%` }} />
                  </span>
                ) : (
                  <BarChart2 className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-500" />
                )}
              </button>
            </td>
            <td className="px-4 py-3">
              <span className={`badge ${c.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {c.active ? 'Active' : 'Inactive'}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button onClick={() => startEdit(c)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => remove(c)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </td>
          </tr>
        ))}
      </AdminTable>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit coupon' : 'New coupon'}
        footer={(
          <>
            <button onClick={() => setOpen(false)} disabled={saving} className="btn-ghost">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Spinner /> : null} Save</button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Code</label>
            <input name="code" className="field uppercase" value={form.code} onChange={update} placeholder="e.g. SAVE10" />
          </div>
          <div>
            <label className="label">Type</label>
            <select name="type" value={form.type} onChange={update} className="field">
              <option value="PERCENT">Percentage</option>
              <option value="FLAT">Flat amount</option>
            </select>
          </div>
          <div>
            <label className="label">Value</label>
            <input name="value" type="number" className="field" value={form.value} onChange={update} placeholder={form.type === 'PERCENT' ? '10' : '200'} />
          </div>
          <div>
            <label className="label">Min order (₹)</label>
            <input name="minOrder" type="number" className="field" value={form.minOrder} onChange={update} placeholder="0" />
          </div>
          <div>
            <label className="label">Expiry</label>
            <input name="expiry" type="date" className="field" value={form.expiry} onChange={update} />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input type="checkbox" name="active" checked={form.active} onChange={update} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Active
          </label>
        </div>
      </Modal>

      {/* Usage / redemption breakdown */}
      <Modal open={!!viewingUsage} onClose={() => setViewingUsage(null)} title={`Usage — ${viewingUsage?.code || ''}`}
        footer={<button onClick={() => setViewingUsage(null)} className="btn-ghost">Close</button>}>
        {viewingUsage && (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-ink">{viewingUsage.used}</p>
              <p className="text-xs text-ink-muted">total redemptions{viewingUsage.usageLimit ? ` of ${viewingUsage.usageLimit} allowed` : ' (unlimited)'}</p>
              {viewingUsage.usageLimit && (
                <div className="mx-auto mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (viewingUsage.used / viewingUsage.usageLimit) * 100)}%` }} />
                </div>
              )}
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-ink-muted">Per-customer limit</dt><dd className="font-medium text-ink">{viewingUsage.perUserLimit ?? 'Unlimited'}</dd></div>
              <div><dt className="text-ink-muted">Remaining (total)</dt><dd className="font-medium text-ink">{viewingUsage.usageLimit != null ? Math.max(0, viewingUsage.usageLimit - viewingUsage.used) : 'Unlimited'}</dd></div>
              <div><dt className="text-ink-muted">Min order</dt><dd className="font-medium text-ink">{viewingUsage.minOrder ? formatPrice(viewingUsage.minOrder) : '—'}</dd></div>
              <div><dt className="text-ink-muted">Expiry</dt><dd className="font-medium text-ink">{formatDate(viewingUsage.expiry)}</dd></div>
            </dl>
            <p className="text-xs text-ink-muted">
              A per-customer redemption log (who used it, when) isn't available yet — the backend only tracks the aggregate count and limits shown above.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
