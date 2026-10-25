import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import { isEmail } from '../utils/validators';
import Spinner from '../components/common/Spinner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!isEmail(email)) { setError('Enter a valid email'); return; }
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-md text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-ink">Check your email</h1>
        <p className="mt-2 text-sm text-ink-muted">
          If an account exists for <span className="font-medium text-ink">{email}</span>, we've sent a link to reset your password.
        </p>
        <Link to="/login" className="btn-primary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        <button onClick={() => setSent(false)} className="mt-3 block w-full text-sm text-ink-muted hover:text-brand-700">Use a different email</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-ink">Forgot password?</h1>
      <p className="mt-1 text-sm text-ink-muted">Enter your email and we'll send you a reset link.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="email" type="email" className="field pl-10" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="you@example.com" />
          </div>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <button onClick={submit} disabled={loading} className="btn-primary w-full">
          {loading ? <Spinner /> : null} {loading ? 'Sending…' : 'Send reset link'}
        </button>
      </div>

      <Link to="/login" className="mt-6 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-brand-700">
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
    </div>
  );
}
