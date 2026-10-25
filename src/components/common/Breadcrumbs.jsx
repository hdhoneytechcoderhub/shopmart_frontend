import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumbs({ items = [] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-sm text-ink-muted">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
          {item.to ? (
            <Link to={item.to} className="hover:text-brand-700">{item.label}</Link>
          ) : (
            <span className="font-medium text-ink-soft">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
