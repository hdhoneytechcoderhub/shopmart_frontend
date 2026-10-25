import { ORDER_STATUS_META } from '../../utils/constants';

export function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, delta, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red: 'bg-red-50 text-red-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
        {delta && <span className="text-xs font-medium text-emerald-600">{delta}</span>}
      </div>
      <p className="mt-3 text-2xl font-bold text-ink">{value}</p>
      <p className="text-sm text-ink-muted">{label}</p>
    </div>
  );
}

export function BarChart({ data = [], height = 160 }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center justify-end">
          <div
            className="w-full rounded-t-md bg-brand-500/80 transition-all hover:bg-brand-600"
            style={{ height: `${(v / max) * 100}%` }}
            title={String(v)}
          />
        </div>
      ))}
    </div>
  );
}

// Smooth area/line chart (pure SVG, no deps) for revenue trends.
export function AreaChart({ data = [], height = 200, stroke = '#4f46e5', fill = 'rgba(79,70,229,0.14)' }) {
  const w = 600;
  const h = height;
  const pad = 8;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / Math.max(1, data.length - 1);
  const pts = data.map((v, i) => [pad + i * stepX, h - pad - ((v - min) / span) * (h - pad * 2)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1]?.[0].toFixed(1)},${h - pad} L${pts[0]?.[0].toFixed(1)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <path d={area} fill={fill} />
      <path d={line} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="2.5" fill={stroke} />)}
    </svg>
  );
}

// Simple donut for proportional breakdowns.
export function Donut({ segments = [], size = 160, thickness = 22 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {segments.map((seg, i) => {
          const len = (seg.value / total) * c;
          const dash = `${len} ${c - len}`;
          const circle = (
            <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={seg.color} strokeWidth={thickness} strokeDasharray={dash} strokeDashoffset={-offset} />
          );
          offset += len;
          return circle;
        })}
      </g>
    </svg>
  );
}

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS_META[status] || { label: status, tone: 'bg-slate-100 text-slate-600' };
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

export function AdminTable({ columns, children }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-left text-xs uppercase tracking-wide text-ink-muted">
              {columns.map((c, i) => (
                <th key={i} className="whitespace-nowrap px-4 py-3 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
