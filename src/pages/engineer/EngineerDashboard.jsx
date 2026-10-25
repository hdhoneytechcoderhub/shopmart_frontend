import { useState } from 'react';
import { Wrench, LogOut, Clock, CheckCircle2, MapPin, Phone, ClipboardList, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Logo from '../../components/common/Logo';
import { formatDate } from '../../utils/format';

const daysFromNow = (d) => { const t = new Date(); t.setDate(t.getDate() + d); return t.toISOString(); };

const SEED = [
  { id: 'JOB-3012', customer: 'Aarav Mehta', service: 'AC Installation', phone: '+91 98250 11223', address: 'Bodakdev, Ahmedabad', slot: daysFromNow(0), status: 'ASSIGNED', priority: 'High' },
  { id: 'JOB-3009', customer: 'Isha Patel', service: 'Washing Machine Repair', phone: '+91 90999 45671', address: 'Satellite, Ahmedabad', slot: daysFromNow(0), status: 'IN_PROGRESS', priority: 'Medium' },
  { id: 'JOB-3004', customer: 'Rohan Shah', service: 'Refrigerator Service', phone: '+91 99786 33210', address: 'Maninagar, Ahmedabad', slot: daysFromNow(1), status: 'ASSIGNED', priority: 'Low' },
  { id: 'JOB-2998', customer: 'Neha Verma', service: 'Microwave Repair', phone: '+91 97250 88123', address: 'Vastrapur, Ahmedabad', slot: daysFromNow(-1), status: 'COMPLETED', priority: 'Medium' },
];

const STATUS = {
  ASSIGNED: { label: 'Assigned', tone: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'In progress', tone: 'bg-blue-100 text-blue-700' },
  COMPLETED: { label: 'Completed', tone: 'bg-emerald-100 text-emerald-700' },
};
const NEXT = { ASSIGNED: 'IN_PROGRESS', IN_PROGRESS: 'COMPLETED' };
const NEXT_LABEL = { ASSIGNED: 'Start job', IN_PROGRESS: 'Mark complete' };

export default function EngineerDashboard() {
  const { user, logout } = useAuth();
  const [jobs, setJobs] = useState(SEED);
  const [tab, setTab] = useState('ACTIVE');

  const advance = (job) => {
    const next = NEXT[job.status];
    if (!next) return;
    setJobs((list) => list.map((j) => (j.id === job.id ? { ...j, status: next } : j)));
    toast.success(`${job.id} → ${STATUS[next].label}`);
  };

  const active = jobs.filter((j) => j.status !== 'COMPLETED');
  const completed = jobs.filter((j) => j.status === 'COMPLETED');
  const visible = tab === 'ACTIVE' ? active : completed;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700 sm:inline-flex">
              <Wrench className="h-3.5 w-3.5" /> Engineer
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">Hi, {user?.name || 'Engineer'}</span>
            <button onClick={logout} className="btn-ghost h-9 text-sm"><LogOut className="h-4 w-4" /> Logout</button>
          </div>
        </div>
      </header>

      <main className="container-page py-8">
        <h1 className="text-2xl font-bold text-ink">My Jobs</h1>
        <p className="text-sm text-ink-muted">Service requests assigned to you.</p>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-4">
          {[
            { icon: ClipboardList, label: 'Assigned', value: jobs.filter((j) => j.status === 'ASSIGNED').length, tone: 'text-amber-600' },
            { icon: Clock, label: 'In progress', value: jobs.filter((j) => j.status === 'IN_PROGRESS').length, tone: 'text-blue-600' },
            { icon: CheckCircle2, label: 'Completed', value: completed.length, tone: 'text-emerald-600' },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <s.icon className={`h-5 w-5 ${s.tone}`} />
              <p className="mt-2 text-2xl font-bold text-ink">{s.value}</p>
              <p className="text-xs text-ink-muted">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-6 flex gap-2">
          {[['ACTIVE', `Active (${active.length})`], ['DONE', `Completed (${completed.length})`]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${tab === k ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Jobs */}
        <div className="mt-4 space-y-3">
          {visible.map((j) => (
            <div key={j.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink">{j.service}</h3>
                    <span className={`badge ${STATUS[j.status].tone}`}>{STATUS[j.status].label}</span>
                    {j.status !== 'COMPLETED' && j.priority === 'High' && <span className="badge bg-red-100 text-red-700">High priority</span>}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{j.id} · {formatDate(j.slot)}</p>
                  <div className="mt-3 grid gap-1.5 text-sm text-ink-soft sm:grid-cols-2">
                    <span className="inline-flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-slate-400" /> {j.customer}</span>
                    <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-400" /> {j.phone}</span>
                    <span className="inline-flex items-center gap-1.5 sm:col-span-2"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {j.address}</span>
                  </div>
                </div>
                {NEXT[j.status] && (
                  <button onClick={() => advance(j)} className="btn-primary h-9 text-sm">{NEXT_LABEL[j.status]}</button>
                )}
              </div>
            </div>
          ))}
          {visible.length === 0 && (
            <div className="card p-10 text-center text-sm text-ink-muted">No jobs in this tab.</div>
          )}
        </div>
      </main>
    </div>
  );
}
