import api, { DEMO_MODE } from './api';

// Returns / RMA. In demo mode requests persist to localStorage (and broadcast a
// change event) so a customer-created return immediately shows in the admin
// returns queue — the same shared-store pattern used for product approvals.
const KEY = 'sm_demo_returns_v1';
const EVENT = 'sm:demo-returns-changed';

export const RETURN_STATUS = ['REQUESTED', 'APPROVED', 'REFUNDED', 'REJECTED', 'CANCELLED'];
export const RETURN_REASONS = [
  'Wrong size / fit', 'Damaged or defective', 'Not as described',
  'Changed my mind', 'Received wrong item', 'Quality not as expected',
];

const daysAgo = (d) => { const t = new Date(); t.setDate(t.getDate() - d); return t.toISOString(); };

const seed = () => ([
  {
    id: 'RMA-2041', orderId: 'SM-100195', customer: 'Dhaval Shah',
    product: 'Smart Fitness Watch', qty: 1, amount: 5499,
    reason: 'Damaged or defective', status: 'APPROVED',
    comment: 'Screen had a scratch on arrival.', createdAt: daysAgo(3), updatedAt: daysAgo(1),
  },
  {
    id: 'RMA-2038', orderId: 'SM-100182', customer: 'Aanya Rao',
    product: 'Running Shoes', qty: 1, amount: 2199,
    reason: 'Wrong size / fit', status: 'REFUNDED',
    comment: 'Need one size larger.', createdAt: daysAgo(10), updatedAt: daysAgo(6),
  },
  {
    id: 'RMA-2035', orderId: 'SM-100150', customer: 'Karthik Nair',
    product: 'Bluetooth Speaker', qty: 1, amount: 1799,
    reason: 'Changed my mind', status: 'REQUESTED',
    comment: '', createdAt: daysAgo(1), updatedAt: daysAgo(1),
  },
]);

const broadcast = () => { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT)); };

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; }
  } catch { /* re-seed */ }
  const s = seed();
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
  return s;
};

const write = (list) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ }
  broadcast();
};

export const subscribeReturns = (cb) => {
  if (typeof window === 'undefined') return () => {};
  const onCustom = () => cb();
  const onStorage = (e) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => { window.removeEventListener(EVENT, onCustom); window.removeEventListener('storage', onStorage); };
};

const asArray = (d) => (Array.isArray(d) ? d : d?.content || []);

// Backend ReturnResponse field names don't match what the return pages render
// (orderNumber vs orderId-as-display, productName vs product, customerName vs
// customer, refundAmount vs amount). Translate once here rather than touching
// every page.
const fromReturnApi = (r) => (r ? {
  ...r,
  orderId: r.orderNumber || r.orderId,
  product: r.itemCount > 1 ? `${r.productName || 'Item'} +${r.itemCount - 1} more` : r.productName,
  customer: r.customerName,
  amount: r.refundAmount,
} : r);

export const returnsService = {
  // Customer: my returns
  listMine: async () => {
    if (DEMO_MODE) return read();
    try { const { data } = await api.get('/returns'); const l = asArray(data).map(fromReturnApi); return l.length ? l : read(); }
    catch (err) { if (!err?.response) return read(); throw err; }
  },

  // Admin: all returns
  listAll: async () => {
    if (DEMO_MODE) return read();
    try { const { data } = await api.get('/returns/admin'); const l = asArray(data).map(fromReturnApi); return l.length ? l : read(); }
    catch (err) { if (!err?.response) return read(); throw err; }
  },

  // Customer: request a return
  create: async (payload) => {
    const record = {
      id: `RMA-${Math.floor(2000 + Math.random() * 8000)}`,
      status: 'REQUESTED',
      customer: payload.customer || 'You',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload,
    };
    if (DEMO_MODE) { const list = read(); list.unshift(record); write(list); return record; }
    try {
      const { data } = await api.post('/returns', payload);
      return data ? fromReturnApi(data) : record;
    } catch (err) {
      if (!err?.response) { const list = read(); list.unshift(record); write(list); return record; }
      throw err;
    }
  },

  // Admin: approve or reject a return. The backend only supports this binary
  // decision (POST /returns/admin/{id}/decision) — there's no arbitrary
  // status-setting endpoint, and approving auto-processes the refund
  // (status becomes REFUNDED automatically; there's no separate "mark
  // refunded" or "picked up" step to set manually).
  decide: async (id, approve, adminNote) => {
    if (DEMO_MODE) {
      const list = read();
      const idx = list.findIndex((r) => r.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], status: approve ? 'REFUNDED' : 'REJECTED', updatedAt: new Date().toISOString() };
        write(list);
        return list[idx];
      }
      return null;
    }
    try {
      const { data } = await api.post(`/returns/admin/${id}/decision`, { approve, adminNote });
      return data ? fromReturnApi(data) : { id, status: approve ? 'REFUNDED' : 'REJECTED' };
    } catch (err) {
      if (!err?.response) {
        const list = read(); const idx = list.findIndex((r) => r.id === id);
        if (idx !== -1) { list[idx] = { ...list[idx], status: approve ? 'REFUNDED' : 'REJECTED', updatedAt: new Date().toISOString() }; write(list); return list[idx]; }
        return null;
      }
      throw err;
    }
  },
};

export default returnsService;
