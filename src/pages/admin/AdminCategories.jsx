import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Tags, Search, List, GitBranch } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '../../services/catalogService';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import ImageUploadField from '../../components/admin/ImageUploadField';
import Pagination from '../../components/common/Pagination';
import CategoryTree from '../../components/admin/CategoryTree';

const slugify = (s) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const EMPTY = { name: '', slug: '', image: '', parentId: '', metaTitle: '', metaDescription: '', metaKeywords: '', active: true };

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [view, setView] = useState('tree'); // 'tree' | 'list'
  const PAGE_SIZE = 10;

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    catalogService.getCategories()
      .then((data) => { if (active) setItems(Array.isArray(data) ? data : data?.content || []); })
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = (parentId = '') => { setEditing(null); setForm({ ...EMPTY, parentId }); setOpen(true); };
  const startEdit = (c) => { setEditing(c); setForm({ ...EMPTY, ...c, parentId: c.parentId || '' }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (editing && String(form.parentId) === String(editing.id)) { toast.error('A category cannot be its own parent'); return; }
    const payload = { ...form, slug: form.slug || slugify(form.name), parentId: form.parentId || null };
    setSaving(true);
    try {
      if (editing) {
        const updated = await catalogService.updateCategory(editing.id, payload);
        setItems((list) => list.map((c) => (c.id === editing.id ? { ...c, ...updated } : c)));
        toast.success('Category updated');
      } else {
        const created = await catalogService.createCategory(payload);
        setItems((list) => [...list, created]);
        toast.success('Category added');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save category');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (items.some((c) => String(c.parentId) === String(toDelete.id))) {
      toast.error('Move or delete its subcategories first');
      return;
    }
    setDeleting(true);
    try {
      await catalogService.deleteCategory(toDelete.id);
      setItems((list) => list.filter((x) => x.id !== toDelete.id));
      toast.success('Category removed');
      setToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete category');
    } finally {
      setDeleting(false);
    }
  };

  // Drag-and-drop reorder/reparent: apply optimistically, then persist each
  // changed row. A failed row is left as-is and reported rather than silently
  // reverting the whole tree.
  const handleReorder = async (changes) => {
    setItems((list) => list.map((c) => {
      const change = changes.find((ch) => String(ch.id) === String(c.id));
      return change ? { ...c, parentId: change.parentId, sortOrder: change.sortOrder } : c;
    }));
    const results = await Promise.allSettled(changes.map((ch) => {
      const item = items.find((c) => String(c.id) === String(ch.id));
      return catalogService.updateCategory(ch.id, { ...item, parentId: ch.parentId, sortOrder: ch.sortOrder });
    }));
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed) toast.error(`${failed} categor${failed === 1 ? 'y' : 'ies'} failed to save the new position`);
  };

  const filtered = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const parentOptions = items.filter((c) => !editing || c.id !== editing.id);

  return (
    <div>
      <AdminPageHeader
        title="Categories"
        subtitle="Organize your catalog into browsable groups. Drag rows in tree view to reorder or nest them."
        action={<button onClick={() => startAdd()} className="btn-primary"><Plus className="h-4 w-4" /> Add category</button>}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="field pl-10" placeholder="Search categories…" />
        </div>
        <div className="flex overflow-hidden rounded-lg border border-slate-200">
          <button onClick={() => setView('tree')} className={`flex items-center gap-1.5 px-3 py-2 text-sm ${view === 'tree' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-50'}`}>
            <GitBranch className="h-4 w-4" /> Tree
          </button>
          <button onClick={() => setView('list')} className={`flex items-center gap-1.5 border-l border-slate-200 px-3 py-2 text-sm ${view === 'list' ? 'bg-brand-50 text-brand-700' : 'text-ink-muted hover:bg-slate-50'}`}>
            <List className="h-4 w-4" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Tags} title="No categories" description="Add your first category." action={<button onClick={() => startAdd()} className="btn-primary">Add category</button>} />
      ) : view === 'tree' ? (
        <div className="card p-3">
          <CategoryTree items={filtered} onEdit={startEdit} onDelete={setToDelete} onAdd={startAdd} onReorder={handleReorder} />
        </div>
      ) : (
        <>
          <AdminTable columns={['Category', 'Parent', 'Slug', '']}>
            {pageItems.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {c.image
                      ? <img src={c.image} alt={c.name} className="h-10 w-10 rounded-lg object-cover" />
                      : <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><Tags className="h-5 w-5" /></span>}
                    <span className="font-medium text-ink">{c.name}</span>
                    {c.active === false && <span className="badge bg-slate-100 text-slate-500">Inactive</span>}
                  </div>
                </td>
                <td className="px-4 py-3 text-ink-muted">{items.find((p) => String(p.id) === String(c.parentId))?.name || '—'}</td>
                <td className="px-4 py-3 text-ink-muted">{c.slug}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(c)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setToDelete(c)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit category' : 'Add category'}
        size="lg"
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input maxLength={50} className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: slugify(e.target.value) }))} />
            <p className="mt-1 text-xs text-ink-muted">{form.name.length}/50</p>
          </div>
          <div>
            <label className="label">Slug</label>
            <input maxLength={100} className="field" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: slugify(e.target.value) }))} />
          </div>
          <div>
            <label className="label">Parent category</label>
            <select className="field" value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))}>
              <option value="">None (top-level)</option>
              {parentOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Image</label>
            <ImageUploadField value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} recommendedSize="400×400px" />
          </div>
          <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Active</span>
              <span className="block text-xs text-ink-muted">Inactive categories are hidden from the storefront.</span>
            </span>
            <input type="checkbox" className="h-5 w-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          </label>

          <div className="border-t border-slate-100 pt-4">
            <p className="mb-3 text-sm font-semibold text-ink">SEO</p>
            <div className="space-y-3">
              <div>
                <label className="label">Meta title</label>
                <input maxLength={70} className="field" value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder={form.name || 'Defaults to category name'} />
              </div>
              <div>
                <label className="label">Meta description</label>
                <textarea rows={2} maxLength={160} className="field resize-none" value={form.metaDescription} onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))} />
              </div>
              <div>
                <label className="label">Meta keywords</label>
                <input className="field" value={form.metaKeywords} onChange={(e) => setForm((f) => ({ ...f, metaKeywords: e.target.value }))} placeholder="comma, separated, keywords" />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Delete category?"
        footer={(
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
            <button onClick={remove} className="btn-danger" disabled={deleting}>{deleting ? 'Deleting…' : 'Delete'}</button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">Delete <span className="font-medium text-ink">{toDelete?.name}</span>? Products in this category may be affected.</p>
      </Modal>
    </div>
  );
}
