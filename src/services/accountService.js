import api, { DEMO_MODE } from './api';
import { ordersDemo } from './ordersDemo';

// Authenticated account + commerce operations (cart, wishlist, orders, profile).
// These hit the backend; callers handle errors. Cart/wishlist also keep a local
// mirror in Redux so the UI stays responsive. Order operations fall back to a
// persistent demo store so the full checkout chain works standalone.
const orderFallback = (err) => !err?.response; // connection error / demo mode

// Real backend OrderResponse uses shippingFee/placedAt, and each item uses
// productName/thumbnail/unitPrice — the order pages (OrderSuccess, OrderDetail,
// Orders) were built against shipping/createdAt/name/image/price. Without this,
// real orders would render with broken thumbnails, blank item names, and an
// undefined price on every line.
const normalizeOrder = (o) => (o ? {
  ...o,
  shipping: o.shippingFee ?? o.shipping,
  createdAt: o.placedAt ?? o.createdAt,
  items: (o.items || []).map((it) => ({
    ...it,
    name: it.productName ?? it.name,
    image: it.thumbnail ?? it.image,
    price: it.unitPrice ?? it.price,
  })),
} : o);

// Address forms (Checkout.jsx, dashboard/Addresses.jsx) use `name`/`pincode`
// and never collect a country; the backend's AddressRequest requires
// fullName/postalCode/country (all @NotBlank). India-only storefront, so
// country defaults to India rather than adding a field to every address form
// for a value that's never actually going to vary.
const toAddressApi = (payload) => ({
  label: payload.label || undefined,
  fullName: payload.name,
  phone: payload.phone,
  line1: payload.line1,
  line2: payload.line2 || undefined,
  city: payload.city,
  state: payload.state,
  postalCode: payload.pincode,
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
  // Real backend routes are /auth/me and /auth/change-password (AuthController)
  // — /users/me doesn't exist on this backend at all (same "No static resource"
  // mismatch as the address endpoints below).
  getProfile: () => api.get('/auth/me').then((r) => r.data),
  updateProfile: (payload) => api.put('/auth/me', payload).then((r) => r.data),
  changePassword: (payload) => api.put('/auth/change-password', payload).then((r) => r.data),

  // Addresses
  // Real backend route is /addresses (AddressController), not /users/me/addresses
  // — that mismatch is what caused "No static resource users/me/addresses" (no
  // controller matched the path). The backend's AddressRequest/AddressResponse
  // also uses different field names than the address forms here (fullName vs
  // name, postalCode vs pincode) and requires `country`, which the forms never
  // collected — translated below so a save doesn't also fail @NotBlank
  // validation once it actually reaches the controller.
  getAddresses: () => api.get('/addresses').then((r) => (Array.isArray(r.data) ? r.data.map(fromAddressApi) : r.data)),
  addAddress: (payload) => api.post('/addresses', toAddressApi(payload)).then((r) => fromAddressApi(r.data)),
  updateAddress: (id, payload) => api.put(`/addresses/${id}`, toAddressApi(payload)).then((r) => fromAddressApi(r.data)),
  deleteAddress: (id) => api.delete(`/addresses/${id}`).then((r) => r.data),
  // No dedicated "set default" endpoint exists on the backend — AddressRequest
  // requires every field (fullName/phone/line1/city/state/postalCode/country),
  // so "making an address default" is a full update with isDefault:true, not a
  // partial patch. Callers must pass the full address record, not just an id.
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

  // Orders — real API first, persistent demo store as fallback.
  // Real GET /orders returns a paginated PageResponse<OrderSummary>, and
  // OrderSummary has no `items` array (just an itemCount) — Orders.jsx renders
  // item thumbnails inline, which the list endpoint can't provide. Unwrapped
  // to a plain array so .filter/.map don't break; item previews stay empty
  // until there's a summary endpoint that includes a few item thumbnails.
  async getOrders() {
    if (DEMO_MODE) return ordersDemo.all();
    try {
      const data = await api.get('/orders', { params: { size: 100 } }).then((r) => r.data);
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map((o) => normalizeOrder({ ...o, items: o.items || [] }));
    } catch (err) { if (orderFallback(err)) return ordersDemo.all(); throw err; }
  },
  async getOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    try { return normalizeOrder(await api.get(`/orders/${id}`).then((r) => r.data)); }
    catch (err) { if (orderFallback(err)) return ordersDemo.byId(id); throw err; }
  },
  async placeOrder(payload) {
    if (DEMO_MODE) return ordersDemo.place(payload);
    try { return normalizeOrder(await api.post('/orders', payload).then((r) => r.data)); }
    catch (err) { if (orderFallback(err)) return ordersDemo.place(payload); throw err; }
  },
  async trackOrder(id) {
    if (DEMO_MODE) return ordersDemo.byId(id);
    try { return await api.get(`/orders/${id}/tracking`).then((r) => r.data); }
    catch (err) { if (orderFallback(err)) return ordersDemo.byId(id); throw err; }
  },

  // After a verified Razorpay payment, fetch the (now PAID) order. In demo mode
  // this updates the local order store instead.
  async finalizePaidOrder(id, result) {
    if (DEMO_MODE) return ordersDemo.markPaid(id, result);
    try { return normalizeOrder(await api.get(`/orders/${id}`).then((r) => r.data)); }
    catch (err) { if (orderFallback(err)) return ordersDemo.markPaid(id, result); throw err; }
  },

  // Payments
  getPaymentMethods: () => api.get('/users/me/payment-methods').then((r) => r.data),
  createPayment: (payload) => api.post('/payments', payload).then((r) => r.data),
};
