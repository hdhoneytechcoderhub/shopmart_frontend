import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, FileText, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { blogService } from '../../services/blogService';
import { formatDate } from '../../utils/format';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';

const EMPTY = { title: '', author: '', status: 'Draft', excerpt: '', content: '' };

export default function AdminBlogs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    blogService.list()
      .then((data) => { if (active) setItems(Array.isArray(data) ? data : data?.content || []); })
      .catch(() => toast.error('Failed to load posts'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (b) => { setEditing(b); setForm({ content: '', excerpt: '', ...b }); setOpen(true); };
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!form.content.trim()) { toast.error('Content is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const updated = await blogService.update(editing.id, form);
        setItems((list) => list.map((b) => (b.id === editing.id ? { ...b, ...updated } : b)));
        toast.success('Post updated');
      } else {
        const created = await blogService.create(form);
        setItems((list) => [...list, created]);
        toast.success('Post created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save the post');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (b) => {
    try {
      await blogService.remove(b.id);
      setItems((list) => list.filter((x) => x.id !== b.id));
      toast.success('Post removed');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the post');
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Blog posts"
        subtitle="Write and manage editorial content."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> New post</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
      <AdminTable columns={['Title', 'Author', 'Date', 'Status', '']}>
        {items.map((b) => (
          <tr key={b.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-600"><FileText className="h-5 w-5" /></span>
                <span className="font-medium text-ink">{b.title}</span>
              </div>
            </td>
            <td className="px-4 py-3 text-ink-soft">{b.author}</td>
            <td className="px-4 py-3 text-ink-muted">{formatDate(b.date)}</td>
            <td className="px-4 py-3">
              <span className={`badge ${b.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {b.status}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <button onClick={() => setPreviewing(b)} className="btn-ghost h-8 w-8 p-0" aria-label="Preview"><Eye className="h-4 w-4" /></button>
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
        title={editing ? 'Edit post' : 'New post'}
        size="lg"
        footer={(
          <>
            <button onClick={() => setPreviewing(form)} className="btn-outline">Preview</button>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Title</label>
            <input name="title" className="field" value={form.title} onChange={update} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Author</label>
              <input name="author" className="field" value={form.author} onChange={update} />
              <p className="mt-1 text-xs text-ink-muted">Display-only for now — the backend attributes posts to the logged-in admin, not this field.</p>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={update} className="field">
                <option>Draft</option>
                <option>Published</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Excerpt</label>
            <textarea name="excerpt" rows={2} className="field resize-none" value={form.excerpt} onChange={update} placeholder="Short summary…" />
          </div>
          <div>
            <label className="label">Content</label>
            <textarea name="content" rows={8} className="field resize-none" value={form.content} onChange={update} placeholder="Full post content…" />
          </div>
        </div>
      </Modal>

      {/* Preview — approximates how the post reads on the public blog */}
      <Modal open={!!previewing} onClose={() => setPreviewing(null)} title="Preview" size="lg"
        footer={<button onClick={() => setPreviewing(null)} className="btn-ghost">Close</button>}>
        {previewing && (
          <article className="prose prose-slate max-w-none">
            {previewing.coverImage && <img src={previewing.coverImage} alt="" className="mb-4 aspect-video w-full rounded-xl object-cover" />}
            <span className={`badge mb-2 inline-block ${previewing.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {previewing.status || 'Draft'}
            </span>
            <h1 className="mb-1 text-2xl font-bold text-ink">{previewing.title || 'Untitled post'}</h1>
            <p className="mb-4 text-sm text-ink-muted">By {previewing.author || 'ShopMart Team'} · {formatDate(previewing.date || Date.now())}</p>
            {previewing.excerpt && <p className="mb-4 text-base italic text-ink-soft">{previewing.excerpt}</p>}
            <div className="whitespace-pre-wrap text-ink-soft">{previewing.content || 'No content yet.'}</div>
          </article>
        )}
      </Modal>
    </div>
  );
}
