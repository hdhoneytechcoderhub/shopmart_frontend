import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Laptop, Smartphone, MapPin, LogOut, ShieldCheck, History, Info, CheckCircle2, XCircle } from 'lucide-react';
import { sessionService } from '../../services/sessionService';
import Spinner from '../../components/common/Spinner';
import { timeAgo, formatDateTime } from '../../utils/format';

export default function Security() {
  const [sessions, setSessions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([sessionService.getActiveSessions(), sessionService.getLoginHistory()])
      .then(([s, h]) => { setSessions(s); setHistory(h); })
      .catch(() => toast.error('Failed to load security info'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => load(), [load]);

  const revoke = async (s) => {
    if (!window.confirm(`Sign out on ${s.device} · ${s.browser}?`)) return;
    setRevokingId(s.id);
    try {
      await sessionService.revokeSession(s.id);
      toast.success('Session signed out');
      load();
    } catch (err) {
      toast.error(err.message || 'Could not revoke session');
    } finally {
      setRevokingId(null);
    }
  };

  const revokeAll = async () => {
    if (!window.confirm('Sign out of all other devices?')) return;
    await sessionService.revokeAllOtherSessions();
    toast.success('Signed out of all other devices');
    load();
  };

  if (loading) return <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>;

  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Security</h1>
        <p className="mt-1 text-sm text-ink-muted">Active sessions and recent sign-in activity for your account.</p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>The backend doesn't track sessions per device yet, so only this browser's activity is real — other rows below are illustrative until a server-side session registry exists.</p>
      </div>

      {/* Active sessions */}
      <section className="card max-w-2xl p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 font-semibold text-ink"><ShieldCheck className="h-4 w-4 text-brand-600" /> Active sessions</h2>
          {otherSessions.length > 0 && <button onClick={revokeAll} className="btn-outline h-8 text-xs">Sign out all other devices</button>}
        </div>
        <div className="space-y-3">
          {sessions.map((s) => {
            const Icon = s.device === 'Mobile' ? Smartphone : Laptop;
            return (
              <div key={s.id} className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${s.current ? 'border-brand-200 bg-brand-50/40' : 'border-slate-200'}`}>
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500"><Icon className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {s.browser} on {s.os}
                    {s.current && <span className="ml-2 badge bg-brand-100 text-brand-700">This device</span>}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-ink-muted"><MapPin className="h-3 w-3" /> {s.location} · Active {timeAgo(s.lastActiveAt)}</p>
                </div>
                {!s.current && (
                  <button onClick={() => revoke(s)} disabled={revokingId === s.id} className="btn-ghost h-8 text-xs text-red-600 hover:bg-red-50">
                    {revokingId === s.id ? <Spinner className="h-3.5 w-3.5" /> : <LogOut className="h-3.5 w-3.5" />} Sign out
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Login history */}
      <section className="card max-w-2xl p-6">
        <h2 className="mb-4 inline-flex items-center gap-2 font-semibold text-ink"><History className="h-4 w-4 text-brand-600" /> Login activity</h2>
        {history.length === 0 ? (
          <p className="text-sm text-ink-muted">No login activity recorded yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h) => (
              <li key={h.id} className="flex items-center gap-3">
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${h.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {h.status === 'SUCCESS' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{h.browser} on {h.os} · {h.location}</p>
                  <p className="text-xs text-ink-muted" title={formatDateTime(h.at)}>{timeAgo(h.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
