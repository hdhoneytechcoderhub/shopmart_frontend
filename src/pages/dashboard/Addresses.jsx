import { useEffect, useState } from 'react';
import { MapPin, Plus, Pencil, Trash2, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { accountService } from '../../services/accountService';
import { mockAddresses } from '../../services/mockAccount';
import { isPhone, required } from '../../utils/validators';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';

const EMPTY = { label: 'Home', name: '', line1: '', line2: '', city: '', state: '', pincode: '', phone: '', isDefault: false };

export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [demo, setDemo] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;
    accountService.getAddresses()
      .then((data) => { if (active) setAddresses(Array.isArray(data) ? data : []); })
      .catch((err) => { if (active && !err?.response) { setAddresses(mockAddresses); setDemo(true); } });
    return () => { active = false; };
  }, []);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); };
  const startEdit = (a) => { setEditing(a); setForm(a); setErrors({}); setOpen(true); };
  const update = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Name is required';
    if (!required(form.line1)) next.line1 = 'Address is required';
    if (!required(form.city)) next.city = 'City is required';
    if (!required(form.state)) next.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid 10-digit number';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const applyLocal = (saved) => {
    setAddresses((list) => {
      let next = editing
        ? list.map((a) => (a.id === editing.id ? saved : a))
        : [...list, saved];
      if (saved.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === saved.id }));
      return next;
    });
  };

  const save = async () => {
    if (!validate()) return;
    const payload = { ...form };
    try {
      let saved;
      if (editing) saved = await accountService.updateAddress(editing.id, payload);
      else saved = await accountService.addAddress(payload);
      applyLocal(saved || { ...payload, id: editing?.id || Date.now() });
      toast.success(editing ? 'Address updated' : 'Address added');
      setOpen(false);
    } catch (err) {
      if (err?.response) {
        toast.error(err.response.data?.message || 'Could not save address');
      } else {
        applyLocal({ ...payload, id: editing?.id || Date.now() });
        toast.success(editing ? 'Address updated' : 'Address added');
        setOpen(false);
      }
    }
  };

  const remove = async (a) => {
    try {
      await accountService.deleteAddress(a.id);
    } catch (err) {
      if (err?.response) { toast.error('Could not delete address'); return; }
    }
    setAddresses((list) => list.filter((x) => x.id !== a.id));
    toast.success('Address removed');
  };

  const makeDefault = async (a) => {
    try { await accountService.setDefaultAddress(a); }
    catch (err) { if (err?.response) { toast.error('Could not set default'); return; } }
    setAddresses((list) => list.map((x) => ({ ...x, isDefault: x.id === a.id })));
    toast.success(`${a.label} set as default`);
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-ink">Addresses</h1>
          <p className="mt-1 text-sm text-ink-muted">Manage your delivery addresses.</p>
        </div>
        <button onClick={startAdd} className="btn-primary">
          <Plus className="h-4 w-4" /> Add address
        </button>
      </div>

      {demo && (
        <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Demo data shown — connect the backend to manage real addresses.
        </p>
      )}

      <div className="mt-6">
        {addresses.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title="No addresses saved"
            description="Add an address to speed up checkout."
            action={<button onClick={startAdd} className="btn-primary">Add address</button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="card relative p-5">
                <div className="flex items-center justify-between">
                  <span className="chip">{a.label}</span>
                  {a.isDefault && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700">
                      <Star className="h-3.5 w-3.5 fill-brand-600 text-brand-600" /> Default
                    </span>
                  )}
                </div>
                <p className="mt-3 font-semibold text-ink">{a.name}</p>
                <p className="text-sm text-ink-muted">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.pincode}
                </p>
                <p className="text-sm text-ink-muted">Phone: {a.phone}</p>
                <div className="mt-4 flex gap-2">
                  {!a.isDefault && (
                    <button onClick={() => makeDefault(a)} className="btn-ghost h-9 px-3 text-sm text-brand-700 hover:bg-brand-50">
                      <Star className="h-3.5 w-3.5" /> Set default
                    </button>
                  )}
                  <button onClick={() => startEdit(a)} className="btn-outline h-9 px-3 text-sm">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button onClick={() => remove(a)} className="btn-ghost h-9 px-3 text-sm text-red-600 hover:bg-red-50">
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit address' : 'Add address'}
        size="lg"
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary">Save address</button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Label</label>
            <select name="label" value={form.label} onChange={update} className="field">
              <option>Home</option>
              <option>Work</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="label">Full name</label>
            <input name="name" className="field" value={form.name} onChange={update} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address line 1</label>
            <input name="line1" className="field" value={form.line1} onChange={update} />
            {errors.line1 && <p className="mt-1 text-xs text-red-600">{errors.line1}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address line 2 (optional)</label>
            <input name="line2" className="field" value={form.line2} onChange={update} />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" className="field" value={form.city} onChange={update} />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
          </div>
          <div>
            <label className="label">State</label>
            <input name="state" className="field" value={form.state} onChange={update} />
            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
          </div>
          <div>
            <label className="label">Pincode</label>
            <input name="pincode" className="field" value={form.pincode} onChange={update} />
            {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
          </div>
          <div>
            <label className="label">Phone</label>
            <input name="phone" className="field" value={form.phone} onChange={update} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={update} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Set as default address
          </label>
        </div>
      </Modal>
    </div>
  );
}
