import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import Spinner from '../components/common/Spinner';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const email = params.get('email') || '';

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const next = {};
    if (form.password.length < 8) next.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await authService.resetPassword({ token, email, password: form.password });
      setDone(true);
      toast.success('Password updated');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Reset link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Password updated</h1>
        <p className="mt-2 text-sm text-ink-muted">You can now sign in with your new password.</p>
        <Link to="/login" className="btn-primary mt-6 inline-flex">Go to sign in</Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-ink-muted">Choose a new password for your account.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type={showPw ? 'text' : 'password'} className="field pl-10 pr-10" value={form.password}
              onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setErrors((x) => ({ ...x, password: '' })); }}
              placeholder="At least 8 characters" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink">
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>
        <div>
          <label className="label">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input type={showPw ? 'text' : 'password'} className="field pl-10" value={form.confirm}
              onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setErrors((x) => ({ ...x, confirm: '' })); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Re-enter password" />
          </div>
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
        </div>
        <button onClick={submit} disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : null} {loading ? 'Updating…' : 'Update password'}
        </button>
      </div>

      <Link to="/login" className="mt-6 inline-block text-sm text-ink-muted hover:text-brand-700">← Back to sign in</Link>
    </div>
  );
}
