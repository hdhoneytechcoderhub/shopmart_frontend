import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Globe, ShieldCheck, ClipboardCheck, Wrench, Save, Layers } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';
import { platformSettingsService } from '../../services/superAdminService';

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="card p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
        <div className="flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Toggle({ on, onChange, label, desc }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
      <span><span className="block text-sm font-medium text-ink">{label}</span>{desc && <span className="block text-xs text-ink-muted">{desc}</span>}</span>
      <button type="button" onClick={() => onChange(!on)} aria-pressed={on}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [general, setGeneral] = useState({ platformName: 'ShopMart', supportEmail: 'support@shopmart.com', currency: 'INR' });
  const [flags, setFlags] = useState({ maintenance: false, registrationOpen: true, requireProductApproval: true, adminAttendance: true, twoFactor: false });
  const [saas, setSaas] = useState({ selfServiceSignup: false, trialDays: 14, enforceplanLimits: true, multiTenantMode: false });

  useEffect(() => {
    platformSettingsService.get()
      .then((s) => { setGeneral(s.general); setFlags(s.flags); setSaas(s.saas); })
      .finally(() => setLoading(false));
  }, []);

  const updateGeneral = (e) => setGeneral((g) => ({ ...g, [e.target.name]: e.target.value }));
  const setFlag = (k) => (v) => setFlags((f) => ({ ...f, [k]: v }));
  const setSaasFlag = (k) => (v) => setSaas((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await platformSettingsService.save({ general, flags, saas });
      toast.success('Platform settings saved');
    } catch {
      toast.error('Could not save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Platform Settings" subtitle="Platform-wide configuration — persists across sessions." />

      <div className="space-y-5">
        <Card icon={Globe} title="General" description="Core platform details.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Platform name</label><input name="platformName" className="field" value={general.platformName} onChange={updateGeneral} /></div>
            <div><label className="label">Support email</label><input name="supportEmail" type="email" className="field" value={general.supportEmail} onChange={updateGeneral} /></div>
            <div>
              <label className="label">Default currency</label>
              <select name="currency" value={general.currency} onChange={updateGeneral} className="field">
                <option value="INR">INR (₹)</option><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>
        </Card>

        <Card icon={ClipboardCheck} title="Catalog & moderation" description="Control how products go live.">
          <div className="space-y-3">
            <Toggle on={flags.requireProductApproval} onChange={setFlag('requireProductApproval')} label="Require product approval" desc="New/edited products need Super Admin approval before going live" />
            <Toggle on={flags.registrationOpen} onChange={setFlag('registrationOpen')} label="Customer registration open" desc="Allow new customers to sign up" />
          </div>
        </Card>

        <Card icon={ShieldCheck} title="Security & access" description="Admin access controls.">
          <div className="space-y-3">
            <Toggle on={flags.twoFactor} onChange={setFlag('twoFactor')} label="Require 2FA for admins" desc="Enforce two-factor authentication for all admin accounts" />
            <Toggle on={flags.adminAttendance} onChange={setFlag('adminAttendance')} label="Track admin attendance" desc="Record admin login/logout and working hours" />
          </div>
        </Card>

        <Card icon={Layers} title="SaaS controls" description="Platform-level controls for the multi-company control plane (see Company/Tenant/Subscription Management).">
          <div className="space-y-3">
            <Toggle on={saas.selfServiceSignup} onChange={setSaasFlag('selfServiceSignup')} label="Self-service company signup" desc="Allow new companies to sign up without Super Admin creating them manually" />
            <Toggle on={saas.enforceplanLimits} onChange={setSaasFlag('enforceplanLimits')} label="Enforce plan limits" desc="Block actions (e.g. adding admins/products) once a company exceeds its plan" />
            <Toggle on={saas.multiTenantMode} onChange={setSaasFlag('multiTenantMode')} label="Multi-tenant mode" desc="Not yet functional — no tenant-scoping exists in the backend. Toggling this only affects local UI state." />
            <div>
              <label className="label">Default trial length (days)</label>
              <input type="number" min="0" className="field max-w-[160px]" value={saas.trialDays} onChange={(e) => setSaas((s) => ({ ...s, trialDays: Number(e.target.value) || 0 }))} />
            </div>
          </div>
        </Card>

        <Card icon={Wrench} title="Maintenance" description="Take the storefront offline temporarily.">
          <Toggle on={flags.maintenance} onChange={setFlag('maintenance')} label="Maintenance mode" desc="Show a maintenance page to customers; admins keep access" />
        </Card>

        <div className="flex justify-end pb-4">
          <button onClick={save} disabled={saving} className="btn-primary">{saving ? <Spinner /> : <Save className="h-4 w-4" />}{saving ? 'Saving…' : 'Save settings'}</button>
        </div>
      </div>
    </div>
  );
}
