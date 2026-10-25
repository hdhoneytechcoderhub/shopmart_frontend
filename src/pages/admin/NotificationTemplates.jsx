import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, Mail, Bell, Smartphone, Search, Info, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import { notifTemplateService, renderTemplate, SAMPLE_CONTEXT } from '../../services/notificationAdminService';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo } from '../../utils/format';

const CHANNEL_META = {
  IN_APP: { label: 'In-app', icon: Bell, tone: 'bg-brand-50 text-brand-700' },
  EMAIL: { label: 'Email', icon: Mail, tone: 'bg-blue-50 text-blue-700' },
  PUSH: { label: 'Push', icon: Smartphone, tone: 'bg-purple-50 text-purple-700' },
};
const CATEGORIES = ['ORDER', 'OFFER', 'ACCOUNT', 'UPDATES'];
const VARIABLES = Object.keys(SAMPLE_CONTEXT);
const EMPTY = { name: '', channel: 'IN_APP', category: 'UPDATES', subject: '', title: '', body: '' };

function VariableChips({ onInsert }) {
  return (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {VARIABLES.map((v) => (
        <button key={v} type="button" onClick={() => onInsert(v)} className="rounded-full border border-slate-200 px-2 py-0.5 text-xs text-ink-soft hover:border-brand-300 hover:text-brand-700">
          {`{{${v}}}`}
        </button>
      ))}
    </div>
  );
}

function PreviewPane({ form }) {
  const subject = renderTemplate(form.subject, SAMPLE_CONTEXT);
  const title = renderTemplate(form.title, SAMPLE_CONTEXT);
  const body = renderTemplate(form.body, SAMPLE_CONTEXT);

  if (form.channel === 'EMAIL') {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="border-b border-slate-100 pb-2 text-xs text-ink-muted">Subject: <span className="font-medium text-ink">{subject || '—'}</span></p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft">{body || 'Email body preview…'}</p>
      </div>
    );
  }
  if (form.channel === 'PUSH') {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-ink-muted"><span className="grid h-4 w-4 place-items-center rounded bg-brand-600 text-[8px] font-bold text-white">S</span> ShopMart · now</div>
          <p className="mt-1 text-sm font-semibold text-ink">{title || 'Push title preview'}</p>
          <p className="text-sm text-ink-soft line-clamp-2">{body || 'Push body preview…'}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Bell className="h-4 w-4" /></span>
      <div>
        <p className="text-sm font-medium text-ink">{title || 'In-app title preview'}</p>
        <p className="text-sm text-ink-muted">{body || 'In-app body preview…'}</p>
      </div>
    </div>
  );
}

export default function NotificationTemplates() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    notifTemplateService.list().then(setItems).catch(() => toast.error('Failed to load templates')).finally(() => setLoading(false));
  }, []);
  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setOpen(true); };
  const startEdit = (t) => { setEditing(t); setForm({ ...EMPTY, ...t }); setOpen(true); };

  const save = async () => {
    if (!form.name.trim()) { toast.error('Template name is required'); return; }
    if (!form.body.trim()) { toast.error('Body is required'); return; }
    if (form.channel === 'EMAIL' && !form.subject.trim()) { toast.error('Email templates need a subject'); return; }
    setSaving(true);
    try {
      if (editing) await notifTemplateService.update(editing.id, form);
      else await notifTemplateService.create(form);
      toast.success('Template saved');
      setOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save template');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    try {
      await notifTemplateService.remove(toDelete.id);
      toast.success('Template deleted');
      setToDelete(null);
      load();
    } catch {
      toast.error('Could not delete template');
    }
  };

  const filtered = items.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <AdminPageHeader
        title="Notification Templates"
        subtitle="Reusable content for in-app, email, and push notifications."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> New template</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>No email/push provider is wired up on the backend yet (no SendGrid/FCM/etc. integration) — templates are fully manageable here and used by Campaigns, but actual delivery is simulated. See the delivery notes for what the backend needs.</p>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search templates…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No templates" description="Create your first notification template." action={<button onClick={startAdd} className="btn-primary">New template</button>} />
      ) : (
        <AdminTable columns={['Template', 'Channel', 'Category', 'Updated', '']}>
          {filtered.map((t) => {
            const meta = CHANNEL_META[t.channel];
            return (
              <tr key={t.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-ink">{t.name}</td>
                <td className="px-4 py-3"><span className={`badge inline-flex items-center gap-1 ${meta.tone}`}><meta.icon className="h-3 w-3" /> {meta.label}</span></td>
                <td className="px-4 py-3 text-ink-muted">{t.category}</td>
                <td className="px-4 py-3 text-ink-muted">{timeAgo(t.updatedAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEdit(t)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setToDelete(t)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit template' : 'New template'} size="xl" footer={(
        <>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
        </>
      )}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="label">Template name</label>
              <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Channel</label>
                <select className="field" value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))}>
                  {Object.entries(CHANNEL_META).map(([k, m]) => <option key={k} value={k}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Category</label>
                <select className="field" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {form.channel === 'EMAIL' && (
              <div>
                <label className="label">Subject line</label>
                <input className="field" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
                <VariableChips onInsert={(v) => setForm((f) => ({ ...f, subject: f.subject + `{{${v}}}` }))} />
              </div>
            )}
            {form.channel !== 'EMAIL' && (
              <div>
                <label className="label">Title</label>
                <input className="field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
            )}
            <div>
              <label className="label">Body</label>
              <textarea rows={6} className="field resize-none" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
              <VariableChips onInsert={(v) => setForm((f) => ({ ...f, body: f.body + `{{${v}}}` }))} />
            </div>
          </div>
          <div>
            <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink"><Eye className="h-4 w-4" /> Live preview</p>
            <PreviewPane form={form} />
            <p className="mt-2 text-xs text-ink-muted">Previewed with sample data: {SAMPLE_CONTEXT.customerName}, order {SAMPLE_CONTEXT.orderId}.</p>
          </div>
        </div>
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete template?" footer={(
        <>
          <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={remove} className="btn-danger">Delete</button>
        </>
      )}>
        <p className="text-sm text-ink-muted">Delete <span className="font-medium text-ink">{toDelete?.name}</span>? Campaigns using it will keep their sent history but can't reference it for new sends.</p>
      </Modal>
    </div>
  );
}
