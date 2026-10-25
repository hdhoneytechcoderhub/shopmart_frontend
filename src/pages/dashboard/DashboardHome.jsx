import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Heart, MapPin, Wallet, ArrowRight, ShoppingBag } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { accountService } from '../../services/accountService';
import { selectWishlist } from '../../redux/slices/wishlistSlice';
import { mockOrders, orderTotal } from '../../services/mockAccount';
import { ORDER_STATUS_META } from '../../utils/constants';
import { formatPrice, formatDate } from '../../utils/format';

export default function DashboardHome() {
  const { user } = useAuth();
  const wishlist = useSelector(selectWishlist);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    let active = true;
    accountService.getOrders()
      .then((data) => { if (active) setOrders(Array.isArray(data) ? data : data?.content || []); })
      .catch((err) => { if (active && !err?.response) setOrders(mockOrders); });
    return () => { active = false; };
  }, []);

  const recent = orders.slice(0, 3);
  const totalSpent = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + orderTotal(o), 0);

  const stats = [
    { icon: Package, label: 'Total orders', value: orders.length, to: '/dashboard/orders' },
    { icon: Heart, label: 'Wishlist items', value: wishlist.length, to: '/dashboard/wishlist' },
    { icon: Wallet, label: 'Total spent', value: formatPrice(totalSpent), to: '/dashboard/orders' },
    { icon: MapPin, label: 'Saved addresses', value: '—', to: '/dashboard/addresses' },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 p-8 text-white">
        <p className="text-brand-100">Welcome back,</p>
        <h1 className="font-display text-2xl font-bold">{user?.name || 'Shopper'}</h1>
        <p className="mt-2 max-w-md text-sm text-brand-100">
          Here’s a quick look at your account. Track orders, manage addresses, and pick up where you left off.
        </p>
        <Link to="/shop" className="btn-accent mt-5 w-fit">
          <ShoppingBag className="h-4 w-4" /> Continue shopping
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="card p-5 transition hover:shadow-pop">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 text-2xl font-bold text-ink">{s.value}</p>
            <p className="text-sm text-ink-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold text-ink">Recent orders</h2>
          <Link to="/dashboard/orders" className="link inline-flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-ink-muted">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {recent.map((o) => {
              const meta = ORDER_STATUS_META[o.status] || {};
              return (
                <li key={o.id} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{o.id}</p>
                    <p className="text-xs text-ink-muted">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
                  </div>
                  <span className={`badge ${meta.tone || ''}`}>{meta.label || o.status}</span>
                  <p className="hidden font-semibold text-ink sm:block">{formatPrice(orderTotal(o))}</p>
                  <Link to={`/dashboard/orders/${o.id}`} className="link text-sm">Details</Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
