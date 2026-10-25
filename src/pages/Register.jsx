import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import Spinner from '../components/common/Spinner';
import { isEmail, isPhone, minLen, required } from '../utils/validators';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Please enter your name';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid 10-digit mobile number';
    if (!minLen(form.password, 6)) next.password = 'Password must be at least 6 characters';
    if (form.confirm !== form.password) next.confirm = 'Passwords do not match';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await authService.register({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
      });
      toast.success('Account created! Verify the OTP sent to you.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      if (err?.response) {
        toast.error(err.response.data?.message || 'Registration failed');
      } else {
        // Demo fallback: no backend — proceed to OTP step.
        toast.success('Account created (demo). Verify the OTP to continue.');
        navigate('/verify-otp', { state: { email: form.email, demo: true } });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-ink-muted">Join ShopMart to shop faster and track orders.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="name" name="name" className="field pl-10" value={form.name} onChange={update} placeholder="Your name" />
          </div>
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="email" name="email" type="email" className="field pl-10" value={form.email} onChange={update} placeholder="you@example.com" />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="phone">Mobile number</label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="phone" name="phone" className="field pl-10" value={form.phone} onChange={update} placeholder="10-digit mobile" />
          </div>
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="password" name="password" type={showPw ? 'text' : 'password'} className="field px-10" value={form.password} onChange={update} placeholder="At least 6 characters" />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink" aria-label={showPw ? 'Hide password' : 'Show password'}>
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div>
          <label className="label" htmlFor="confirm">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input id="confirm" name="confirm" type={showPw ? 'text' : 'password'} className="field pl-10" value={form.confirm} onChange={update} placeholder="Re-enter password" />
          </div>
          {errors.confirm && <p className="mt-1 text-xs text-red-600">{errors.confirm}</p>}
        </div>

        <button onClick={submit} disabled={submitting} className="btn-primary w-full">
          {submitting ? <Spinner /> : <UserPlus className="h-4 w-4" />}
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{' '}
        <Link to="/login" className="link font-medium">Sign in</Link>
      </p>
    </div>
  );
}
