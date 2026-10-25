import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Cpu } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { machineService } from '../../services/machineService';

const EMPTY = { name: '', model: '', status: 'Active', location: '', purchaseDate: '' };
const STATUS_COLORS = {
  Active: 'bg-emerald-100 text-emerald-700',
  Maintenance: 'bg-amber-100 text-amber-700',
  Inactive: 'bg-slate-200 text-slate-600',
};

export default function AdminMachines() {
  const [machines, setMachines] = useState([]);
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
    machineService.getMachines()
      .then((list) => { if (active) setMachines(list); })
      .catch(() => toast.error('Failed to load machines'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (m) => { setEditing(m); setForm(m); setOpen(true); };
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await machineService.updateMachine(editing.id, form);
        setMachines((list) => list.map((m) => (m.id === editing.id ? { ...m, ...updated } : m)));
        toast.success('Machine updated');
      } else {
        const created = await machineService.createMachine(form);
        setMachines((list) => [created, ...list]);
        toast.success('Machine added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save machine');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await machineService.deleteMachine(toDelete.id);
      setMachines((list) => list.filter((m) => m.id !== toDelete.id));
      toast.success('Machine deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete machine');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Machine Management"
        subtitle="Track and manage all machines."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add Machine</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : machines.length === 0 ? (
        <EmptyState icon={Cpu} title="No machines" description="Add your first machine." action={<button onClick={startAdd} className="btn-primary">Add Machine</button>} />
      ) : (
        <AdminTable columns={['Machine', 'Model', 'Location', 'Purchase Date', 'Status', '']}>
          {machines.map((m) => (
            <tr key={m.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{m.name}</td>
              <td className="px-4 py-3 text-ink-soft">{m.model || '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{m.location || '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{m.purchaseDate || '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${STATUS_COLORS[m.status] || 'bg-slate-100 text-slate-600'}`}>{m.status}</span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => startEdit(m)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(m)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit machine' : 'Add machine'}
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Add machine'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Machine name *</label>
            <input name="name" className="field" value={form.name} onChange={update} placeholder="e.g. CNC Milling Machine" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Model</label>
              <input name="model" className="field" value={form.model} onChange={update} placeholder="e.g. CM-3000" />
            </div>
            <div>
              <label className="label">Location</label>
              <input name="location" className="field" value={form.location} onChange={update} placeholder="e.g. Unit A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Purchase Date</label>
              <input name="purchaseDate" type="date" className="field" value={form.purchaseDate} onChange={update} />
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" className="field" value={form.status} onChange={update}>
                <option>Active</option>
                <option>Maintenance</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete machine?"
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
