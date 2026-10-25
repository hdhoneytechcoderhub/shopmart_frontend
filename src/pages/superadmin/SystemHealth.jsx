import { useEffect, useState, useCallback } from 'react';
import { Activity, Database, Server, RefreshCw, CheckCircle2, XCircle, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { systemHealthService } from '../../services/superAdminService';
import { AdminPageHeader, AreaChart } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';

// Response-time history is synthetic (no backend metrics endpoint exists to
// source it from) — clearly labeled below rather than presented as real
// telemetry. The up/down status above it IS a real check.
function synthHistory(baseLatency) {
  return Array.from({ length: 24 }, (_, i) => Math.max(20, Math.round((baseLatency || 120) + Math.sin(i / 3) * 30 + (Math.random() - 0.5) * 20)));
}

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);
  const [history, setHistory] = useState([]);

  const runCheck = useCallback(async () => {
    setChecking(true);
    try {
      const result = await systemHealthService.check();
      setHealth(result);
      setLastChecked(new Date());
      setHistory((h) => [...h.slice(-23), result.latencyMs || 0]);
    } catch {
      toast.error('Health check failed');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    runCheck();
    setHistory(synthHistory(120));
    const interval = setInterval(runCheck, 30000);
    return () => clearInterval(interval);
  }, [runCheck]);

  const services = [
    { label: 'API', up: health?.apiUp, icon: Server },
    { label: 'Database', up: health?.dbUp, icon: Database },
  ];

  return (
    <div>
      <AdminPageHeader
        title="System Health"
        subtitle="Live reachability checks against the backend."
        action={<button onClick={runCheck} disabled={checking} className="btn-outline">{checking ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />} Recheck</button>}
      />

      <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          {health?.source === 'actuator' && 'Reading live status from Spring Boot Actuator (/actuator/health).'}
          {health?.source === 'ping' && "Actuator isn't exposed on the backend — falling back to a reachability ping (GET /categories). Add spring-boot-starter-actuator and expose /actuator/health for real component-level status (DB, disk, etc)."}
          {health?.source === 'unreachable' && 'The API could not be reached at all — check the backend is running and CORS/network settings are correct.'}
          {!health && 'Checking…'}
          {' '}The response-time chart below is synthetic (no metrics endpoint exists yet) — for illustration only.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {services.map((s) => (
          <div key={s.label} className={`card flex items-center gap-4 p-5 ${s.up === false ? 'border-red-200 bg-red-50/40' : ''}`}>
            <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl ${s.up ? 'bg-emerald-50 text-emerald-600' : s.up === false ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
              <s.icon className="h-6 w-6" />
            </span>
            <div>
              <p className="font-semibold text-ink">{s.label}</p>
              <p className={`flex items-center gap-1 text-sm ${s.up ? 'text-emerald-700' : s.up === false ? 'text-red-600' : 'text-ink-muted'}`}>
                {checking && !health ? 'Checking…' : s.up ? <><CheckCircle2 className="h-3.5 w-3.5" /> Operational</> : <><XCircle className="h-3.5 w-3.5" /> Down</>}
              </p>
            </div>
          </div>
        ))}
        <div className="card flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Activity className="h-6 w-6" /></span>
          <div>
            <p className="font-semibold text-ink">Latency</p>
            <p className="text-sm text-ink-muted">{health?.latencyMs != null ? `${health.latencyMs} ms` : '—'}</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500"><RefreshCw className="h-6 w-6" /></span>
          <div>
            <p className="font-semibold text-ink">Last checked</p>
            <p className="text-sm text-ink-muted">{lastChecked ? lastChecked.toLocaleTimeString('en-IN') : '—'} · auto-refreshes every 30s</p>
          </div>
        </div>
      </div>

      <div className="card mt-6 p-6">
        <h2 className="mb-1 font-semibold text-ink">Response time (illustrative)</h2>
        <p className="mb-4 text-sm text-ink-muted">Synthetic trend — wire to real APM/metrics once available.</p>
        <AreaChart data={history} height={180} />
      </div>
    </div>
  );
}
