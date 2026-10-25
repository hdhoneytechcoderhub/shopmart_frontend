import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCheck } from 'lucide-react';
import {
  setNotifications, markRead, markAllRead,
  selectNotifications, selectUnreadCount, selectNotificationsInitialized,
} from '../../redux/slices/notificationSlice';
import { notificationService } from '../../services/notificationService';
import { notifMeta } from '../notifications/notifIcons';
import { useAuth } from '../../hooks/useAuth';
import { timeAgo } from '../../utils/format';

export default function NotificationBell() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const items = useSelector(selectNotifications);
  const unread = useSelector(selectUnreadCount);
  const initialized = useSelector(selectNotificationsInitialized);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || initialized) return;
    let active = true;
    notificationService.list()
      .then((list) => { if (active) dispatch(setNotifications(list)); })
      .catch(() => {});
    return () => { active = false; };
  }, [isAuthenticated, initialized, dispatch]);

  if (!isAuthenticated) return null;

  const onItemClick = (n) => {
    if (!n.read) { dispatch(markRead(n.id)); notificationService.markRead(n.id); }
    setOpen(false);
  };

  const onMarkAll = () => { dispatch(markAllRead()); notificationService.markAllRead(); };

  const recent = items.slice(0, 6);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 180)}
        className="relative btn-ghost h-10 w-10 p-0"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 animate-slide-up overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-pop">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="font-semibold text-ink">Notifications</p>
            {unread > 0 && (
              <button onMouseDown={onMarkAll} className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800">
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          {recent.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">You’re all caught up.</p>
          ) : (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
              {recent.map((n) => {
                const { Icon, tone } = notifMeta(n.icon);
                const body = (
                  <div className={`flex gap-3 px-4 py-3 transition hover:bg-slate-50 ${n.read ? '' : 'bg-brand-50/40'}`}>
                    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${tone}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-ink-muted">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-500" />}
                  </div>
                );
                return (
                  <li key={n.id}>
                    {n.link ? (
                      <Link to={n.link} onMouseDown={() => onItemClick(n)}>{body}</Link>
                    ) : (
                      <button className="w-full text-left" onMouseDown={() => onItemClick(n)}>{body}</button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Link
            to="/dashboard/notifications"
            onMouseDown={() => setOpen(false)}
            className="block border-t border-slate-100 px-4 py-3 text-center text-sm font-medium text-brand-700 hover:bg-slate-50"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
