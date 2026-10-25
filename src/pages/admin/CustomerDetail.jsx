import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ShoppingBag, IndianRupee, Star, LogIn, Calendar, Pencil, Trash2, Plus,
  UserCircle2, CreditCard, Info, AlertCircle,
} from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { getCustomerOrderStats, getCustomerTimeline, computeSegment, SEGMENT_META, customerNotesService, UNAVAILABLE_TIMELINE_SOURCES } from '../../services/customerIntelService';
import Spinner from '../../components/common/Spinner';
import { formatPrice, formatDate, timeAgo, initials } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';

const TIMELINE_ICON = { REGISTRATION: UserCircle2, ORDER: ShoppingBag, PAYMENT: CreditCard };

function InsightCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-ink-muted"><Icon className="h-4 w-4" /><span className="text-xs">{label}</span></div>
      <p className="mt-1 text-xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  );
}

export default function CustomerDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [customer, setCustomer] = useState(null);
  const [orderStats, setOrderStats] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noteDraft, setNoteDraft] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const customers = await analyticsService.getCustomers();
      const found = customers.find((c) => String(c.id) === String(id));
      if (!found) { setCustomer(null); setLoading(false); return; }
      setCustomer(found);
      const [stats, notesList] = await Promise.all([
        getCustomerOrderStats(found),
        customerNotesService.list(id),
      ]);
      // Backend gap noted in customerIntelService: real /admin/customers
      // reports orders/spent as 0 (not tracked on that DTO yet). Prefer the
      // real aggregated order stats when they found anything; otherwise fall
      // back to whatever the directory itself reported (demo mode has real
      // per-customer numbers there).
      const merged = stats.orders > 0 ? stats : { ...stats, orders: found.orders || 0, spent: found.spent || 0, avgOrderValue: found.orders ? Math.round((found.spent || 0) / found.orders) : 0 };
      setOrderStats(merged);
      setTimeline(await getCustomerTimeline(found, merged));
      setNotes(notesList);
    } catch {
      toast.error('Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const saveNote = async () => {
    if (!noteDraft.trim()) return;
    setSavingNote(true);
    try {
      if (editingNoteId) await customerNotesService.update(editingNoteId, noteDraft.trim());
      else await customerNotesService.add(id, noteDraft.trim(), user?.name || 'Admin');
      setNoteDraft('');
      setEditingNoteId(null);
      setNotes(await customerNotesService.list(id));
      toast.success('Note saved');
    } catch {
      toast.error('Could not save note');
    } finally {
      setSavingNote(false);
    }
  };

  const editNote = (n) => { setEditingNoteId(n.id); setNoteDraft(n.body); };
  const removeNote = async (n) => {
    if (!window.confirm('Delete this note?')) return;
    await customerNotesService.remove(n.id);
    setNotes(await customerNotesService.list(id));
  };

  if (loading) return <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>;
  if (!customer) return (
    <div className="py-16 text-center">
      <p className="text-ink-muted">Customer not found.</p>
      <Link to="/admin/customers" className="link mt-2 inline-block">Back to customers</Link>
    </div>
  );

  const segment = computeSegment({ orders: orderStats.orders, spent: orderStats.spent, joined: customer.joined, lastOrderAt: orderStats.lastOrderAt });
  const segMeta = SEGMENT_META[segment];

  return (
    <div>
      <Link to="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"><ArrowLeft className="h-4 w-4" /> Back to customers</Link>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">{initials(customer.name)}</span>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-ink">{customer.name}</h1>
            <span className={`badge ${segMeta.tone}`}>{segMeta.label}</span>
            <span className={`badge ${customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{customer.status}</span>
          </div>
          <p className="text-sm text-ink-muted">{customer.email} · Joined {formatDate(customer.joined)}</p>
        </div>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <InsightCard icon={ShoppingBag} label="Total orders" value={orderStats.orders} />
        <InsightCard icon={IndianRupee} label="Total spend" value={formatPrice(orderStats.spent)} />
        <InsightCard icon={IndianRupee} label="Avg. order value" value={formatPrice(orderStats.avgOrderValue)} />
        <InsightCard icon={Star} label="Review count" value="—" sub="No per-customer reviews endpoint" />
        <InsightCard icon={LogIn} label="Last login" value="—" sub="Not visible from admin view" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Timeline */}
        <section className="card p-6">
          <h2 className="mb-4 font-semibold text-ink">Timeline</h2>
          {timeline.length === 0 ? (
            <p className="text-sm text-ink-muted">No activity recorded yet.</p>
          ) : (
            <ol className="space-y-4 border-l border-slate-200 pl-5">
              {timeline.map((e, i) => {
                const Icon = TIMELINE_ICON[e.type] || Calendar;
                return (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] grid h-5 w-5 place-items-center rounded-full bg-brand-50 text-brand-600 ring-4 ring-white"><Icon className="h-3 w-3" /></span>
                    <p className="text-sm font-medium text-ink">{e.label}</p>
                    {e.meta && <p className="text-xs text-ink-muted">{e.meta}</p>}
                    <p className="text-xs text-ink-muted" title={formatDate(e.at)}>{timeAgo(e.at)}</p>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-5 space-y-1.5 border-t border-slate-100 pt-4">
            {UNAVAILABLE_TIMELINE_SOURCES.map((s) => (
              <p key={s.type} className="flex items-start gap-1.5 text-xs text-ink-muted"><Info className="mt-0.5 h-3 w-3 shrink-0" /> {s.type === 'REVIEW' ? 'Reviews' : 'Login activity'} not shown: {s.reason}</p>
            ))}
          </div>
        </section>

        {/* Notes */}
        <section className="card h-fit p-6">
          <h2 className="mb-1 font-semibold text-ink">Notes</h2>
          <p className="mb-3 flex items-start gap-1.5 text-xs text-amber-700"><AlertCircle className="mt-0.5 h-3 w-3 shrink-0" /> Stored locally — no backend endpoint yet, see delivery notes.</p>
          <div className="space-y-2">
            <textarea rows={3} className="field resize-none" placeholder="Add a note about this customer…" value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={saveNote} disabled={savingNote || !noteDraft.trim()} className="btn-primary h-9 text-sm">
                {editingNoteId ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {editingNoteId ? 'Update note' : 'Add note'}
              </button>
              {editingNoteId && <button onClick={() => { setEditingNoteId(null); setNoteDraft(''); }} className="btn-ghost h-9 text-sm">Cancel</button>}
            </div>
          </div>
          <ul className="mt-4 space-y-3">
            {notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-200 p-3">
                <p className="whitespace-pre-wrap text-sm text-ink">{n.body}</p>
                <div className="mt-1.5 flex items-center justify-between text-xs text-ink-muted">
                  <span>{n.author} · {timeAgo(n.updatedAt || n.createdAt)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => editNote(n)} className="btn-ghost h-6 w-6 p-0" aria-label="Edit note"><Pencil className="h-3 w-3" /></button>
                    <button onClick={() => removeNote(n)} className="btn-ghost h-6 w-6 p-0 text-red-600 hover:bg-red-50" aria-label="Delete note"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              </li>
            ))}
            {notes.length === 0 && <li className="text-sm text-ink-muted">No notes yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
