import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getAccessToken, refreshAccessToken, DEMO_MODE } from '../../services/api';
import { getTokenExpiry } from '../../utils/jwt';

const WARN_BEFORE_MS = 2 * 60 * 1000; // show the warning 2 minutes before expiry
const CHECK_INTERVAL_MS = 10 * 1000;
// Demo-mode / non-JWT tokens have no real `exp` claim to read — fall back to
// a fixed session length from when the tab loaded, so the feature is fully
// demoable without a real backend. Real JWT expiry (when available) is used
// instead and takes priority.
const DEMO_SESSION_LENGTH_MS = 30 * 60 * 1000;

export default function SessionTimeoutWarning() {
  const { isAuthenticated, logout } = useAuth();
  const [msLeft, setMsLeft] = useState(null);
  const [visible, setVisible] = useState(false);
  const [extending, setExtending] = useState(false);
  const demoStartRef = useRef(Date.now());

  useEffect(() => {
    if (!isAuthenticated) { setVisible(false); return undefined; }

    const tick = () => {
      const token = getAccessToken();
      const realExpiry = getTokenExpiry(token);
      const expiryMs = realExpiry ? realExpiry.getTime() : demoStartRef.current + DEMO_SESSION_LENGTH_MS;
      const remaining = expiryMs - Date.now();
      setMsLeft(remaining);
      setVisible(remaining <= WARN_BEFORE_MS && remaining > -5000);
      if (remaining <= 0) logout();
    };

    tick();
    const interval = setInterval(tick, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, logout]);

  const stayLoggedIn = async () => {
    setExtending(true);
    try {
      if (DEMO_MODE) {
        // No real backend to refresh against — just push the demo session
        // window forward so the warning clears, honestly labeled as demo.
        demoStartRef.current = Date.now();
      } else {
        await refreshAccessToken();
      }
      setVisible(false);
    } catch {
      logout();
    } finally {
      setExtending(false);
    }
  };

  if (!visible || msLeft == null) return null;

  const seconds = Math.max(0, Math.floor(msLeft / 1000));
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-start sm:justify-end sm:pt-20">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-pop ring-1 ring-slate-200 animate-slide-up">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600"><AlertTriangle className="h-5 w-5" /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-ink">Your session is about to expire</h3>
            <p className="mt-1 text-sm text-ink-muted">
              You'll be signed out in <span className="font-mono font-semibold text-ink">{mm}:{ss}</span> due to inactivity.
              {DEMO_MODE && ' (demo mode — no real backend session)'}
            </p>
            <div className="mt-3 flex gap-2">
              <button onClick={stayLoggedIn} disabled={extending} className="btn-primary h-9 text-sm">
                {extending ? 'Extending…' : 'Stay signed in'}
              </button>
              <button onClick={logout} className="btn-ghost h-9 text-sm">Log out</button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
