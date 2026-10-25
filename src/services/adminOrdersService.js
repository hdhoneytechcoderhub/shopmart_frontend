import api, { DEMO_MODE } from './api';
import { adminRecentOrders } from './adminMock';
import { ordersDemo } from './ordersDemo';
import { orderTotal } from './mockAccount';

// Admin order management. AdminOrders.jsx previously had ZERO service
// wiring — it built a one-time local seed from demo data and every status
// change only ever touched React state, so nothing persisted past a refresh.
//
// Backend gap: there is no admin-wide, paginated/searchable order-listing
// endpoint. The only admin-scoped order read is GET /admin/orders/recent
// (built for the dashboard's "recent orders" widget), which we reuse here
// with a larger `size` as a stand-in — search/filter still happens
// client-side over whatever that page returns. Ask for a real
// GET /admin/orders (search, pagination, date range) when there's time for it.
const buildDemoSeed = () => {
  const rich = ordersDemo.all().map((o) => ({
    id: o.id,
    orderId: o.id,
    customer: o.address?.name || 'Customer',
    date: o.createdAt,
    total: o.total ?? orderTotal(o),
    status: o.status,
    paymentMethod: 'Razorpay',
    paymentStatus: o.paymentStatus || 'PAID',
    razorpayOrderId: o.razorpayOrderId || null,
    razorpayPaymentId: o.razorpayPaymentId || o.paymentId || null,
  }));
  const extra = adminRecentOrders.map((o) => ({
    ...o, orderId: o.id, paymentMethod: 'Razorpay', paymentStatus: 'PAID',
    razorpayOrderId: `order_${String(o.id).replace(/\D/g, '')}`, razorpayPaymentId: `pay_${String(o.id).replace(/\D/g, '')}`,
  }));
  return [...rich, ...extra].filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);
};

export const adminOrdersService = {
  async list() {
    if (DEMO_MODE) return buildDemoSeed();
    try {
      const { data } = await api.get('/admin/orders/recent', { params: { size: 200 } });
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map((o) => ({
        ...o,
        paymentMethod: 'Razorpay',
        paymentStatus: 'PAID', // real per-order payment status isn't in this DTO yet
      }));
    } catch (err) {
      if (!err?.response) return buildDemoSeed();
      throw err;
    }
  },

  // Real server-side paginated + filterable order search — GET /admin/orders.
  // Replaces the old "fetch up to 200 recent and filter client-side" approach.
  async search({ status, q, page = 0, size = 20 } = {}) {
    if (DEMO_MODE) {
      const all = buildDemoSeed()
        .filter((o) => (status ? o.status === status : true))
        .filter((o) => !q || o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()));
      return { content: all.slice(page * size, page * size + size), totalPages: Math.max(1, Math.ceil(all.length / size)), totalElements: all.length };
    }
    try {
      const { data } = await api.get('/admin/orders', { params: { status: status || undefined, q: q || undefined, page, size } });
      const content = (data?.content || []).map((o) => ({ ...o, paymentMethod: 'Razorpay', paymentStatus: 'PAID' }));
      return { content, totalPages: data?.totalPages ?? 1, totalElements: data?.totalElements ?? content.length };
    } catch (err) {
      if (!err?.response) {
        const all = buildDemoSeed();
        return { content: all.slice(page * size, page * size + size), totalPages: Math.max(1, Math.ceil(all.length / size)), totalElements: all.length };
      }
      throw err;
    }
  },

  // Real endpoint: PATCH /orders/{id}/status?status=X — `id` must be the
  // numeric orderId, not the display order number.
  async updateStatus(orderId, status) {
    if (DEMO_MODE) return { success: true };
    const { data } = await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
    return data;
  },

  // Real endpoint: GET /orders/{id}/history → [{status, note, at}] — powers
  // the Order Timeline UI in the details modal.
  async getHistory(orderId) {
    if (DEMO_MODE) {
      return [
        { status: 'PENDING', note: 'Order placed', at: new Date(Date.now() - 3 * 86400000).toISOString() },
        { status: 'CONFIRMED', note: 'Payment confirmed', at: new Date(Date.now() - 2 * 86400000).toISOString() },
      ];
    }
    try {
      const { data } = await api.get(`/orders/${orderId}/history`);
      return data || [];
    } catch (err) {
      if (!err?.response) return [];
      throw err;
    }
  },
};

export default adminOrdersService;
