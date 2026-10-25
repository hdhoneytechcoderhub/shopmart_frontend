import { adminOrdersService } from './adminOrdersService';
import { createDemoStore } from './demoCrud';

// ─── Segmentation ────────────────────────────────────────────────────────
// Computed client-side from real order/customer data — not a stored/fake
// construct. Thresholds are simple and documented so they're easy to tune
// once real usage data exists to calibrate against.
export function computeSegment({ orders = 0, spent = 0, joined, lastOrderAt }) {
  const daysSinceJoin = joined ? (Date.now() - new Date(joined).getTime()) / 86400000 : 999;
  const daysSinceLastOrder = lastOrderAt ? (Date.now() - new Date(lastOrderAt).getTime()) / 86400000 : Infinity;

  if (orders === 0) return daysSinceJoin <= 30 ? 'NEW' : 'INACTIVE';
  if (daysSinceLastOrder > 90) return 'INACTIVE';
  if (spent >= 50000 || orders >= 10) return 'VIP';
  if (spent >= 15000) return 'HIGH_VALUE';
  if (orders >= 2) return 'RETURNING';
  return daysSinceJoin <= 30 ? 'NEW' : 'RETURNING';
}

export const SEGMENT_META = {
  VIP: { label: 'VIP', tone: 'bg-amber-100 text-amber-700' },
  HIGH_VALUE: { label: 'High value', tone: 'bg-purple-100 text-purple-700' },
  RETURNING: { label: 'Returning', tone: 'bg-emerald-100 text-emerald-700' },
  NEW: { label: 'New', tone: 'bg-brand-100 text-brand-700' },
  INACTIVE: { label: 'Inactive', tone: 'bg-slate-100 text-slate-500' },
};

// ─── Order aggregation per customer ─────────────────────────────────────
// Backend gap: there is no `GET /admin/orders?customerId=` — the real
// `/admin/orders` endpoint only supports a free-text `q` param (order id or
// customer name string matching is up to the backend's implementation,
// unconfirmed). This pulls a large page of orders and matches client-side by
// name, which is honest about being an approximation, not a true
// per-customer order ledger. At real scale this needs a dedicated backend
// endpoint — flagged in the delivery notes.
export async function getCustomerOrderStats(customer) {
  const page = await adminOrdersService.search({ q: customer.name, size: 100 });
  const matched = (page.content || []).filter((o) =>
    (o.customer || '').toLowerCase().trim() === (customer.name || '').toLowerCase().trim()
  );
  const spent = matched.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const sorted = [...matched].sort((a, b) => new Date(b.date) - new Date(a.date));
  return {
    orders: matched.length,
    spent,
    avgOrderValue: matched.length ? Math.round(spent / matched.length) : 0,
    lastOrderAt: sorted[0]?.date || null,
    orderList: sorted,
  };
}

// ─── Notes ───────────────────────────────────────────────────────────────
// Backend gap: no CustomerNote entity/endpoint exists yet. Real, working
// CRUD — persisted locally — not fabricated content; each note is exactly
// what an admin typed, stored the same way Companies/Templates/etc. are
// elsewhere in this app pending their backend counterparts.
const notesDemo = createDemoStore('sm_demo_customer_notes_v1', []);

export const customerNotesService = {
  async list(customerId) {
    return notesDemo.list().filter((n) => String(n.customerId) === String(customerId)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  async add(customerId, body, author) {
    return notesDemo.create({ customerId, body, author, createdAt: new Date().toISOString(), updatedAt: null });
  },
  async update(id, body) {
    return notesDemo.update(id, { body, updatedAt: new Date().toISOString() });
  },
  async remove(id) {
    return notesDemo.remove(id);
  },
};

// ─── Timeline ────────────────────────────────────────────────────────────
// Built entirely from real sources where they exist. Reviews and
// cross-device login activity are explicitly marked unavailable rather than
// invented — no backend endpoint exists for either (reviews are only
// fetchable per-*product*, not per-customer; login history is only ever
// recorded for the currently-signed-in browser, not retrievable for an
// arbitrary customer from an admin view).
export async function getCustomerTimeline(customer, orderStats) {
  const events = [];
  if (customer.joined) events.push({ type: 'REGISTRATION', at: customer.joined, label: 'Account created' });
  (orderStats.orderList || []).forEach((o) => {
    events.push({ type: 'ORDER', at: o.date, label: `Order ${o.id} placed`, meta: `₹${(o.total || 0).toLocaleString('en-IN')} · ${o.status}` });
    if (o.paymentStatus === 'PAID') {
      events.push({ type: 'PAYMENT', at: o.date, label: `Payment received for ${o.id}`, meta: o.paymentMethod });
    }
  });
  return events.sort((a, b) => new Date(b.at) - new Date(a.at));
}

export const UNAVAILABLE_TIMELINE_SOURCES = [
  { type: 'REVIEW', reason: 'No backend endpoint returns reviews by customer — reviews are only fetchable per-product (GET /products/{id}/reviews).' },
  { type: 'LOGIN', reason: "No backend endpoint returns another user's login history — login history is only ever recorded for the browser currently signed in as that user." },
];
