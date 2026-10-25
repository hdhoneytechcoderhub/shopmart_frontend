import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, Newspaper } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import EmptyState from '../components/common/EmptyState';
import Spinner from '../components/common/Spinner';
import { formatDate } from '../utils/format';
import { blogService } from '../services/blogService';

export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    blogService.listPublished({ size: 30 })
      .then((data) => { if (active) setPosts(data.content); })
      .catch(() => { if (active) setPosts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const list = posts || [];
  const [featured, ...rest] = list;

  return (
    <div className="container-page py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog' }]} />

      <header className="mt-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">The ShopMart Journal</h1>
        <p className="mt-3 text-ink-muted">
          Style notes, buying guides, and stories from behind the brand — fresh perspectives to help you shop smarter.
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : list.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Newspaper} title="No posts yet" description="Check back soon for style notes and stories." />
        </div>
      ) : (
        <>
          {/* Featured */}
          <article className="mt-8 grid overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card lg:grid-cols-2">
            {featured.cover && (
              <div className="aspect-[16/10] overflow-hidden lg:aspect-auto">
                <img src={featured.cover} alt={featured.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="flex flex-col justify-center gap-4 p-8">
              {featured.tag && <span className="chip w-fit">{featured.tag}</span>}
              <h2 className="font-display text-2xl font-bold leading-tight text-ink">{featured.title}</h2>
              <p className="text-ink-muted">{featured.excerpt}</p>
              <div className="flex items-center gap-4 text-sm text-ink-muted">
                {featured.date && (
                  <span className="inline-flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {formatDate(featured.date)}</span>
                )}
              </div>
              <Link to={`/blog/${featured.slug}`} className="link inline-flex w-fit items-center gap-1.5">
                Read article <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* Grid */}
          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <article key={post.id} className="card group overflow-hidden">
                  {post.cover && (
                    <div className="aspect-[16/10] overflow-hidden">
                      <img
                        src={post.cover}
                        alt={post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="space-y-3 p-5">
                    {post.tag && <span className="chip">{post.tag}</span>}
                    <h3 className="font-semibold leading-snug text-ink">{post.title}</h3>
                    <p className="text-sm text-ink-muted">{post.excerpt}</p>
                    <div className="flex items-center justify-between pt-1 text-xs text-ink-muted">
                      {post.date && (
                        <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {formatDate(post.date)}</span>
                      )}
                      <Link to={`/blog/${post.slug}`} className="link inline-flex items-center gap-1">
                        Read <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
