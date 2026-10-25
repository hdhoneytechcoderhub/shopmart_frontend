import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Building2, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { companyService, planService } from '../../services/superAdminService';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

const EMPTY = { name: '', contactEmail: '', contactPhone: '', gstNumber: '', address: '', status: 'ACTIVE', planId: '' };
const STATUS_TONE = { ACTIVE: 'bg-emerald-100 text-emerald-700', SUSPENDED: 'bg-red-100 text-red-700' };

export default function CompanyManagement() {
  const [items, setItems] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([companyService.list(), planService.list()])
      .then(([companies, planList]) => { setItems(companies); setPlans(planList); })
      .catch(() => toast.error('Failed to load companies'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (c) => { setEditing(c); setForm({ ...EMPTY, ...c }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    if (!form.contactEmail.trim()) { toast.error('Contact email is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await companyService.update(editing.id, form);
        toast.success('Company updated');
      } else {
        await companyService.create(form);
        toast.success('Company added');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save company');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await companyService.remove(toDelete.id);
      toast.success('Company removed');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove company');
    } finally {
      setDeleting(false);
    }
  };

  const planName = (id) => plans.find((p) => String(p.id) === String(id))?.name || '—';
  const filtered = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <AdminPageHeader
        title="Company Management"
        subtitle="Businesses onboarded onto the ShopMart platform."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add company</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Frontend control-plane UI ahead of the backend — companies are stored locally (this browser) until a real Company entity/API exists. See the delivery notes for the schema this needs.</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search companies…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No companies" description="Add your first company." action={<button onClick={startAdd} className="btn-primary">Add company</button>} />
      ) : (
        <AdminTable columns={['Company', 'Contact', 'Plan', 'Status', '']}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Building2 className="h-5 w-5" /></span>
                  <div>
                    <p className="font-medium text-ink">{c.name}</p>
                    <p className="text-xs text-ink-muted">{c.gstNumber}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">
                <p>{c.contactEmail}</p>
                <p className="text-xs text-ink-muted">{c.contactPhone}</p>
              </td>
              <td className="px-4 py-3"><span className="badge bg-brand-50 text-brand-700">{planName(c.planId)}</span></td>
              <td className="px-4 py-3"><span className={`badge ${STATUS_TONE[c.status] || STATUS_TONE.ACTIVE}`}>{c.status}</span></td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => startEdit(c)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(c)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit company' : 'Add company'} size="lg" footer={(
        <>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
        </>
      )}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Company name</label><input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Contact email</label><input type="email" className="field" value={form.contactEmail} onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))} /></div>
          <div><label className="label">Contact phone</label><input className="field" value={form.contactPhone} onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))} /></div>
          <div><label className="label">GST / Tax ID</label><input className="field" value={form.gstNumber} onChange={(e) => setForm((f) => ({ ...f, gstNumber: e.target.value }))} /></div>
          <div>
            <label className="label">Plan</label>
            <select className="field" value={form.planId} onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}>
              <option value="">Unassigned</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2"><label className="label">Address</label><textarea rows={2} className="field resize-none" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} /></div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Remove company?" footer={(
        <>
          <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={remove} disabled={deleting} className="btn-danger">{deleting ? 'Removing…' : 'Remove'}</button>
        </>
      )}>
        <p className="text-sm text-ink-muted">Remove <span className="font-medium text-ink">{toDelete?.name}</span>? Any tenants or subscriptions linked to it should be reviewed separately.</p>
      </Modal>
    </div>
  );
}
