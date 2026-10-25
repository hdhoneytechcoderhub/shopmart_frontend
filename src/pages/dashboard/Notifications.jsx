import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  Bell, CheckCheck, Trash2, ChevronDown, Package, Truck, Tag, BellRing, User, Sparkles, Mail, Smartphone,
} from 'lucide-react';
import {
  setNotifications, markRead, markAllRead, removeNotification,
  selectNotifications, selectUnreadCount, selectNotificationsInitialized,
} from '../../redux/slices/notificationSlice';
import { notificationService } from '../../services/notificationService';
import { notifMeta } from '../../components/notifications/notifIcons';
import { timeAgo } from '../../utils/format';
import EmptyState from '../../components/common/EmptyState';

const TABS = ['All', 'Orders', 'Offers', 'Account', 'Updates', 'Others'];
const TAB_TO_CAT = { Orders: 'ORDER', Offers: 'OFFER', Account: 'ACCOUNT', Updates: 'UPDATES', Others: 'OTHER' };

const PREFS = [
  { key: 'orderUpdates', icon: Package, title: 'Order Updates', desc: 'Get notified about order status', on: true },
  { key: 'shipping', icon: Truck, title: 'Shipping Updates', desc: 'Get notified about shipping & delivery', on: true },
  { key: 'offers', icon: Tag, title: 'Offers & Deals', desc: 'Get notified about offers and discounts', on: true },
  { key: 'price', icon: BellRing, title: 'Price Alerts', desc: 'Get notified about price drops', on: true },
  { key: 'account', icon: User, title: 'Account Updates', desc: 'Get notified about account activities', on: true },
  { key: 'newArrivals', icon: Sparkles, title: 'New Arrivals', desc: 'Get notified about new products', on: false },
  { key: 'newsletter', icon: Mail, title: 'Newsletter', desc: 'Receive our newsletter and updates', on: false },
];

function Toggle({ on, onClick }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={on}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? 'bg-brand-600' : 'bg-slate-300'}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

export default function Notifications() {
  const dispatch = useDispatch();
  const items = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);
  const initialized = useSelector(selectNotificationsInitialized);
  const [tab, setTab] = useState('All');
  const [limit, setLimit] = useState(6);
  const [prefs, setPrefs] = useState(() => Object.fromEntries(PREFS.map((p) => [p.key, p.on])));

  useEffect(() => {
    if (initialized) return;
    let active = true;
    notificationService.list()
      .then((list) => { if (active) dispatch(setNotifications(list)); })
      .catch(() => {});
    return () => { active = false; };
  }, [initialized, dispatch]);

  const onRead = (n) => { if (!n.read) { dispatch(markRead(n.id)); notificationService.markRead(n.id); } };
  const onMarkAll = () => { dispatch(markAllRead()); notificationService.markAllRead(); };

  const filtered = items.filter((n) => (tab === 'All' ? true : n.category === TAB_TO_CAT[tab]));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Center: list */}
      <div className="card p-0">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-ink">Notifications</h1>
            {unread > 0 && <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">{unread} Unread</span>}
          </div>
          {unread > 0 && (
            <button onClick={onMarkAll} className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
              <CheckCheck className="h-4 w-4" /> Mark all as read
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-4">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition ${
                tab === t ? 'text-brand-700' : 'text-ink-muted hover:text-ink'}`}>
              {t}
              {tab === t && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-600" />}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Bell} title="Nothing here" description="Notifications in this category will show up here."
              action={<Link to="/shop" className="btn-primary">Browse products</Link>} />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {filtered.slice(0, limit).map((n) => {
                const { Icon, tone } = notifMeta(n.icon);
                const inner = (
                  <div className={`flex gap-4 px-6 py-4 transition hover:bg-slate-50/60 ${n.read ? '' : 'bg-brand-50/30'}`}>
                    <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${tone}`}><Icon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <p className="mt-0.5 text-sm text-ink-muted">{n.body}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="whitespace-nowrap text-xs text-ink-muted">{timeAgo(n.createdAt)}</span>
                      {!n.read && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
                    </div>
                  </div>
                );
                return (
                  <li key={n.id} className="group relative">
                    {n.link ? <Link to={n.link} onClick={() => onRead(n)}>{inner}</Link> : <button onClick={() => onRead(n)} className="w-full text-left">{inner}</button>}
                    <button onClick={() => dispatch(removeNotification(n.id))}
                      className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-red-600 group-hover:block"
                      aria-label="Dismiss"><Trash2 className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
            {filtered.length > limit && (
              <button onClick={() => setLimit((l) => l + 6)} className="flex w-full items-center justify-center gap-1.5 border-t border-slate-100 py-3.5 text-sm font-medium text-brand-700 hover:bg-slate-50">
                Load More <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Right: preferences */}
      <aside className="space-y-4">
        <div className="card p-5">
          <h2 className="font-semibold text-ink">Notification Preferences</h2>
          <p className="text-xs text-ink-muted">Choose what you want to be notified about.</p>
          <div className="mt-4 space-y-4">
            {PREFS.map((p) => (
              <div key={p.key} className="flex items-center gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-ink-soft"><p.icon className="h-4.5 w-4.5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-ink-muted">{p.desc}</p>
                </div>
                <Toggle on={prefs[p.key]} onClick={() => setPrefs((s) => ({ ...s, [p.key]: !s[p.key] }))} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="inline-flex items-center gap-2 font-semibold text-ink"><Smartphone className="h-4 w-4 text-brand-600" /> Stay Updated on Mobile</h3>
          <p className="mt-1 text-xs text-ink-muted">Enable push notifications on your mobile device to get instant updates.</p>
          <button className="btn-outline mt-3 w-full text-sm"><BellRing className="h-4 w-4" /> Enable Push Notifications</button>
        </div>
      </aside>
    </div>
  );
}
