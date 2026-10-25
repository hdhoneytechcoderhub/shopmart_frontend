import { Star } from 'lucide-react';

export default function Rating({ value = 0, count, size = 14, showValue = true }) {
  const v = Number(value) || 0;
  return (
    <div className="inline-flex items-center gap-1">
      <div className="flex" aria-label={`Rated ${v} out of 5`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            style={{ width: size, height: size }}
            className={i <= Math.round(v) ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
          />
        ))}
      </div>
      {showValue && <span className="text-xs font-medium text-ink-soft">{v}</span>}
      {count != null && <span className="text-xs text-ink-muted">({count})</span>}
    </div>
  );
}
