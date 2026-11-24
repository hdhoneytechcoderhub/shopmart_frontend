import api, { DEMO_MODE } from './api';
import { ordersDemo } from './ordersDemo';

// Authenticated account + commerce operations (cart, wishlist, orders, profile).
// In production mode these always hit the Spring Boot backend. Order creation and
// payment are never faked locally: if the backend cannot be reached the caller gets
// an error instead of a "successful" order that only exists in the browser.

const normalizeOrder = (o) => {
  if (!o) return o;
  const items = (o.items || []).map((it) => ({
    ...it,
    name: it.productName ?? it.name,
    image: it.thumbnail ?? it.image,
    price: it.unitPrice ?? it.price,
    lineTotal: it.lineTotal ?? ((it.unitPrice ?? it.price ?? 0) * (it.quantity || 1)),
  }));
  return {
    ...o,
    shipping: o.shippingFee ?? o.shipping ?? 0,
    createdAt: o.placedAt ?? o.createdAt,
    address: o.shippingAddress ?? o.address,
    paymentStatus: o.paymentStatus ?? 'PENDING',
    items,
  };
};

// Address forms use `name`/`pincode`; the backend AddressRequest uses
// fullName/postalCode/email/country.
const toAddressApi = (payload) => ({
  label: payload.label || undefined,
  fullName: payload.name,
  phone: payload.phone,
  email: payload.email || undefined,
  line1: payload.line1,
  line2: payload.line2 || undefined,
  city: payload.city,
  state: payload.state,
  postalCode: payload.pincode || payload.postalCode,
  country: payload.country || 'India',
  isDefault: !!payload.isDefault,
});

const fromAddressApi = (a) => (a ? {
  ...a,
  name: a.fullName,
  pincode: a.postalCode,
} : a);

export const accountService = {
  // Profile
  getProfile: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.put('/auth/change-password', payload).then((r) => r.data),

  // Addresses
  getAddresses: () => api.get('/addresses').then((r) => (Array.isArray(r.data) ? r.data.map(fromAddressApi) : r.data)),
  addAddress: (payload) => api.post('/addresses', toAddressApi(payload)).then((r) => fromAddressApi(r.data)),
  updateAddress: (id, payload) => api.put(`/addresses/${id}`, toAddressApi(payload)).then((r) => fromAddressApi(r.data)),
  deleteAddress: (id) => api.delete(`/addresses/${id}`).then((r) => r.data),
  setDefaultAddress: (address) => api.put(`/addresses/${address.id}`, toAddressApi({ ...address, isDefault: true })).then((r) => fromAddressApi(r.data)),

  // Cart
  getCart: () => api.get('/cart').then((r) => r.data),
  addToCart: (payload) => api.post('/cart/items', payload).then((r) => r.data),
  updateCartItem: (itemId, qty) => api.put(`/cart/items/${itemId}`, { quantity: qty }).then((r) => r.data),
  removeCartItem: (itemId) => api.delete(`/cart/items/${itemId}`).then((r) => r.data),
  clearCart: () => api.delete('/cart').then((r) => r.data),

  // Wishlist
  getWishlist: () => api.get('/wishlist').then((r) => r.data),
  addToWishlist: (productId) => api.post('/wishlist/items', { productId }).then((r) => r.data),
  removeFromWishlist: (productId) => api.delete(`/wishlist/items/${productId}`).then((r) => r.data),

  // Orders — backend only outside demo mode. No demo-store fallback on network
  // errors, because that would create an order that can never be paid/fulfilled.
  async getOrders() {
    if (DEMO_MODE) return ordersDemo.all();
    const data = await api.get('/orders', { params: { size: 100 } }).then((r) => r.data);
    const list = Array.isArray(data) ? data : data?.content || [];
    return list.map(normalizeOrder);
  },

  async getOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    return normalizeOrder(await api.get(`/orders/${id}`).then((r) => r.data));
  },

  async placeOrder(payload, idempotencyKey) {
    if (DEMO_MODE) return ordersDemo.place(payload);
    const config = idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined;
    return normalizeOrder(await api.post('/orders', payload, config).then((r) => r.data));
  },

  async cancelOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    return normalizeOrder(await api.post(`/orders/${id}/cancel`).then((r) => r.data));
  },

  async trackOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    return api.get(`/orders/${id}/tracking`).then((r) => r.data);
  },

  /**
   * After a verified Razorpay callback, re-read the order and require the backend
   * to report PAID before the UI treats payment as successful.
   */
  async finalizePaidOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    const order = await this.getOrder(id);
    if (order?.paymentStatus !== 'PAID') {
      throw new Error('The payment has not been confirmed by the server yet.');
    }
    return order;
  },

  /** Ask the backend to reconcile the pending payment with Razorpay. */
  syncPaymentStatus: (orderId) => api.post(`/payments/order/${orderId}/sync`).then((r) => r.data),

  markPaymentFailed: (orderId, reason) =>
    api.post(`/payments/${orderId}/fail`, null, { params: { reason } }).then((r) => r.data),

  // Payments
  getPaymentMethods: () => api.get('/users/me/payment-methods').then((r) => r.data),
  createPayment: (payload) => api.post('/payments', payload).then((r) => r.data),
};

export default accountService;
