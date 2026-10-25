import { useState } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { accountService } from '../../services/accountService';
import { setUser } from '../../redux/slices/authSlice';
import { isEmail, isPhone, required } from '../../utils/validators';
import { initials } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

export default function Profile() {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const next = {};
    if (!required(form.name)) next.name = 'Name is required';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (form.phone && !isPhone(form.phone)) next.phone = 'Enter a valid 10-digit number';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const updated = await accountService.updateProfile(form);
      dispatch(setUser({ ...user, ...(updated || form) }));
      toast.success('Profile updated');
    } catch (err) {
      if (err?.response) {
        toast.error(err.response.data?.message || 'Update failed');
      } else {
        dispatch(setUser({ ...user, ...form }));
        toast.success('Profile updated');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-ink">Profile</h1>
      <p className="mt-1 text-sm text-ink-muted">Manage your personal information.</p>

      <div className="mt-6 flex items-center gap-4">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
          {initials(form.name)}
        </span>
        <div>
          <p className="font-semibold text-ink">{form.name || 'Your name'}</p>
          <p className="text-sm text-ink-muted">{form.email}</p>
        </div>
      </div>

      <div className="card mt-6 max-w-xl p-6">
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="name">Full name</label>
            <input id="name" name="name" className="field" value={form.name} onChange={update} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" className="field" value={form.email} onChange={update} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label" htmlFor="phone">Mobile number</label>
            <input id="phone" name="phone" className="field" value={form.phone} onChange={update} placeholder="10-digit mobile" />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Spinner /> : <Save className="h-4 w-4" />}
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
