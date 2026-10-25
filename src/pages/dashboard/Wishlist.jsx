import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Heart, Share2, Check, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { selectWishlist } from '../../redux/slices/wishlistSlice';
import ProductGrid from '../../components/product/ProductGrid';
import EmptyState from '../../components/common/EmptyState';

export default function Wishlist() {
  const items = useSelector(selectWishlist);
  const [copied, setCopied] = useState(false);

  const shareUrl = items.length
    ? `${window.location.origin}/wishlist/shared?items=${items.map((p) => p.id).join(',')}`
    : '';

  const share = async () => {
    if (!shareUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My ShopMart wishlist', text: 'Check out my wishlist on ShopMart', url: shareUrl });
        return;
      }
    } catch { /* user cancelled — fall through to copy */ }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy link');
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-ink">My wishlist</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {items.length > 0 ? `${items.length} item(s) saved for later.` : 'Save products you love to find them easily later.'}
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={share} className="btn-outline h-9 text-sm">
            {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Share2 className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Share wishlist'}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm dark:border-slate-800">
          <input readOnly value={shareUrl} className="min-w-0 flex-1 truncate bg-transparent px-2 text-ink-muted outline-none" />
          <button onClick={share} className="btn-ghost h-8 shrink-0 px-2 text-xs"><Copy className="h-3.5 w-3.5" /> Copy</button>
        </div>
      )}

      <div className="mt-6">
        {items.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your wishlist is empty"
            description="Tap the heart on any product to save it here."
            action={<Link to="/shop" className="btn-primary">Discover products</Link>}
          />
        ) : (
          <ProductGrid products={items} />
        )}
      </div>
    </div>
  );
}
