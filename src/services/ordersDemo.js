import { mockOrders } from './mockAccount';

// Persistent demo orders so the place-order → success → tracking → invoice chain
// works standalone. Newly placed orders are saved to localStorage and merged with
// the seeded demo history.
const KEY = 'sm_demo_orders_v1';

const read = () => {
  try { const raw = localStorage.getItem(KEY); if (raw) { const p = JSON.parse(raw); if (Array.isArray(p)) return p; } }
  catch { /* ignore */ }
  return [];
};
const write = (list) => { try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore */ } };

// Five-stage tracking timeline used across the app.
const newTracking = (placedAt) => ([
  { label: 'Order Placed', date: placedAt, done: true, note: 'ShopMart Warehouse' },
  { label: 'Packed', date: null, done: false },
  { label: 'Shipped', date: null, done: false },
  { label: 'Out for Delivery', date: null, done: false },
  { label: 'Delivered', date: null, done: false },
]);

export const ordersDemo = {
  all() {
    // Placed (local) orders first, then the seeded demo history.
    return [...read(), ...mockOrders];
  },

  byId(id) {
    const all = this.all();
    return all.find((o) => String(o.id).toLowerCase() === String(id).toLowerCase()) || null;
  },

  place(payload) {
    const now = new Date().toISOString();
    const id = `SM-${Date.now().toString().slice(-6)}`;
    const eta = new Date(Date.now() + 4 * 86400000).toISOString();
    // Order is created BEFORE payment → starts PENDING / PAYMENT_INITIATED.
    const order = {
      id,
      createdAt: now,
      status: payload.status || 'PAYMENT_INITIATED',
      paymentMethod: 'Razorpay',
      paymentStatus: payload.paymentStatus || 'PENDING',
      razorpayOrderId: payload.razorpayOrderId || null,
      razorpayPaymentId: payload.paymentId || null,
      courier: 'ShopMart Logistics',
      trackingId: `SMX${Date.now().toString().slice(-10)}`,
      estimatedDelivery: eta,
      items: payload.items || [],
      subtotal: payload.subtotal || 0,
      shipping: payload.shipping || 0,
      discount: payload.discount || 0,
      total: payload.amount ?? payload.total ?? 0,
      couponCode: payload.couponCode || null,
      address: payload.shippingAddress || payload.address || {},
      tracking: newTracking(now).map((t, i) => (i === 0 ? { ...t, done: true } : t)),
    };
    write([order, ...read()]);
    return order;
  },

  // After a verified payment: mark PAID + CONFIRMED and record the Razorpay ids.
  markPaid(id, { paymentId, razorpayOrderId, razorpaySignature } = {}) {
    const list = read();
    const idx = list.findIndex((o) => String(o.id) === String(id));
    if (idx === -1) return null;
    const now = new Date().toISOString();
    list[idx] = {
      ...list[idx],
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      razorpayPaymentId: paymentId || list[idx].razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || list[idx].razorpayOrderId,
      razorpaySignature: razorpaySignature || null,
      tracking: list[idx].tracking.map((t, i) => (i <= 1 ? { ...t, done: true, date: t.date || (i === 1 ? now : t.date) } : t)),
    };
    write(list);
    return list[idx];
  },
};

export default ordersDemo;
