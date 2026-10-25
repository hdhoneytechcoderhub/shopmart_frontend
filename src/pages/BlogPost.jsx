import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, ArrowLeft } from 'lucide-react';
import Breadcrumbs from '../components/common/Breadcrumbs';
import Loader from '../components/common/Loader';
import { formatDate } from '../utils/format';
import { blogService } from '../services/blogService';

export default function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    blogService.getBySlug(slug)
      .then((data) => { if (active) { if (data) setPost(data); else setNotFound(true); } })
      .catch(() => { if (active) setNotFound(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  if (loading) return <Loader label="Loading article…" />;

  if (notFound || !post) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold text-ink">Post not found</h1>
        <p className="mt-2 text-ink-muted">This article may have been unpublished or moved.</p>
        <Link to="/blog" className="btn-primary mt-6 inline-flex"><ArrowLeft className="h-4 w-4" /> Back to journal</Link>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-8">
      <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: post.title }]} />

      <header className="mt-6">
        {post.tag && <span className="chip w-fit">{post.tag}</span>}
        <h1 className="font-display mt-3 text-3xl font-bold leading-tight text-ink sm:text-4xl">{post.title}</h1>
        {post.date && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-muted">
            <Calendar className="h-4 w-4" /> {formatDate(post.date)}
          </p>
        )}
      </header>

      {post.cover && (
        <div className="mt-6 aspect-[16/9] overflow-hidden rounded-2xl">
          <img src={post.cover} alt={post.title} className="h-full w-full object-cover" />
        </div>
      )}

      <div className="prose prose-slate mt-8 max-w-none whitespace-pre-wrap text-ink">
        {post.content || post.excerpt}
      </div>

      <Link to="/blog" className="link mt-10 inline-flex items-center gap-1.5">
        <ArrowLeft className="h-4 w-4" /> Back to journal
      </Link>
    </div>
  );
}
