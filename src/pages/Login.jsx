import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser, clearAuthError } from '../redux/slices/authSlice';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/common/Spinner';
import { isEmail, required } from '../utils/validators';
import { ROLES } from '../utils/constants';

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { status, error } = useAuth();
  const from = location.state?.from || '/';

  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);

  useEffect(() => () => dispatch(clearAuthError()), [dispatch]);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async () => {
    const next = {};
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (!required(form.password)) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    const result = await dispatch(loginUser(form));
    if (loginUser.fulfilled.match(result)) {
      const user = result.payload;
      toast.success(`Welcome back, ${user.name || 'shopper'}!`);
      if (user.role === ROLES.SUPER_ADMIN) navigate('/superadmin', { replace: true });
      else if (user.role === ROLES.ADMIN) navigate('/admin', { replace: true });
      else navigate(from, { replace: true });
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  const onKey = (e) => e.key === 'Enter' && submit();

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Sign in</h1>
      <p className="mt-1 text-sm text-ink-muted">Welcome back. Enter your details to continue.</p>

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="email" name="email" type="email" value={form.email}
              onChange={update} onKeyDown={onKey}
              className="field pl-10" placeholder="you@example.com"
            />
          </div>
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </div>

        <div>
          <label className="label" htmlFor="password">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="password" name="password" type={showPw ? 'text' : 'password'} value={form.password}
              onChange={update} onKeyDown={onKey}
              className="field px-10" placeholder="••••••••"
            />
            <button
              type="button" onClick={() => setShowPw((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-ink"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="inline-flex items-center gap-2 text-ink-muted">
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="link">Forgot password?</Link>
        </div>

        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button onClick={submit} disabled={status === 'loading'} className="btn-primary w-full">
          {status === 'loading' ? <Spinner /> : <LogIn className="h-4 w-4" />}
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-ink-muted">
        New to ShopMart?{' '}
        <Link to="/register" className="link font-medium">Create an account</Link>
      </p>

      <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-ink-muted">
        Demo mode: any email works. Use an email starting with <span className="font-medium">admin</span> to explore the admin panel.
      </p>
    </div>
  );
}
