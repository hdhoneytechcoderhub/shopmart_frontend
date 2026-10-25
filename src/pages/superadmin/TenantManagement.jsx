import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Server, Search, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { tenantService, companyService } from '../../services/superAdminService';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo } from '../../utils/format';

const EMPTY = { companyId: '', subdomain: '', region: 'ap-south-1', status: 'PROVISIONING' };
const STATUS_TONE = { ACTIVE: 'bg-emerald-100 text-emerald-700', PROVISIONING: 'bg-amber-100 text-amber-700', SUSPENDED: 'bg-red-100 text-red-700' };
const REGIONS = ['ap-south-1', 'ap-southeast-1', 'us-east-1', 'eu-west-1'];

export default function TenantManagement() {
  const [items, setItems] = useState([]);
  const [companies, setCompanies] = useState([]);
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
    Promise.all([tenantService.list(), companyService.list()])
      .then(([tenants, comps]) => { setItems(tenants); setCompanies(comps); })
      .catch(() => toast.error('Failed to load tenants'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (t) => { setEditing(t); setForm({ ...EMPTY, ...t }); setOpen(true); };

  const save = async () => {
    if (!form.companyId) { toast.error('Select the owning company'); return; }
    if (!form.subdomain.trim()) { toast.error('Subdomain is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await tenantService.update(editing.id, form);
        toast.success('Tenant updated');
      } else {
        await tenantService.create(form);
        toast.success('Tenant provisioned');
      }
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save tenant');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await tenantService.remove(toDelete.id);
      toast.success('Tenant removed');
      setToDelete(null);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not remove tenant');
    } finally {
      setDeleting(false);
    }
  };

  const companyName = (id) => companies.find((c) => String(c.id) === String(id))?.name || '—';
  const filtered = items.filter((t) => t.subdomain.toLowerCase().includes(q.toLowerCase()) || companyName(t.companyId).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <AdminPageHeader
        title="Tenant Management"
        subtitle="Workspace provisioning — one tenant per company."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add tenant</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>ShopMart runs single-tenant today — there's no tenant-scoping in the database or API yet. This screen models the control plane you'd need once multi-tenancy is built; entries are stored locally until then.</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search tenants…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Server} title="No tenants" description="Provision your first tenant." action={<button onClick={startAdd} className="btn-primary">Add tenant</button>} />
      ) : (
        <AdminTable columns={['Subdomain', 'Company', 'Region', 'Status', 'Created', '']}>
          {filtered.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Server className="h-5 w-5" /></span>
                  <span className="font-medium text-ink">{t.subdomain}.shopmart.example</span>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{companyName(t.companyId)}</td>
              <td className="px-4 py-3 text-ink-muted">{t.region}</td>
              <td className="px-4 py-3"><span className={`badge ${STATUS_TONE[t.status] || STATUS_TONE.PROVISIONING}`}>{t.status}</span></td>
              <td className="px-4 py-3 text-ink-muted">{timeAgo(t.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => startEdit(t)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(t)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit tenant' : 'Add tenant'} footer={(
        <>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
        </>
      )}>
        <div className="space-y-4">
          <div>
            <label className="label">Company</label>
            <select className="field" value={form.companyId} onChange={(e) => setForm((f) => ({ ...f, companyId: e.target.value }))}>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subdomain</label>
            <div className="flex items-center gap-1">
              <input className="field" value={form.subdomain} onChange={(e) => setForm((f) => ({ ...f, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))} />
              <span className="shrink-0 text-sm text-ink-muted">.shopmart.example</span>
            </div>
          </div>
          <div>
            <label className="label">Region</label>
            <select className="field" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PROVISIONING">Provisioning</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Remove tenant?" footer={(
        <>
          <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={remove} disabled={deleting} className="btn-danger">{deleting ? 'Removing…' : 'Remove'}</button>
        </>
      )}>
        <p className="text-sm text-ink-muted">Remove tenant <span className="font-medium text-ink">{toDelete?.subdomain}</span>? This can't be undone.</p>
      </Modal>
    </div>
  );
}
