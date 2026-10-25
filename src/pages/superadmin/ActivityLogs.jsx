import { useState, useEffect, useCallback } from 'react';
import { PackagePlus, PackageCheck, RefreshCw, LogIn, ShoppingBag, ScrollText, Search, Download } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { superAdminService } from '../../services/superAdminService';
import { timeAgo, formatDateTime } from '../../utils/format';
import { toCsv, downloadCsvText } from '../../utils/csv';

const META = {
  PRODUCT_ADDED: { icon: PackagePlus, tone: 'bg-brand-100 text-brand-600', label: 'Product Added' },
  PRODUCT_UPDATED: { icon: RefreshCw, tone: 'bg-amber-100 text-amber-600', label: 'Product Updated' },
  PRODUCT_APPROVED: { icon: PackageCheck, tone: 'bg-emerald-100 text-emerald-600', label: 'Product Approved' },
  ADMIN_LOGIN: { icon: LogIn, tone: 'bg-purple-100 text-purple-600', label: 'Admin Login' },
  ORDER_UPDATED: { icon: ShoppingBag, tone: 'bg-pink-100 text-pink-600', label: 'Order Updated' },
};

const FILTERS = [
  { key: 'ALL', label: 'All' },
  { key: 'PRODUCT_ADDED', label: 'Product Added' },
  { key: 'PRODUCT_UPDATED', label: 'Product Updated' },
  { key: 'PRODUCT_APPROVED', label: 'Product Approved' },
  { key: 'ADMIN_LOGIN', label: 'Admin Login' },
  { key: 'ORDER_UPDATED', label: 'Order Updated' },
];

export default function ActivityLogs() {
  const [allLogs, setAllLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [userQuery, setUserQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    // Fetch a larger page since Date/User filtering happens client-side —
    // the real /admin/audit-logs endpoint supports exact userId/action
    // filters, not free-text actor search or a date range.
    superAdminService.getActivityLogs({ size: 200 })
      .then((list) => { if (active) setAllLogs(list); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => load(), [load]);

  const logs = allLogs
    .filter((l) => (filter === 'ALL' ? true : l.type === filter))
    .filter((l) => !userQuery || (l.actor || '').toLowerCase().includes(userQuery.toLowerCase()))
    .filter((l) => !fromDate || new Date(l.at) >= new Date(fromDate))
    .filter((l) => !toDate || new Date(l.at) <= new Date(`${toDate}T23:59:59`));

  return (
    <div>
      <AdminPageHeader
        title="Activity Logs"
        subtitle="A timeline of actions across the platform."
        action={logs.length > 0 && (
          <button
            onClick={() => downloadCsvText(toCsv(
              [{ key: 'at', label: 'Time' }, { key: 'actor', label: 'Actor' }, { key: 'type', label: 'Action' }, { key: 'target', label: 'Target' }],
              logs,
            ), `shopmart-activity-log-${Date.now()}.csv`)}
            className="btn-outline"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} className="field pl-10" placeholder="Filter by user…" />
        </div>
        <div>
          <label className="sr-only">From date</label>
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="field w-auto" />
        </div>
        <div>
          <label className="sr-only">To date</label>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="field w-auto" />
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : logs.length === 0 ? (
        <EmptyState icon={ScrollText} title="No activity" description="No log entries match this filter." />
      ) : (
        <div className="card p-6">
          <ol className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-slate-200">
            {logs.map((l) => {
              const m = META[l.type] || { icon: ScrollText, tone: 'bg-slate-100 text-slate-600', label: l.type };
              const Icon = m.icon;
              return (
                <li key={l.id} className="relative flex gap-4">
                  <span className={`z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full ring-4 ring-white ${m.tone}`}><Icon className="h-5 w-5" /></span>
                  <div className="pt-1">
                    <p className="text-sm text-ink">
                      <span className="font-semibold">{l.actor}</span>{' '}
                      <span className="text-ink-muted">— {m.label}</span>
                    </p>
                    <p className="text-sm text-ink-soft">{l.target}</p>
                    <p className="mt-0.5 text-xs text-slate-400" title={formatDateTime(l.at)}>{timeAgo(l.at)}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
}
