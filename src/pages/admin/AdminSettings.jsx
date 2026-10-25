import { useState } from 'react';
import toast from 'react-hot-toast';
import { Store, Truck, CreditCard, Bell, Save } from 'lucide-react';
import Spinner from '../../components/common/Spinner';
import { AdminPageHeader } from '../../components/admin/AdminUI';

function Card({ icon: Icon, title, description, children }) {
  return (
    <section className="card p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <h2 className="font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-ink-muted">{description}</p>}
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </section>
  );
}

function Toggle({ checked, onChange, label, desc }) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
      <span>
        <span className="block text-sm font-medium text-ink">{label}</span>
        {desc && <span className="block text-xs text-ink-muted">{desc}</span>}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-300'}`}
        aria-pressed={checked}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${checked ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </label>
  );
}

export default function AdminSettings() {
  const [saving, setSaving] = useState(false);
  const [store, setStore] = useState({
    name: 'ShopMart',
    email: 'support@shopmart.com',
    phone: '+91 90000 12345',
    currency: 'INR',
    address: 'SG Highway, Ahmedabad, Gujarat 380015',
  });
  const [shipping, setShipping] = useState({ freeThreshold: '999', flatRate: '79' });
  const [notifs, setNotifs] = useState({ orderEmails: true, lowStock: true, newsletter: false });

  const updateStore = (e) => setStore((s) => ({ ...s, [e.target.name]: e.target.value }));
  const updateShipping = (e) => setShipping((s) => ({ ...s, [e.target.name]: e.target.value }));

  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success('Settings saved');
  };

  return (
    <div className="max-w-3xl">
      <AdminPageHeader title="Settings" subtitle="Configure your store preferences." />

      <div className="space-y-5">
        <Card icon={Store} title="Store information" description="Basic details shown across your store.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Store name</label>
              <input name="name" className="field" value={store.name} onChange={updateStore} />
            </div>
            <div>
              <label className="label">Support email</label>
              <input name="email" type="email" className="field" value={store.email} onChange={updateStore} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="field" value={store.phone} onChange={updateStore} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select name="currency" value={store.currency} onChange={updateStore} className="field">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label">Address</label>
              <input name="address" className="field" value={store.address} onChange={updateStore} />
            </div>
          </div>
        </Card>

        <Card icon={Truck} title="Shipping" description="Delivery charges and thresholds.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Free shipping above (₹)</label>
              <input name="freeThreshold" type="number" className="field" value={shipping.freeThreshold} onChange={updateShipping} />
            </div>
            <div>
              <label className="label">Flat shipping rate (₹)</label>
              <input name="flatRate" type="number" className="field" value={shipping.flatRate} onChange={updateShipping} />
            </div>
          </div>
        </Card>

        <Card icon={CreditCard} title="Payment methods" description="Payments are processed securely by Razorpay.">
          <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">Razorpay</p>
                <p className="text-xs text-ink-muted">Cards, UPI, Net Banking &amp; Wallets — all handled in the Razorpay checkout.</p>
              </div>
              <span className="badge bg-emerald-100 text-emerald-700">Enabled</span>
            </div>
          </div>
        </Card>

        <Card icon={Bell} title="Notifications" description="Choose which alerts the store sends.">
          <div className="space-y-3">
            <Toggle checked={notifs.orderEmails} onChange={(v) => setNotifs((n) => ({ ...n, orderEmails: v }))} label="Order confirmation emails" desc="Send customers an email for each order" />
            <Toggle checked={notifs.lowStock} onChange={(v) => setNotifs((n) => ({ ...n, lowStock: v }))} label="Low-stock alerts" desc="Notify admins when stock runs low" />
            <Toggle checked={notifs.newsletter} onChange={(v) => setNotifs((n) => ({ ...n, newsletter: v }))} label="Weekly newsletter" desc="Send a weekly product roundup" />
          </div>
        </Card>

        <div className="flex justify-end pb-4">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
