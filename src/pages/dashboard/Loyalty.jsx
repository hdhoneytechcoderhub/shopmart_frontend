import { Award, Gift, TrendingUp, History, Star } from 'lucide-react';
import { loyaltyService } from '../../services/loyaltyService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice, timeAgo } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

/** Safe toLocaleString — returns '0' if value is not a finite number. */
const safeLocale = (v) => (Number.isFinite(v) ? v.toLocaleString('en-IN') : '0');

export default function Loyalty() {
  const { data, loading } = useFetch(() => loyaltyService.getSummary(), []);

  if (loading || !data) {
    return (
      <div>
        <h1 className="mb-1 text-2xl font-bold text-ink">Loyalty & Rewards</h1>
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      </div>
    );
  }

  const points = data.points ?? 0;
  const lifetimePoints = data.lifetimePoints ?? 0;
  const tier = data.tier ?? 'Silver';
  const tierRate = data.tierRate ?? 1;
  const nextTier = data.nextTier ?? null;
  const pointsToNextTier = data.pointsToNextTier ?? 0;
  const valueInRupees = data.valueInRupees ?? 0;
  const tiers = Array.isArray(data.tiers) ? data.tiers : [];
  const history = Array.isArray(data.history) ? data.history : [];

  const progress = nextTier
    ? Math.min(100, Math.round((points / (points + pointsToNextTier)) * 100))
    : 100;

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-ink">Loyalty & Rewards</h1>
      <p className="mb-6 text-sm text-ink-muted">Earn points on every order and redeem them at checkout.</p>

      {/* Points hero */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-500 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm/none opacity-80">Available points</p>
            <p className="mt-1 text-4xl font-bold">{safeLocale(points)}</p>
            <p className="mt-1 text-sm opacity-90">Worth {formatPrice(valueInRupees)} at checkout</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-medium">
            <Award className="h-4 w-4" /> {tier} member
          </span>
        </div>

        {nextTier && (
          <div className="mt-5">
            <div className="flex justify-between text-xs opacity-90">
              <span>{tier}</span>
              <span>{safeLocale(pointsToNextTier)} pts to {nextTier}</span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <TrendingUp className="h-5 w-5 text-brand-600" />
          <p className="mt-2 text-xl font-bold text-ink">{safeLocale(lifetimePoints)}</p>
          <p className="text-xs text-ink-muted">Lifetime points</p>
        </div>
        <div className="card p-4">
          <Star className="h-5 w-5 text-amber-500" />
          <p className="mt-2 text-xl font-bold text-ink">{tierRate}x</p>
          <p className="text-xs text-ink-muted">Earn rate</p>
        </div>
        <div className="card p-4">
          <Gift className="h-5 w-5 text-emerald-600" />
          <p className="mt-2 text-xl font-bold text-ink">{formatPrice(valueInRupees)}</p>
          <p className="text-xs text-ink-muted">Redeemable value</p>
        </div>
      </div>

      {/* Tiers */}
      <h2 className="mb-3 mt-8 font-semibold text-ink">Membership tiers</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((t) => (
          <div key={t.name} className={`card p-5 ${t.name === tier ? 'ring-2 ring-brand-500' : ''}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-ink">{t.name}</h3>
              {t.name === tier && <span className="badge bg-brand-100 text-brand-700">Current</span>}
            </div>
            <p className="mt-1 text-xs text-ink-muted">{safeLocale(t.min)}+ points</p>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {Array.isArray(t.perks) && t.perks.map((p) => <li key={p} className="flex gap-2"><Star className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" /> {p}</li>)}
            </ul>
          </div>
        ))}
      </div>

      {/* History */}
      <h2 className="mb-3 mt-8 inline-flex items-center gap-2 font-semibold text-ink"><History className="h-4 w-4 text-brand-600" /> Points history</h2>
      <div className="card divide-y divide-slate-100">
        {history.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-ink-muted">No points history yet.</p>
        )}
        {history.map((h) => (
          <div key={h.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">{h.reason}</p>
              <p className="text-xs text-ink-muted">{timeAgo(h.at)}</p>
            </div>
            <span className={`text-sm font-semibold ${(h.points ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {(h.points ?? 0) >= 0 ? '+' : ''}{h.points ?? 0} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
