import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page = 0, totalPages = 1, onChange }) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i).filter(
    (p) => p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button
        className="btn-outline h-9 w-9 p-0"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {pages.map((p, i) => {
        const gap = i > 0 && p - pages[i - 1] > 1;
        return (
          <span key={p} className="flex items-center gap-1.5">
            {gap && <span className="px-1 text-ink-muted">…</span>}
            <button
              onClick={() => onChange(p)}
              className={`h-9 w-9 rounded-xl text-sm font-semibold transition ${
                p === page ? 'bg-brand-600 text-white' : 'border border-slate-300 bg-white text-ink-soft hover:bg-slate-50'
              }`}
            >
              {p + 1}
            </button>
          </span>
        );
      })}
      <button
        className="btn-outline h-9 w-9 p-0"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
