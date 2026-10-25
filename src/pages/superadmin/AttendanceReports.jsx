import { useEffect, useState, useCallback } from 'react';
import { Users, Clock, CalendarDays, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { superAdminService } from '../../services/superAdminService';
import { AdminPageHeader, StatCard, AdminTable } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';

const fmtTime = (v) => (v ? new Date(v).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—');
const fmtDay = (v) => (v ? new Date(v).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' }) : '—');
const toDateInput = (d) => d.toISOString().slice(0, 10);

export default function AttendanceReports() {
  const [rows, setRows] = useState([]);
  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [from, setFrom] = useState(() => toDateInput(new Date(Date.now() - 30 * 86400000)));
  const [to, setTo] = useState(() => toDateInput(new Date()));

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      superAdminService.getAllAttendance(from, to),
      superAdminService.getAttendanceReport(from, to),
    ])
      .then(([all, report]) => { if (active) { setRows(all); setDaily(report); } })
      .catch(() => { if (active) toast.error('Failed to load attendance'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [from, to]);

  useEffect(() => load(), [load]);

  const filtered = rows.filter((r) => (r.userName || '').toLowerCase().includes(q.toLowerCase()));
  const totalHours = Math.round(daily.reduce((s, d) => s + (d.totalHours || 0), 0) * 10) / 10;
  const uniqueEmployees = new Set(rows.map((r) => r.userId)).size;

  return (
    <div>
      <AdminPageHeader title="Attendance Reports" subtitle="Company-wide attendance across every employee." />

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="field w-auto" />
        </div>
        <div>
          <label className="label">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="field w-auto" />
        </div>
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search employee…" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={Users} label="Employees checked in" value={uniqueEmployees} tone="brand" />
            <StatCard icon={Clock} label="Total hours (range)" value={`${totalHours}h`} tone="emerald" />
            <StatCard icon={CalendarDays} label="Days with activity" value={daily.length} tone="purple" />
          </div>

          <div className="mt-6 card p-5">
            <h3 className="mb-3 font-semibold text-ink">Daily summary</h3>
            <AdminTable columns={['Date', 'Employees present', 'Total hours']}>
              {daily.map((d) => (
                <tr key={d.date} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-ink">{fmtDay(d.date)}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.presentCount}</td>
                  <td className="px-4 py-3 text-ink-soft">{d.totalHours}h</td>
                </tr>
              ))}
            </AdminTable>
          </div>

          <div className="mt-6">
            <h3 className="mb-3 font-semibold text-ink">All sessions</h3>
            <AdminTable columns={['Employee', 'Date', 'Login', 'Logout', 'Hours']}>
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-ink">{r.userName}</td>
                  <td className="px-4 py-3 text-ink-muted">{fmtDay(r.loginTime)}</td>
                  <td className="px-4 py-3 text-ink-soft">{fmtTime(r.loginTime)}</td>
                  <td className="px-4 py-3 text-ink-soft">{fmtTime(r.logoutTime)}</td>
                  <td className="px-4 py-3 font-medium text-ink">{r.totalHours != null ? `${r.totalHours}h` : '—'}</td>
                </tr>
              ))}
            </AdminTable>
          </div>
        </>
      )}
    </div>
  );
}
