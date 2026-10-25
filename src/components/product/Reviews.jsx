import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, PenLine, ThumbsUp, MoreVertical, BadgeCheck, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { reviewService, summarize } from '../../services/reviewService';
import { useAuth } from '../../hooks/useAuth';
import Spinner from '../common/Spinner';
import { timeAgo, initials } from '../../utils/format';

// Green stars to match the reference design.
function Stars({ value = 0, size = 14 }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }}
          className={i <= Math.round(value) ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-200 text-slate-200'} />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => onChange(i)} aria-label={`${i} stars`}>
          <Star className={`h-7 w-7 transition ${i <= (hover || value) ? 'fill-emerald-500 text-emerald-500' : 'fill-slate-200 text-slate-200'}`} />
        </button>
      ))}
    </div>
  );
}

const SAMPLE_IMAGES = [
  'https://picsum.photos/seed/rev-a/200/200',
  'https://picsum.photos/seed/rev-b/200/200',
  'https://picsum.photos/seed/rev-c/200/200',
];

export default function Reviews({ productId, baseRating, baseCount }) {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [helpful, setHelpful] = useState({});
  const [filter, setFilter] = useState('ALL');
  const [sort, setSort] = useState('recent');
  const [limit, setLimit] = useState(4);
  const [form, setForm] = useState({ rating: 0, title: '', body: '' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    reviewService.list(productId)
      .then((list) => { if (active) setReviews(list || []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [productId]);

  const summary = useMemo(() => summarize(reviews), [reviews]);
  const average = summary.total ? summary.average : Number(baseRating) || 0;
  const totalCount = Math.max(summary.total, Number(baseCount) || 0);

  // Distribution counts: use real data when we have enough, else synthesize a
  // representative spread scaled to the aggregate review count (for display parity).
  const dist = useMemo(() => {
    if (summary.total >= 5) return [5, 4, 3, 2, 1].map((s) => summary.dist[s - 1]);
    const weights = [0.65, 0.2, 0.08, 0.04, 0.03]; // 5★..1★
    return weights.map((w) => Math.round(w * totalCount));
  }, [summary, totalCount]);

  const submit = async () => {
    if (form.rating === 0) { toast.error('Please select a star rating'); return; }
    if (!form.body.trim()) { toast.error('Please write a few words'); return; }
    setSubmitting(true);
    try {
      const saved = await reviewService.submit(productId, {
        rating: form.rating, title: form.title.trim(), body: form.body.trim(), author: user?.name || 'You',
      });
      setReviews((list) => [{ ...saved, verified: true }, ...list]);
      toast.success('Thanks for your review!');
      setForm({ rating: 0, title: '', body: '' });
      setShowForm(false);
    } catch {
      toast.error('Could not submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const visible = useMemo(() => {
    let list = [...reviews];
    if (filter !== 'ALL') list = list.filter((r) => Math.round(r.rating) === Number(filter));
    if (sort === 'high') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'low') list.sort((a, b) => a.rating - b.rating);
    else list.sort((a, b) => new Date(b.date) - new Date(a.date));
    return list;
  }, [reviews, filter, sort]);

  const chips = [
    { key: 'ALL', label: `All (${totalCount})` },
    ...[5, 4, 3, 2, 1].map((s, i) => ({ key: String(s), label: `${s} ★ (${dist[i]})` })),
  ];

  return (
    <section className="mt-10 card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-ink">Customer Reviews &amp; Ratings</h2>
        {isAuthenticated ? (
          <button onClick={() => setShowForm((v) => !v)} className="btn-outline h-9 text-sm"><PenLine className="h-4 w-4" /> Write a review</button>
        ) : (
          <Link to="/login" state={{ from: window.location.pathname }} className="btn-outline h-9 text-sm"><PenLine className="h-4 w-4" /> Sign in to review</Link>
        )}
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Summary */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-5xl font-bold text-ink">{average.toFixed(1)}</span>
            <Star className="h-8 w-8 fill-emerald-500 text-emerald-500" />
          </div>
          <p className="mt-1 text-sm text-ink-muted">Based on {totalCount.toLocaleString('en-IN')} reviews</p>
          <div className="mt-4 space-y-2">
            {[5, 4, 3, 2, 1].map((star, i) => {
              const pct = totalCount ? Math.round((dist[i] / totalCount) * 100) : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="flex w-8 items-center gap-0.5 text-ink-soft">{star}<Star className="h-3 w-3 fill-amber-400 text-amber-400" /></span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right text-ink-muted">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* List side */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <button key={c.key} onClick={() => setFilter(c.key)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    filter === c.key ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-ink-soft hover:border-slate-300'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:border-brand-500 focus:outline-none">
              <option value="recent">Most Recent</option>
              <option value="high">Highest Rated</option>
              <option value="low">Lowest Rated</option>
            </select>
          </div>

          {/* Write form */}
          {showForm && (
            <div className="mt-4 rounded-xl border border-slate-200 p-4 animate-slide-up">
              <StarPicker value={form.rating} onChange={(r) => setForm((f) => ({ ...f, rating: r }))} />
              <input className="field mt-3" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title (optional)" />
              <textarea rows={3} className="field mt-3 resize-none" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} placeholder="Share your experience..." />
              <div className="mt-3 flex gap-2">
                <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
                <button onClick={submit} disabled={submitting} className="btn-primary">{submitting ? <Spinner /> : null}{submitting ? 'Submitting...' : 'Submit'}</button>
              </div>
            </div>
          )}

          {/* Reviews */}
          {loading ? (
            <div className="flex justify-center py-12 text-brand-600"><Spinner className="h-7 w-7" /></div>
          ) : visible.length === 0 ? (
            <div className="mt-6 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 py-12 text-center">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <p className="text-sm text-ink-muted">No reviews in this filter yet.</p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-100">
              {visible.slice(0, limit).map((r, idx) => {
                const liked = helpful[r.id];
                const likes = (r.helpful ?? 23 - idx * 4) + (liked ? 1 : 0);
                return (
                  <div key={r.id} className="py-5 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-700 text-sm font-semibold text-white">{initials(r.author)}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-ink">{r.author}</span>
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700"><BadgeCheck className="h-3 w-3" /> Verified Purchase</span>
                          </div>
                          <Stars value={r.rating} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted">{timeAgo(r.date)}</span>
                        <MoreVertical className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                    {r.title && <p className="mt-2 text-sm font-semibold text-ink">{r.title}</p>}
                    <p className="mt-1 text-sm text-ink-soft">{r.body}</p>
                    {idx === 0 && (
                      <div className="mt-3 flex gap-2">
                        {SAMPLE_IMAGES.map((src) => (
                          <img key={src} src={src} alt="Review" className="h-16 w-16 rounded-lg object-cover" />
                        ))}
                      </div>
                    )}
                    <button onClick={() => setHelpful((h) => ({ ...h, [r.id]: !h[r.id] }))}
                      className={`mt-3 inline-flex items-center gap-1.5 text-xs font-medium ${liked ? 'text-brand-700' : 'text-ink-muted hover:text-ink'}`}>
                      <ThumbsUp className={`h-3.5 w-3.5 ${liked ? 'fill-brand-600 text-brand-600' : ''}`} /> Helpful ({likes})
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && visible.length > limit && (
            <button onClick={() => setLimit((l) => l + 6)} className="mt-4 w-full rounded-xl border border-slate-200 py-3 text-center text-sm font-medium text-brand-700 hover:bg-slate-50">
              View All Reviews
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
