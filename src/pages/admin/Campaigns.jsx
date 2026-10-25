import { useEffect, useState, useCallback } from 'react';
import { Plus, Send, Trash2, Radio, Search, Info, Users, CheckCircle2, MousePointerClick, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignService, notifTemplateService } from '../../services/notificationAdminService';
import { AdminPageHeader, AdminTable, StatCard } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo, formatDateTime } from '../../utils/format';

const STATUS_TONE = { DRAFT: 'bg-slate-100 text-slate-500', SCHEDULED: 'bg-amber-100 text-amber-700', SENT: 'bg-emerald-100 text-emerald-700', SENDING: 'bg-blue-100 text-blue-700' };
const AUDIENCE_LABEL = { ALL: 'All customers', NEW_CUSTOMERS: 'New customers', ACTIVE_CUSTOMERS: 'Active customers', ADMINS: 'Admins' };
const EMPTY = { name: '', templateId: '', channel: 'IN_APP', audience: 'ALL' };

export default function Campaigns() {
  const [items, setItems] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [statsFor, setStatsFor] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([campaignService.list(), notifTemplateService.list()])
      .then(([c, t]) => { setItems(c); setTemplates(t); })
      .catch(() => toast.error('Failed to load campaigns'))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => load(), [load]);

  const startNew = () => { setForm(EMPTY); setOpen(true); };
  const templateName = (id) => templates.find((t) => String(t.id) === String(id))?.name || '—';

  const onTemplateChange = (templateId) => {
    const tpl = templates.find((t) => String(t.id) === String(templateId));
    setForm((f) => ({ ...f, templateId, channel: tpl?.channel || f.channel, name: f.name || (tpl ? `${tpl.name} campaign` : f.name) }));
  };

  const saveDraft = async () => {
    if (!form.name.trim() || !form.templateId) { toast.error('Name and template are required'); return; }
    setSaving(true);
    try {
      await campaignService.createDraft(form);
      toast.success('Draft saved');
      setOpen(false);
      load();
    } catch {
      toast.error('Could not save draft');
    } finally {
      setSaving(false);
    }
  };

  const sendNowFromModal = async () => {
    if (!form.name.trim() || !form.templateId) { toast.error('Name and template are required'); return; }
    setSaving(true);
    try {
      await campaignService.createAndSendNow(form);
      toast.success('Broadcast sent');
      setOpen(false);
      load();
    } catch {
      toast.error('Could not send broadcast');
    } finally {
      setSaving(false);
    }
  };

  const send = async (c) => {
    if (!window.confirm(`Send "${c.name}" now to ${AUDIENCE_LABEL[c.audience]}?`)) return;
    setSendingId(c.id);
    try {
      await campaignService.sendNow(c.id);
      toast.success('Campaign sent');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not send campaign');
    } finally {
      setSendingId(null);
    }
  };

  const remove = async () => {
    await campaignService.remove(toDelete.id);
    toast.success('Campaign deleted');
    setToDelete(null);
    load();
  };

  const filtered = items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
  const totalSent = items.filter((c) => c.status === 'SENT').reduce((sum, c) => sum + (c.stats?.sent || 0), 0);
  const avgOpenRate = (() => {
    const sent = items.filter((c) => c.status === 'SENT' && c.stats?.delivered);
    if (!sent.length) return 0;
    return Math.round(sent.reduce((sum, c) => sum + c.stats.opened / c.stats.delivered, 0) / sent.length * 100);
  })();

  return (
    <div>
      <AdminPageHeader
        title="Campaigns & Broadcasts"
        subtitle="Send templates to a customer audience and track delivery."
        action={<button onClick={startNew} className="btn-primary"><Plus className="h-4 w-4" /> New campaign</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Delivery stats (delivered/opened/clicked) are simulated — there's no real email/push gateway wired up yet to report actual engagement. The send flow and audience targeting are fully functional; only the telemetry is illustrative.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Send} label="Total sent (all campaigns)" value={totalSent.toLocaleString('en-IN')} tone="brand" />
        <StatCard icon={MousePointerClick} label="Avg. open rate" value={`${avgOpenRate}%`} tone="emerald" />
        <StatCard icon={Radio} label="Campaigns" value={items.length} tone="purple" />
      </div>

      <div className="relative my-4 max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search campaigns…" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Radio} title="No campaigns" description="Create your first campaign or broadcast." action={<button onClick={startNew} className="btn-primary">New campaign</button>} />
      ) : (
        <AdminTable columns={['Campaign', 'Template', 'Audience', 'Status', 'Sent', '']}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{c.name}</td>
              <td className="px-4 py-3 text-ink-soft">{templateName(c.templateId)}</td>
              <td className="px-4 py-3 text-ink-muted">{AUDIENCE_LABEL[c.audience]}</td>
              <td className="px-4 py-3"><span className={`badge ${STATUS_TONE[c.status]}`}>{c.status}</span></td>
              <td className="px-4 py-3 text-ink-muted">{c.sentAt ? timeAgo(c.sentAt) : '—'}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  {c.status === 'SENT' && <button onClick={() => setStatsFor(c)} className="btn-ghost h-8 text-xs">Stats</button>}
                  {c.status !== 'SENT' && (
                    <button onClick={() => send(c)} disabled={sendingId === c.id} className="btn-ghost h-8 w-8 p-0 text-brand-600 hover:bg-brand-50" aria-label="Send now">
                      {sendingId === c.id ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                    </button>
                  )}
                  <button onClick={() => setToDelete(c)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* New campaign / broadcast */}
      <Modal open={open} onClose={() => setOpen(false)} title="New campaign" footer={(
        <>
          <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={saveDraft} disabled={saving} className="btn-outline">Save as draft</button>
          <button onClick={sendNowFromModal} disabled={saving} className="btn-primary"><Send className="h-4 w-4" /> {saving ? 'Sending…' : 'Send now'}</button>
        </>
      )}>
        <div className="space-y-4">
          <div>
            <label className="label">Campaign name</label>
            <input className="field" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Template</label>
            <select className="field" value={form.templateId} onChange={(e) => onTemplateChange(e.target.value)}>
              <option value="">Select template</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.channel})</option>)}
            </select>
          </div>
          <div>
            <label className="label">Audience</label>
            <select className="field" value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value }))}>
              {campaignService.AUDIENCES.map((a) => <option key={a} value={a}>{AUDIENCE_LABEL[a]}</option>)}
            </select>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Users className="h-3.5 w-3.5" /> "Send now" broadcasts immediately; "Save as draft" lets you come back and send later.</p>
        </div>
      </Modal>

      {/* Delivery stats */}
      <Modal open={!!statsFor} onClose={() => setStatsFor(null)} title={statsFor?.name} footer={<button onClick={() => setStatsFor(null)} className="btn-ghost">Close</button>}>
        {statsFor?.stats && (
          <div className="space-y-4">
            <p className="text-xs text-ink-muted">Sent {formatDateTime(statsFor.sentAt)} to {AUDIENCE_LABEL[statsFor.audience]}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Users className="h-3.5 w-3.5" /> Audience</p>
                <p className="text-lg font-bold text-ink">{statsFor.stats.audienceSize.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted"><CheckCircle2 className="h-3.5 w-3.5" /> Delivered</p>
                <p className="text-lg font-bold text-ink">{statsFor.stats.delivered.toLocaleString('en-IN')} <span className="text-xs font-normal text-ink-muted">({Math.round(statsFor.stats.delivered / statsFor.stats.audienceSize * 100)}%)</span></p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted"><Clock className="h-3.5 w-3.5" /> Opened</p>
                <p className="text-lg font-bold text-ink">{statsFor.stats.opened.toLocaleString('en-IN')} <span className="text-xs font-normal text-ink-muted">({Math.round(statsFor.stats.opened / statsFor.stats.delivered * 100)}%)</span></p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="flex items-center gap-1.5 text-xs text-ink-muted"><MousePointerClick className="h-3.5 w-3.5" /> Clicked</p>
                <p className="text-lg font-bold text-ink">{statsFor.stats.clicked.toLocaleString('en-IN')} <span className="text-xs font-normal text-ink-muted">({Math.round(statsFor.stats.clicked / statsFor.stats.delivered * 100)}%)</span></p>
              </div>
            </div>
            {statsFor.stats.failed > 0 && (
              <p className="flex items-center gap-1.5 text-xs text-red-600"><XCircle className="h-3.5 w-3.5" /> {statsFor.stats.failed} failed to deliver</p>
            )}
          </div>
        )}
      </Modal>

      <Modal open={!!toDelete} onClose={() => setToDelete(null)} title="Delete campaign?" footer={(
        <>
          <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
          <button onClick={remove} className="btn-danger">Delete</button>
        </>
      )}>
        <p className="text-sm text-ink-muted">Delete <span className="font-medium text-ink">{toDelete?.name}</span>? This removes its send history too.</p>
      </Modal>
    </div>
  );
}
