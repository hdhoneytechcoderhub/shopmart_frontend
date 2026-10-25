// Generic skeleton building blocks — same `animate-pulse bg-slate-100`
// language already established by ProductCardSkeleton, just reusable across
// admin/analytics/table contexts instead of one-off per page.

export function SkeletonLine({ className = 'h-4 w-full' }) {
  return <div className={`animate-pulse rounded bg-slate-100 ${className}`} />;
}

export function SkeletonCard({ lines = 2 }) {
  return (
    <div className="card space-y-3 p-4">
      <div className="h-8 w-8 animate-pulse rounded-lg bg-slate-100" />
      <SkeletonLine className="h-3 w-20" />
      {Array.from({ length: lines }).map((_, i) => <SkeletonLine key={i} className="h-5 w-2/3" />)}
    </div>
  );
}

// Matches the shape of AdminTable rows so a loading table doesn't visually
// jump when real rows replace it.
export function SkeletonTableRows({ columns = 5, rows = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((__, c) => (
            <td key={c} className="px-4 py-3"><SkeletonLine className={c === 0 ? 'h-4 w-32' : 'h-4 w-16'} /></td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SkeletonStatRow({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} lines={1} />)}
    </div>
  );
}

export function SkeletonChart({ height = 280 }) {
  return <div className="card animate-pulse p-5" style={{ height }}><div className="h-full w-full rounded-xl bg-slate-100" /></div>;
}
