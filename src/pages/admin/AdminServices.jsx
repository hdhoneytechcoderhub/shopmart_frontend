import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { serviceManagementService } from '../../services/serviceManagementService';
import { formatPrice } from '../../utils/format';

const EMPTY = { name: '', description: '', price: '', status: 'Active' };

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    serviceManagementService.getServices()
      .then((list) => { if (active) setServices(list); })
      .catch(() => toast.error('Failed to load services'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (s) => { setEditing(s); setForm({ ...s, price: String(s.price) }); setOpen(true); };
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price) || 0 };
      if (editing) {
        const updated = await serviceManagementService.updateService(editing.id, payload);
        setServices((list) => list.map((s) => (s.id === editing.id ? { ...s, ...updated } : s)));
        toast.success('Service updated');
      } else {
        const created = await serviceManagementService.createService(payload);
        setServices((list) => [created, ...list]);
        toast.success('Service added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save service');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await serviceManagementService.deleteService(toDelete.id);
      setServices((list) => list.filter((s) => s.id !== toDelete.id));
      toast.success('Service deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete service');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Service Management"
        subtitle="Manage services offered to customers."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add Service</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : services.length === 0 ? (
        <EmptyState icon={Wrench} title="No services" description="Add your first service offering." action={<button onClick={startAdd} className="btn-primary">Add Service</button>} />
      ) : (
        <AdminTable columns={['Service', 'Description', 'Price', 'Status', '']}>
          {services.map((s) => (
            <tr key={s.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{s.name}</td>
              <td className="px-4 py-3 text-ink-muted max-w-xs truncate">{s.description || '—'}</td>
              <td className="px-4 py-3 font-medium text-ink">{s.price ? formatPrice(s.price) : '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${s.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{s.status}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => startEdit(s)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(s)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit service' : 'Add service'}
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add service'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Service name *</label>
            <input name="name" className="field" value={form.name} onChange={update} placeholder="e.g. Express Delivery" />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="field" rows={2} value={form.description} onChange={update} placeholder="Brief description of the service" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Price (₹)</label>
              <input name="price" type="number" min="0" className="field" value={form.price} onChange={update} placeholder="0" />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="field" value={form.status} onChange={update}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete service?"
        footer={(
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
            <button onClick={remove} className="btn-danger" disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">Delete <span className="font-medium text-ink">{toDelete?.name}</span>? This can't be undone.</p>
      </Modal>
    </div>
  );
}
