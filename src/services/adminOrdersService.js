import api, { DEMO_MODE } from './api';
import { adminRecentOrders } from './adminMock';
import { ordersDemo } from './ordersDemo';
import { orderTotal } from './mockAccount';

// Admin order management now reads persisted orders from GET /admin/orders and
// GET /admin/orders/{id}. Payment status is whatever the backend recorded — it is
// never assumed to be PAID.

const buildDemoSeed = () => {
  const rich = ordersDemo.all().map((o) => ({
    id: o.id,
    orderId: o.id,
    customer: o.address?.name || 'Customer',
    customerEmail: o.address?.email || null,
    customerPhone: o.address?.phone || null,
    date: o.createdAt,
    total: o.total ?? orderTotal(o),
    status: o.status,
    paymentMethod: 'Razorpay',
    paymentStatus: o.paymentStatus || 'PAID',
    razorpayOrderId: o.razorpayOrderId || null,
    razorpayPaymentId: o.razorpayPaymentId || o.paymentId || null,
    items: o.items || [],
    address: o.address,
  }));
  const extra = adminRecentOrders.map((o) => ({
    ...o, orderId: o.id, paymentMethod: 'Razorpay',
    paymentStatus: o.paymentStatus || 'PAID',
    razorpayOrderId: `order_${String(o.id).replace(/\D/g, '')}`,
    razorpayPaymentId: `pay_${String(o.id).replace(/\D/g, '')}`,
  }));
  return [...rich, ...extra].filter((o, i, arr) => arr.findIndex((x) => x.id === o.id) === i);
};

const displayMethod = (method) => {
  if (!method) return '—';
  return method.toUpperCase() === 'RAZORPAY' ? 'Razorpay' : method;
};

const mapSummary = (o) => ({
  id: o.orderNumber,
  orderId: o.id,
  customer: o.customerName || 'Customer',
  customerEmail: o.customerEmail || null,
  customerPhone: o.customerPhone || null,
  date: o.createdAt,
  total: o.total,
  status: o.status,
  paymentMethod: displayMethod(o.paymentMethod),
  paymentStatus: o.paymentStatus,
  razorpayOrderId: o.razorpayOrderId || null,
  razorpayPaymentId: o.razorpayPaymentId || null,
  itemCount: o.itemCount ?? 0,
});

const mapDetail = (o) => ({
  id: o.orderNumber,
  orderId: o.id,
  customer: o.customerName || 'Customer',
  customerEmail: o.customerEmail || null,
  customerPhone: o.customerPhone || null,
  date: o.createdAt,
  subtotal: o.subtotal,
  shipping: o.shippingFee,
  discount: o.discount,
  total: o.total,
  status: o.status,
  paymentMethod: displayMethod(o.paymentMethod),
  paymentStatus: o.paymentStatus,
  razorpayOrderId: o.razorpayOrderId || null,
  razorpayPaymentId: o.razorpayPaymentId || null,
  paidAt: o.paidAt || null,
  address: o.shippingAddress || {},
  items: (o.items || []).map((it) => ({
    ...it,
    name: it.productName ?? it.name,
    image: it.thumbnail ?? it.image,
    price: it.unitPrice ?? it.price,
    quantity: it.quantity,
    lineTotal: it.lineTotal,
  })),
  history: o.history || [],
});

export const adminOrdersService = {
  async search({ status, q, page = 0, size = 20 } = {}) {
    if (DEMO_MODE) {
      const all = buildDemoSeed()
        .filter((o) => (status ? o.status === status : true))
        .filter((o) => !q || o.id.toLowerCase().includes(q.toLowerCase()) || o.customer.toLowerCase().includes(q.toLowerCase()));
      return {
        content: all.slice(page * size, page * size + size),
        totalPages: Math.max(1, Math.ceil(all.length / size)),
        totalElements: all.length,
      };
    }
    const { data } = await api.get('/admin/orders', {
      params: { status: status || undefined, q: q || undefined, page, size },
    });
    const content = (data?.content || []).map(mapSummary);
    return {
      content,
      totalPages: data?.totalPages ?? 1,
      totalElements: data?.totalElements ?? content.length,
    };
  },

  async getOrder(orderId) {
    if (DEMO_MODE) {
      const o = buildDemoSeed().find((x) => String(x.orderId) === String(orderId));
      return o ? mapDetail({
        ...o,
        shippingAddress: o.address,
      }) : null;
    }
    const { data } = await api.get(`/admin/orders/${orderId}`);
    return mapDetail(data);
  },

  // Backend: PATCH /orders/{id}/status?status=X — numeric order id, not the display number.
  async updateStatus(orderId, status) {
    if (DEMO_MODE) return { success: true };
    const { data } = await api.patch(`/orders/${orderId}/status`, null, { params: { status } });
    return data;
  },
};

export default adminOrdersService;
