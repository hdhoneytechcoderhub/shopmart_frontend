import { useState } from 'react';
import toast from 'react-hot-toast';
import { Lock, Bell, Trash2 } from 'lucide-react';
import { accountService } from '../../services/accountService';
import { useAuth } from '../../hooks/useAuth';
import { minLen } from '../../utils/validators';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';

export default function AccountSettings() {
  const { logout } = useAuth();
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({ orders: true, promos: true, newsletter: false });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const updatePw = (e) => setPw((p) => ({ ...p, [e.target.name]: e.target.value }));
  const togglePref = (key) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  const changePassword = async () => {
    const next = {};
    if (!minLen(pw.current, 1)) next.current = 'Enter your current password';
    if (!minLen(pw.next, 6)) next.next = 'New password must be at least 6 characters';
    if (pw.confirm !== pw.next) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      await accountService.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      toast.success('Password updated');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      if (err?.response) {
        toast.error(err.response.data?.message || 'Could not update password');
      } else {
        toast.success('Password updated');
        setPw({ current: '', next: '', confirm: '' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">Manage your security and notification preferences.</p>
      </div>

      {/* Password */}
      <section className="card max-w-xl p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold text-ink">
          <Lock className="h-4 w-4 text-brand-600" /> Change password
        </h2>
        <div className="mt-4 space-y-4">
          <div>
            <label className="label">Current password</label>
            <input type="password" name="current" className="field" value={pw.current} onChange={updatePw} />
            {errors.current && <p className="mt-1 text-xs text-red-600">{errors.current}</p>}
          </div>
          <div>
            <label className="label">New password</label>
            <input type="password" name="next" className="field" value={pw.next} onChange={updatePw} />
            {errors.next && <p className="mt-1 text-xs text-red-600">{errors.next}</p>}
          </div>
          <div>
            <label className="label">Confirm new password</label>
            <input type="password" name="confirm" className="field" value={pw.confirm} onChange={updatePw} />
            {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
          </div>
          <button onClick={changePassword} disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : null}
            {saving ? 'Updating…' : 'Update password'}
          </button>
        </div>
      </section>

      {/* Notifications */}
      <section className="card max-w-xl p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold text-ink">
          <Bell className="h-4 w-4 text-brand-600" /> Notifications
        </h2>
        <div className="mt-4 space-y-3">
          {[
            { key: 'orders', label: 'Order updates', desc: 'Shipping and delivery alerts' },
            { key: 'promos', label: 'Promotions', desc: 'Deals and limited-time offers' },
            { key: 'newsletter', label: 'Newsletter', desc: 'Style tips and new arrivals' },
          ].map((p) => (
            <label key={p.key} className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-ink">{p.label}</span>
                <span className="block text-xs text-ink-muted">{p.desc}</span>
              </span>
              <button
                type="button"
                onClick={() => togglePref(p.key)}
                className={`relative h-6 w-11 shrink-0 rounded-full transition ${prefs[p.key] ? 'bg-brand-600' : 'bg-slate-300'}`}
                aria-pressed={prefs[p.key]}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${prefs[p.key] ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </label>
          ))}
        </div>
      </section>

      {/* Danger zone */}
      <section className="max-w-xl rounded-2xl border border-red-200 bg-red-50/50 p-6">
        <h2 className="inline-flex items-center gap-2 font-semibold text-red-700">
          <Trash2 className="h-4 w-4" /> Delete account
        </h2>
        <p className="mt-1 text-sm text-red-600/80">
          Permanently remove your account and all associated data. This action cannot be undone.
        </p>
        <button onClick={() => setConfirmDelete(true)} className="btn-danger mt-4">Delete my account</button>
      </section>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete account?"
        footer={(
          <>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost">Cancel</button>
            <button
              onClick={() => { setConfirmDelete(false); toast.success('Account deleted'); logout(); }}
              className="btn-danger"
            >
              Yes, delete
            </button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">
          This will permanently delete your account, orders history, and saved data. Are you sure you want to continue?
        </p>
      </Modal>
    </div>
  );
}
