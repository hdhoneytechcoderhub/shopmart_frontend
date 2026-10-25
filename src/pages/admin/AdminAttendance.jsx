import { useEffect, useMemo, useState, useCallback } from 'react';
import { Clock, LogIn, LogOut, CalendarDays, Timer, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader, StatCard, AdminTable } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';
import { superAdminService } from '../../services/superAdminService';

const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDay = (v) => new Date(v).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });

// Heuristic shift assumptions — the backend only stores actual login/logout
// timestamps, it has no concept of a scheduled shift, so "Late"/"Half day"/
// "Absent" don't exist server-side. These thresholds are a reasonable
// standard-9-to-6 assumption; adjust here if the real policy differs.
const LATE_AFTER_HOUR = 9.5;   // 9:30 AM
const HALF_DAY_MAX_HOURS = 4;
const FULL_DAY_MIN_HOURS = 7;

function buildCalendar(rows) {
  const byDate = new Map(rows.map((r) => [new Date(r.date).toDateString(), r]));
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const days = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const key = d.toDateString();
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const session = byDate.get(key);
    let status = 'ABSENT';
    if (isWeekend) status = 'WEEKEND';
    else if (session?.login) {
      const loginHour = new Date(session.login).getHours() + new Date(session.login).getMinutes() / 60;
      if (session.hours == null) status = 'IN_PROGRESS';
      else if (session.hours < HALF_DAY_MAX_HOURS) status = 'HALF_DAY';
      else if (loginHour > LATE_AFTER_HOUR) status = 'LATE';
      else status = 'PRESENT';
    }
    days.push({ date: new Date(d), login: session?.login, logout: session?.logout, hours: session?.hours, status });
  }
  return days.reverse();
}

const CALENDAR_STATUS_META = {
  PRESENT: { label: 'Present', tone: 'bg-emerald-100 text-emerald-700' },
  LATE: { label: 'Late', tone: 'bg-amber-100 text-amber-700' },
  HALF_DAY: { label: 'Half day', tone: 'bg-orange-100 text-orange-700' },
  ABSENT: { label: 'Absent', tone: 'bg-red-100 text-red-700' },
  IN_PROGRESS: { label: 'In progress', tone: 'bg-blue-100 text-blue-700' },
  WEEKEND: { label: 'Weekend', tone: 'bg-slate-100 text-slate-500' },
};

export default function AdminAttendance() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    superAdminService.getAttendance()
      .then((list) => { if (active) setRows(list); })
      .catch(() => toast.error('Failed to load attendance'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const today = rows[0];
  const monthlyHours = useMemo(
    () => Math.round(rows.reduce((s, r) => s + (r.hours || 0), 0) * 10) / 10,
    [rows],
  );
  const workedDays = rows.filter((r) => r.hours != null).length;
  const avgPerDay = workedDays ? Math.round((monthlyHours / workedDays) * 10) / 10 : 0;

  const calendar = useMemo(() => buildCalendar(rows), [rows]);
  const summary = useMemo(() => {
    const counts = { PRESENT: 0, LATE: 0, HALF_DAY: 0, ABSENT: 0 };
    calendar.forEach((d) => { if (counts[d.status] != null) counts[d.status] += 1; });
    return counts;
  }, [calendar]);

  const clockIn = async () => {
    try {
      await superAdminService.clockIn();
      toast.success('Clocked in for today');
      load();
    } catch {
      toast.error('Could not clock in');
    }
  };

  const clockOut = async () => {
    try {
      await superAdminService.clockOut();
      toast.success('Clocked out for today');
      load();
    } catch {
      toast.error('Could not clock out');
    }
  };

  if (loading) return (
    <div>
      <AdminPageHeader title="Attendance" subtitle="Your working hours and login activity." />
      <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
    </div>
  );

  return (
    <div>
      <AdminPageHeader title="Attendance" subtitle="Your working hours and login activity." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={LogIn} label="Login time (today)" value={fmtTime(today?.login)} tone="brand" />
        <StatCard icon={LogOut} label="Logout time (today)" value={fmtTime(today?.logout)} tone="amber" />
        <StatCard icon={Timer} label="Total hours (today)" value={today?.hours != null ? `${today.hours}h` : (today?.login ? 'In progress' : '—')} tone="emerald" />
        <StatCard icon={CalendarDays} label="Monthly hours" value={`${monthlyHours}h`} tone="purple" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={CheckCircle2} label="Present (this month)" value={summary.PRESENT} tone="emerald" />
        <StatCard icon={AlertTriangle} label="Late" value={summary.LATE} tone="amber" />
        <StatCard icon={Timer} label="Half day" value={summary.HALF_DAY} tone="orange" />
        <StatCard icon={XCircle} label="Absent" value={summary.ABSENT} tone="red" />
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Late / Half day are estimated from a standard 9:30 AM start and a 4-hour half-day threshold — the backend doesn't track a configured shift schedule yet, so treat these as an approximation.
      </p>

      {today && !today.logout && today.login && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
            <p className="text-sm font-medium text-emerald-800">Currently clocked in since {fmtTime(today.login)}</p>
          </div>
          <button onClick={clockOut} className="btn-ghost border border-emerald-300 text-sm text-emerald-700 hover:bg-emerald-100">
            <LogOut className="h-4 w-4" /> Clock out
          </button>
        </div>
      )}

      {(!today || today.logout) && (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-5 py-3">
          <p className="text-sm font-medium text-ink-soft">Not clocked in yet today.</p>
          <button onClick={clockIn} className="btn-primary text-sm">
            <LogIn className="h-4 w-4" /> Clock in
          </button>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-4">
          <div className="card px-4 py-2">
            <span className="text-xs text-ink-muted">Avg / day</span>
            <p className="font-semibold text-ink">{avgPerDay}h</p>
          </div>
          <div className="card px-4 py-2">
            <span className="text-xs text-ink-muted">Days worked</span>
            <p className="font-semibold text-ink">{workedDays}</p>
          </div>
        </div>

        <AdminTable columns={['Date', 'Login', 'Logout', 'Hours', 'Status']}>
          {calendar.map((d) => (
            <tr key={d.date.toDateString()} className={`hover:bg-slate-50/60 ${d.status === 'WEEKEND' ? 'opacity-50' : ''}`}>
              <td className="px-4 py-3 font-medium text-ink">{fmtDay(d.date)}</td>
              <td className="px-4 py-3 text-ink-soft">{fmtTime(d.login)}</td>
              <td className="px-4 py-3 text-ink-soft">{fmtTime(d.logout)}</td>
              <td className="px-4 py-3 font-medium text-ink">{d.hours != null ? `${d.hours}h` : '—'}</td>
              <td className="px-4 py-3">
                <span className={`badge ${CALENDAR_STATUS_META[d.status].tone}`}>{CALENDAR_STATUS_META[d.status].label}</span>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
