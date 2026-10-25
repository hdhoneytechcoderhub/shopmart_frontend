import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, CreditCard, IndianRupee, Info, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionService, planService, companyService } from '../../services/superAdminService';
import { AdminPageHeader, AdminTable, StatCard } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { formatPrice, formatDate } from '../../utils/format';

const SUB_STATUS_TONE = { ACTIVE: 'bg-emerald-100 text-emerald-700', PAST_DUE: 'bg-amber-100 text-amber-700', CANCELED: 'bg-slate-100 text-slate-500' };
const EMPTY_SUB = { companyId: '', planId: '', billingCycle: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '', mrr: 0 };
const EMPTY_PLAN = { name: '', priceMonthly: 0, maxAdmins: 5, maxProducts: 500, features: '' };

export default function SubscriptionManagement() {
  const [tab, setTab] = useState('subscriptions');
  const [subs, setSubs] = useState([]);
  const [plans, setPlans] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subOpen, setSubOpen] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subForm, setSubForm] = useState(EMPTY_SUB);
  const [savingSub, setSavingSub] = useState(false);

  const [planOpen, setPlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);
  const [savingPlan, setSavingPlan] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([subscriptionService.list(), planService.list(), companyService.list()])
      .then(([s, p, c]) => { setSubs(s); setPlans(p); setCompanies(c); })
      .catch(() => toast.error('Failed to load subscription data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const companyName = (id) => companies.find((c) => String(c.id) === String(id))?.name || '—';
  const planName = (id) => plans.find((p) => String(p.id) === String(id))?.name || '—';

  const mrrTotal = subs.filter((s) => s.status === 'ACTIVE').reduce((sum, s) => sum + Number(s.mrr || 0), 0);
  const activeCount = subs.filter((s) => s.status === 'ACTIVE').length;
  const pastDueCount = subs.filter((s) => s.status === 'PAST_DUE').length;

  // Subscriptions
  const startAddSub = () => { setEditingSub(null); setSubForm(EMPTY_SUB); setSubOpen(true); };
  const startEditSub = (s) => { setEditingSub(s); setSubForm({ ...EMPTY_SUB, ...s, currentPeriodEnd: s.currentPeriodEnd?.slice(0, 10) || '' }); setSubOpen(true); };
  const saveSub = async () => {
    if (!subForm.companyId || !subForm.planId) { toast.error('Company and plan are required'); return; }
    setSavingSub(true);
    try {
      const payload = { ...subForm, mrr: subForm.billingCycle === 'MONTHLY' ? Number(plans.find((p) => String(p.id) === String(subForm.planId))?.priceMonthly || 0) : Math.round(Number(plans.find((p) => String(p.id) === String(subForm.planId))?.priceMonthly || 0) * 12 * 0.83) };
      if (editingSub) await subscriptionService.update(editingSub.id, payload);
      else await subscriptionService.create(payload);
      toast.success('Subscription saved');
      setSubOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save subscription');
    } finally {
      setSavingSub(false);
    }
  };
  const cancelSub = async (s) => {
    if (!window.confirm(`Cancel the subscription for ${companyName(s.companyId)}?`)) return;
    await subscriptionService.cancel(s.id);
    toast.success('Subscription canceled');
    load();
  };

  // Plans
  const startAddPlan = () => { setEditingPlan(null); setPlanForm(EMPTY_PLAN); setPlanOpen(true); };
  const startEditPlan = (p) => { setEditingPlan(p); setPlanForm({ ...p, features: (p.features || []).join(', ') }); setPlanOpen(true); };
  const savePlan = async () => {
    if (!planForm.name.trim()) { toast.error('Plan name is required'); return; }
    setSavingPlan(true);
    try {
      const payload = { ...planForm, priceMonthly: Number(planForm.priceMonthly) || 0, maxAdmins: Number(planForm.maxAdmins) || 0, maxProducts: Number(planForm.maxProducts) || 0, features: planForm.features.split(',').map((s) => s.trim()).filter(Boolean) };
      if (editingPlan) await planService.update(editingPlan.id, payload);
      else await planService.create(payload);
      toast.success('Plan saved');
      setPlanOpen(false);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save plan');
    } finally {
      setSavingPlan(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Subscription Management"
        subtitle="Plans and per-company subscriptions."
        action={tab === 'subscriptions'
          ? <button onClick={startAddSub} className="btn-primary"><Plus className="h-4 w-4" /> New subscription</button>
          : <button onClick={startAddPlan} className="btn-primary"><Plus className="h-4 w-4" /> New plan</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>No billing backend exists yet (no Razorpay/Stripe subscription objects, no invoicing) — this manages plan/subscription *records* only, stored locally, for the control plane to build against.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={IndianRupee} label="MRR (active subscriptions)" value={formatPrice(mrrTotal)} tone="emerald" />
        <StatCard icon={CreditCard} label="Active subscriptions" value={activeCount} tone="brand" />
        <StatCard icon={XCircle} label="Past due" value={pastDueCount} tone="amber" />
      </div>

      <div className="mb-5 mt-6 flex gap-2">
        <button onClick={() => setTab('subscriptions')} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === 'subscriptions' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>Subscriptions</button>
        <button onClick={() => setTab('plans')} className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === 'plans' ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>Plans</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : tab === 'subscriptions' ? (
        subs.length === 0 ? (
          <EmptyState icon={CreditCard} title="No subscriptions" description="Create one to link a company to a plan." action={<button onClick={startAddSub} className="btn-primary">New subscription</button>} />
        ) : (
          <AdminTable columns={['Company', 'Plan', 'Billing', 'MRR', 'Renews', 'Status', '']}>
            {subs.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 font-medium text-ink">{companyName(s.companyId)}</td>
                <td className="px-4 py-3"><span className="badge bg-brand-50 text-brand-700">{planName(s.planId)}</span></td>
                <td className="px-4 py-3 text-ink-muted">{s.billingCycle === 'MONTHLY' ? 'Monthly' : 'Yearly'}</td>
                <td className="px-4 py-3 font-medium text-ink">{formatPrice(s.mrr)}</td>
                <td className="px-4 py-3 text-ink-muted">{s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : '—'}</td>
                <td className="px-4 py-3"><span className={`badge ${SUB_STATUS_TONE[s.status] || SUB_STATUS_TONE.ACTIVE}`}>{s.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => startEditSub(s)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                    {s.status !== 'CANCELED' && <button onClick={() => cancelSub(s)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Cancel"><XCircle className="h-4 w-4" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          </AdminTable>
        )
      ) : plans.length === 0 ? (
        <EmptyState icon={CreditCard} title="No plans" description="Create your first plan." action={<button onClick={startAddPlan} className="btn-primary">New plan</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <div key={p.id} className="card flex flex-col p-6">
              <div className="flex items-start justify-between">
                <h3 className="font-display text-lg font-bold text-ink">{p.name}</h3>
                <button onClick={() => startEditPlan(p)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
              </div>
              <p className="mt-1 text-2xl font-bold text-ink">{p.priceMonthly ? formatPrice(p.priceMonthly) : 'Free'}<span className="text-sm font-normal text-ink-muted">{p.priceMonthly ? '/mo' : ''}</span></p>
              <ul className="mt-4 flex-1 space-y-1.5 text-sm text-ink-soft">
                <li>Up to {p.maxAdmins} admins</li>
                <li>Up to {p.maxProducts.toLocaleString('en-IN')} products</li>
                {(p.features || []).map((f) => <li key={f}>{f}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}

      <Modal open={subOpen} onClose={() => setSubOpen(false)} title={editingSub ? 'Edit subscription' : 'New subscription'} footer={(
        <>
          <button onClick={() => setSubOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={saveSub} disabled={savingSub} className="btn-primary">{savingSub ? 'Saving…' : 'Save'}</button>
        </>
      )}>
        <div className="space-y-4">
          <div>
            <label className="label">Company</label>
            <select className="field" value={subForm.companyId} onChange={(e) => setSubForm((f) => ({ ...f, companyId: e.target.value }))}>
              <option value="">Select company</option>
              {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Plan</label>
            <select className="field" value={subForm.planId} onChange={(e) => setSubForm((f) => ({ ...f, planId: e.target.value }))}>
              <option value="">Select plan</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Billing cycle</label>
              <select className="field" value={subForm.billingCycle} onChange={(e) => setSubForm((f) => ({ ...f, billingCycle: e.target.value }))}>
                <option value="MONTHLY">Monthly</option>
                <option value="YEARLY">Yearly (−17%)</option>
              </select>
            </div>
            <div>
              <label className="label">Renews on</label>
              <input type="date" className="field" value={subForm.currentPeriodEnd} onChange={(e) => setSubForm((f) => ({ ...f, currentPeriodEnd: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="field" value={subForm.status} onChange={(e) => setSubForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="ACTIVE">Active</option>
              <option value="PAST_DUE">Past due</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title={editingPlan ? 'Edit plan' : 'New plan'} footer={(
        <>
          <button onClick={() => setPlanOpen(false)} className="btn-ghost">Cancel</button>
          <button onClick={savePlan} disabled={savingPlan} className="btn-primary">{savingPlan ? 'Saving…' : 'Save'}</button>
        </>
      )}>
        <div className="space-y-4">
          <div><label className="label">Plan name</label><input className="field" value={planForm.name} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Monthly price (₹, 0 = free)</label><input type="number" className="field" value={planForm.priceMonthly} onChange={(e) => setPlanForm((f) => ({ ...f, priceMonthly: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Max admins</label><input type="number" className="field" value={planForm.maxAdmins} onChange={(e) => setPlanForm((f) => ({ ...f, maxAdmins: e.target.value }))} /></div>
            <div><label className="label">Max products</label><input type="number" className="field" value={planForm.maxProducts} onChange={(e) => setPlanForm((f) => ({ ...f, maxProducts: e.target.value }))} /></div>
          </div>
          <div><label className="label">Features (comma-separated)</label><input className="field" value={planForm.features} onChange={(e) => setPlanForm((f) => ({ ...f, features: e.target.value }))} /></div>
        </div>
      </Modal>
    </div>
  );
}
