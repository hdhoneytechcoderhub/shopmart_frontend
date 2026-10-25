import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, ShieldCheck, Power, Eye, KeyRound, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { superAdminService } from '../../services/superAdminService';
import { isEmail, required } from '../../utils/validators';
import { formatDate, initials, timeAgo } from '../../utils/format';

const EMPTY = { name: '', email: '', password: '', role: 'ADMIN', status: 'Active' };

export default function AdminManagement() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [toDelete, setToDelete] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [pwdFor, setPwdFor] = useState(null);
  const [newPwd, setNewPwd] = useState('');
  const [pwdErr, setPwdErr] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [resettingId, setResettingId] = useState(null);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    superAdminService.getAdmins()
      .then((list) => { if (active) setAdmins(list); })
      .catch(() => toast.error('Failed to load admins'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const startAdd = () => { setEditing(null); setForm(EMPTY); setErrors({}); setOpen(true); };
  const startEdit = (a) => { setEditing(a); setForm(a); setErrors({}); setOpen(true); };
  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const save = async () => {
    const next = {};
    if (!required(form.name)) next.name = 'Name is required';
    if (!isEmail(form.email)) next.email = 'Enter a valid email';
    if (!editing && (!form.password || form.password.length < 8)) next.password = 'Password must be at least 8 characters';
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      if (editing) {
        const updated = await superAdminService.updateAdmin(editing.id, form);
        setAdmins((list) => list.map((a) => (a.id === editing.id ? { ...a, ...updated } : a)));
        toast.success('Admin updated');
      } else {
        const created = await superAdminService.createAdmin(form);
        setAdmins((list) => [created, ...list]);
        toast.success('Admin created');
      }
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not save admin');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (a) => {
    const newStatus = a.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await superAdminService.toggleAdminStatus(a.id, newStatus);
      setAdmins((list) => list.map((x) => (x.id === a.id ? { ...x, status: newStatus } : x)));
      toast.success(`${a.name} ${newStatus === 'Active' ? 'activated' : 'deactivated'}`);
    } catch (err) {
      toast.error('Could not update status');
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await superAdminService.deleteAdmin(toDelete.id);
      setAdmins((list) => list.filter((x) => x.id !== toDelete.id));
      toast.success('Admin removed');
      setToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete admin');
    } finally {
      setDeleting(false);
    }
  };

  const resetPassword = async (a) => {
    setResettingId(a.id);
    try {
      const res = await superAdminService.resetAdminPassword(a.id);
      if (res?.temporaryPassword) {
        toast.success(`Temporary password for ${a.name}: ${res.temporaryPassword}`, { duration: 6000 });
      } else {
        toast.success(`Password reset link sent to ${a.email}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not reset password');
    } finally {
      setResettingId(null);
    }
  };

  const openChangePassword = (a) => { setPwdFor(a); setNewPwd(''); setPwdErr(''); };

  const submitChangePassword = async () => {
    if (newPwd.length < 8) { setPwdErr('Password must be at least 8 characters'); return; }
    setPwdSaving(true);
    try {
      await superAdminService.setAdminPassword(pwdFor.id, newPwd);
      toast.success(`Password updated for ${pwdFor.name}`);
      setPwdFor(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not update password');
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div>
      <AdminPageHeader
        title="Admin Management"
        subtitle="Create and manage admin accounts."
        action={<button onClick={startAdd} className="btn-primary"><Plus className="h-4 w-4" /> Add Admin</button>}
      />

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : admins.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No admins" description="Add your first admin account." action={<button onClick={startAdd} className="btn-primary">Add Admin</button>} />
      ) : (
        <AdminTable columns={['Admin', 'Role', 'Status', 'Last login', 'Created', '']}>
          {admins.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700">{initials(a.name)}</span>
                  <div><p className="font-medium text-ink">{a.name}</p><p className="text-xs text-ink-muted">{a.email}</p></div>
                </div>
              </td>
              <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm text-ink-soft"><ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> {a.role}</span></td>
              <td className="px-4 py-3"><span className={`badge ${a.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{a.status}</span></td>
              <td className="px-4 py-3 text-ink-muted">{a.lastLogin ? timeAgo(a.lastLogin) : '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(a.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => setViewing(a)} className="btn-ghost h-8 w-8 p-0" title="Details" aria-label="Details"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => resetPassword(a)} disabled={resettingId === a.id} className="btn-ghost h-8 w-8 p-0" title="Reset password" aria-label="Reset password"><RefreshCw className={`h-4 w-4 ${resettingId === a.id ? 'animate-spin' : ''}`} /></button>
                  <button onClick={() => openChangePassword(a)} className="btn-ghost h-8 w-8 p-0" title="Change password" aria-label="Change password"><KeyRound className="h-4 w-4" /></button>
                  <button onClick={() => toggleStatus(a)} className="btn-ghost h-8 w-8 p-0" title={a.status === 'Active' ? 'Deactivate' : 'Activate'} aria-label="Toggle status">
                    <Power className={`h-4 w-4 ${a.status === 'Active' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  </button>
                  <button onClick={() => startEdit(a)} className="btn-ghost h-8 w-8 p-0" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setToDelete(a)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* Add/Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit admin' : 'Add admin'}
        footer={(
          <>
            <button onClick={() => setOpen(false)} className="btn-ghost">Cancel</button>
            <button onClick={save} className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create admin'}
            </button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="label">Full name</label>
            <input name="name" className="field" value={form.name} onChange={update} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input name="email" type="email" className="field" value={form.email} onChange={update} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          {!editing && (
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="field" value={form.password} onChange={update} placeholder="At least 8 characters" />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Role</label>
              <select name="role" value={form.role} onChange={update} className="field" disabled={!editing}>
                <option value="ADMIN">Admin</option>
                <option value="SUPER_ADMIN" disabled>Super Admin (not supported yet)</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select name="status" value={form.status} onChange={update} className="field">
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>
          {!editing && <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-ink-muted">New admins are created with this password directly — there's no email invite flow yet, so share it with them yourself.</p>}
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        title="Remove admin?"
        footer={(
          <>
            <button onClick={() => setToDelete(null)} className="btn-ghost">Cancel</button>
            <button onClick={remove} className="btn-danger" disabled={deleting}>{deleting ? 'Removing…' : 'Delete'}</button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">Remove <span className="font-medium text-ink">{toDelete?.name}</span>'s admin access? This can't be undone.</p>
      </Modal>

      {/* Admin details */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title="Admin details"
        footer={<button onClick={() => setViewing(null)} className="btn-ghost">Close</button>}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-lg font-semibold text-brand-700">{initials(viewing.name)}</span>
              <div>
                <p className="text-lg font-semibold text-ink">{viewing.name}</p>
                <p className="text-sm text-ink-muted">{viewing.email}</p>
              </div>
            </div>
            <dl className="grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
              <div><dt className="text-ink-muted">Role</dt><dd className="font-medium text-ink">{viewing.role}</dd></div>
              <div><dt className="text-ink-muted">Status</dt><dd><span className={`badge ${viewing.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{viewing.status}</span></dd></div>
              <div><dt className="text-ink-muted">Last login</dt><dd className="font-medium text-ink">{viewing.lastLogin ? timeAgo(viewing.lastLogin) : '—'}</dd></div>
              <div><dt className="text-ink-muted">Created</dt><dd className="font-medium text-ink">{formatDate(viewing.createdAt)}</dd></div>
            </dl>
            <div className="flex gap-2 border-t border-slate-100 pt-4">
              <button onClick={() => { const a = viewing; setViewing(null); openChangePassword(a); }} className="btn-outline h-9 text-sm"><KeyRound className="h-4 w-4" /> Change password</button>
              <button onClick={() => { const a = viewing; setViewing(null); resetPassword(a); }} className="btn-ghost h-9 text-sm"><RefreshCw className="h-4 w-4" /> Reset password</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Change password */}
      <Modal open={!!pwdFor} onClose={() => !pwdSaving && setPwdFor(null)} title={`Change password — ${pwdFor?.name || ''}`}
        footer={(
          <>
            <button onClick={() => setPwdFor(null)} disabled={pwdSaving} className="btn-ghost">Cancel</button>
            <button onClick={submitChangePassword} disabled={pwdSaving} className="btn-primary">{pwdSaving ? 'Saving…' : 'Update password'}</button>
          </>
        )}>
        <label className="label">New password</label>
        <input type="password" className="field" value={newPwd} onChange={(e) => { setNewPwd(e.target.value); setPwdErr(''); }} placeholder="At least 8 characters" />
        {pwdErr && <p className="mt-1 text-xs text-red-600">{pwdErr}</p>}
        <p className="mt-2 text-xs text-ink-muted">The admin can change this after their next login.</p>
      </Modal>
    </div>
  );
}
