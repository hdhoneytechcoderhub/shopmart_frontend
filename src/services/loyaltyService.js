import api, { DEMO_MODE } from './api';

// ── Loyalty tiers (shared between demo and live) ─────────────────────────
export const LOYALTY_TIERS = [
  { name: 'Silver', min: 0, rate: 1, perks: ['1 point per ₹100', 'Birthday reward'] },
  { name: 'Gold', min: 1000, rate: 1.5, perks: ['1.5 points per ₹100', 'Free shipping', 'Early sale access'] },
  { name: 'Platinum', min: 5000, rate: 2, perks: ['2 points per ₹100', 'Priority support', 'Exclusive drops'] },
];

const tierFor = (pts) => [...LOYALTY_TIERS].reverse().find((t) => pts >= t.min) || LOYALTY_TIERS[0];
const nextTierFor = (pts) => LOYALTY_TIERS.find((t) => t.min > pts) || null;

// ── Demo data ───────────────────────────────────────────────────────────
const daysAgo = (d) => { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString(); };

const demoSummary = () => {
  const points = 2480;
  const tier = tierFor(points);
  const next = nextTierFor(points);
  return {
    points,
    lifetimePoints: 6120,
    tier: tier.name,
    tierRate: tier.rate,
    nextTier: next ? next.name : null,
    pointsToNextTier: next ? next.min - points : 0,
    valueInRupees: Math.round(points / 5),
    tiers: LOYALTY_TIERS,
    history: [
      { id: 'L-1', type: 'EARNED', points: 84, reason: 'Order #SM-100238', at: daysAgo(2) },
      { id: 'L-2', type: 'REDEEMED', points: -500, reason: 'Redeemed at checkout', at: daysAgo(9) },
      { id: 'L-3', type: 'EARNED', points: 55, reason: 'Order #SM-100195', at: daysAgo(15) },
      { id: 'L-4', type: 'EARNED', points: 200, reason: 'Birthday bonus', at: daysAgo(21) },
      { id: 'L-5', type: 'EARNED', points: 110, reason: 'Order #SM-100150', at: daysAgo(34) },
    ],
  };
};

// ── Backend response normalizer ──────────────────────────────────────────
// Backend GET /loyalty/me returns { balance, pointValue, redeemableValue }.
// Backend GET /loyalty/me/transactions returns [{ id, points, type, description, createdAt }].
// Frontend expects { points, lifetimePoints, tier, tierRate, nextTier,
//   pointsToNextTier, valueInRupees, tiers, history }.
const normalizeSummary = (balanceResp, txnList) => {
  const points = balanceResp?.balance ?? 0;
  const tier = tierFor(points);
  const next = nextTierFor(points);

  const history = Array.isArray(txnList)
    ? txnList.map((t) => ({
        id: t.id,
        type: t.type,
        points: t.points,
        reason: t.description || t.type,
        at: t.createdAt,
      }))
    : [];

  // Lifetime = sum of all positive transactions (earned + adjusted up)
  const lifetimePoints = history
    .filter((h) => h.points > 0)
    .reduce((sum, h) => sum + h.points, 0) || points;

  return {
    points,
    lifetimePoints,
    tier: tier.name,
    tierRate: tier.rate,
    nextTier: next ? next.name : null,
    pointsToNextTier: next ? next.min - points : 0,
    valueInRupees: balanceResp?.redeemableValue ?? Math.round(points / 5),
    tiers: LOYALTY_TIERS,
    history,
  };
};

export const loyaltyService = {
  getSummary: async () => {
    if (DEMO_MODE) return demoSummary();
    try {
      // Fetch balance + transactions in parallel, then merge into the shape Loyalty.jsx expects.
      const [balanceResp, txnResp] = await Promise.all([
        api.get('/loyalty/me').then((r) => r.data).catch(() => null),
        api.get('/loyalty/me/transactions').then((r) => r.data).catch(() => []),
      ]);

      // If the balance call returned something usable, normalize it.
      if (balanceResp && typeof balanceResp === 'object' && (balanceResp.balance != null || balanceResp.points != null)) {
        // Backend already returned the enriched shape (points field present) — use as-is.
        if (balanceResp.points != null && balanceResp.tier) return balanceResp;
        // Backend returned the minimal { balance } shape — enrich it.
        return normalizeSummary(balanceResp, txnResp);
      }

      // Fallback: no account exists yet or server returned empty.
      return demoSummary();
    } catch {
      return demoSummary();
    }
  },

  getTiers: async () => {
    if (DEMO_MODE) return LOYALTY_TIERS;
    try {
      const { data } = await api.get('/loyalty/tiers');
      return Array.isArray(data) && data.length ? data : LOYALTY_TIERS;
    } catch { return LOYALTY_TIERS; }
  },

  // Redeem points → discount. Best-effort; returns the rupee value redeemed.
  redeem: async (points) => {
    if (DEMO_MODE) return { redeemed: points, value: Math.round(points / 5) };
    try {
      const { data } = await api.post('/loyalty/redeem', { points });
      return data ?? { redeemed: points, value: Math.round(points / 5) };
    } catch (err) {
      if (!err?.response) return { redeemed: points, value: Math.round(points / 5) };
      throw err;
    }
  },
};

export default loyaltyService;
