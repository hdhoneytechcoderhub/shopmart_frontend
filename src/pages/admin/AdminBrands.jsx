import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '../../services/catalogService';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import ImageUploadField from '../../components/admin/ImageUploadField';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const EMPTY = { name: '', slug: '', logo: '' };

export default function AdminBrands() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    catalogService.getBrands()
      .then((data) => { if (active) setItems(Array.isArray(data) ? data : data?.content || []); })
      .catch(() => toast.error('Failed to load brands'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (b) => { setEditing(b); setForm(b); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    const payload = { ...form, slug: form.slug || slugify(form.name) };
    setSaving(true);
    try {
      if (editing) {
        const updated = await catalogService.updateBrand(editing.id, payload);
        setItems((list) => list.map((b) => (b.id === editing.id ? { ...b, ...updated } : b)));
        toast.success('Brand updated');
      } else {
        const created = await catalogService.createBrand(payload);
        setItems((list) => [...list, created]);
        toast.success('Brand added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the brand');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    try {
      await catalogService.deleteBrand(b.id);
      setItems((list) => list.filter((x) => x.id !== b.id));
      toast.success('Brand removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the brand');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Brands"
        subtitle="Manage the brands available in your store."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add brand</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
        <AdminTable columns={['Brand', 'Slug', '']}>
          {items.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {b.logo
                    ? <img src={b.logo} alt={b.name} className="h-10 w-10 rounded-lg object-cover" />
                    : <span className="grid h-10 w-10 place-items-center rounded-lg bg-accent-50 text-accent-600"><Award className="h-5 w-5" /></span>}
                  <span className="font-medium text-ink">{b.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-muted">{b.slug}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => startEdit(b)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => remove(b)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit brand' : 'Add brand'}
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="field" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Logo</label>
            <ImageUploadField value={form.logo} onChange={(url) => setForm((f) => ({ ...f, logo: url }))} recommendedSize="300×300px" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
