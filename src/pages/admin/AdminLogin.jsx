import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Store, Lock, Mail, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { loginUser } from '../../redux/slices/authSlice';
import { isEmail, required } from '../../utils/validators';
import { ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';

export default function AdminLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: 'admin@shopmart.com',
    password: '',
    remember: true,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const submit = async () => {
    const next = {};
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (!required(form.password)) next.password = 'Enter your password';
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    const result = await dispatch(loginUser(form));
    setLoading(false);

    if (loginUser.fulfilled.match(result)) {
      // authService normalizes the backend's `roles` array (e.g.
      // ["ROLE_CUSTOMER", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"]) into a single
      // primary `role` — highest privilege wins — so this is reliable for
      // both real backend logins and demo-mode logins.
      const { role } = result.payload;

      if (role === ROLES.SUPER_ADMIN) {
        toast.success('Welcome, Super Admin');
        navigate('/superadmin', { replace: true });
      } else if (role === ROLES.ADMIN) {
        toast.success('Welcome to the admin panel');
        navigate('/admin', { replace: true });
      } else if (role === ROLES.ENGINEER) {
        toast.success('Welcome, Engineer');
        navigate('/engineer', { replace: true });
      } else {
        toast.error('This account does not have staff access');
      }
    } else {
      toast.error(result.payload || 'Login failed');
    }
  };

  const onKey = (e) => e.key === 'Enter' && submit();

  return (
    <div className="grid min-h-screen place-items-center bg-ink p-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-600 text-white">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold text-white">ShopMart Admin</h1>
          <p className="mt-1 text-sm text-slate-400">Sign in to manage your store</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-pop">
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="email">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="field pl-10"
                  value={form.email}
                  onChange={update}
                  onKeyDown={onKey}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="password">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="field pl-10"
                  value={form.password}
                  onChange={update}
                  onKeyDown={onKey}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="inline-flex items-center gap-2 text-ink-muted">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={update}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember me
              </label>
              <Link to="/forgot-password" className="link">Forgot password?</Link>
            </div>

            <button onClick={submit} disabled={loading} className="btn-primary w-full">
              {loading ? <Spinner /> : <ShieldCheck className="h-4 w-4" />}
              {loading ? 'Signing in…' : 'Sign in to dashboard'}
            </button>
          </div>

          <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-ink-muted">
            Demo mode: email starting with <span className="font-medium">admin</span> = Admin,{' '}
            <span className="font-medium">superadmin</span> = Super Admin,{' '}
            <span className="font-medium">engineer</span> = Engineer.
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-slate-400">
          <Link to="/" className="hover:text-white">← Back to store</Link>
        </p>
      </div>
    </div>
  );
}
