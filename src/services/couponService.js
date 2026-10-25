import api, { DEMO_MODE } from './api';
import { adminCoupons } from './adminMock';
import { COUPONS, evaluateCoupon } from '../utils/coupons';
import { createDemoStore } from './demoCrud';

// Coupons. Validation falls back to the local catalog only on a genuine
// network error; a real 4xx from the backend (invalid/expired/limit-reached
// coupon) is a legitimate answer and must be shown as such, not silently
// re-checked against the local demo list.
const asArray = (d) => (Array.isArray(d) ? d : d?.content || []);

// Demo-mode coupons used to only live in React state — creating one and
// refreshing the page made it vanish, because list() always returned the
// static adminCoupons array. Now backed by localStorage like Brands/Categories.
const couponDemo = createDemoStore('sm_demo_coupons_v1', adminCoupons);

const normalizeCoupon = (c) => ({
  ...c,
  type: c.type || (c.discountType === 'PERCENTAGE' ? 'PERCENT' : c.discountType) || 'PERCENT',
  value: c.value ?? c.discountValue,
  minOrder: c.minOrder ?? c.minOrderAmount ?? 0,
  expiry: c.expiry ?? (c.expiresAt ? String(c.expiresAt).slice(0, 10) : ''),
  used: c.used ?? c.usedCount ?? 0,
  usageLimit: c.usageLimit ?? null,
  perUserLimit: c.perUserLimit ?? null,
  active: c.active ?? true,
});

// The admin form (AdminCoupons.jsx) works in app-friendly field names
// (type/value/minOrder/expiry) that don't exist on the backend's
// CouponRequest at all (discountType/discountValue/minOrderAmount/expiresAt)
// — every create/update was sending discountType:undefined, failing
// @NotBlank validation with a 400. `type: 'PERCENT'` also doesn't match the
// backend's expected PERCENTAGE|FIXED enum values.
const toBackend = (payload) => ({
  code: payload.code,
  description: payload.description,
  discountType: payload.type === 'PERCENT' ? 'PERCENTAGE' : payload.type === 'FLAT' ? 'FIXED' : payload.type,
  discountValue: Number(payload.value) || 0,
  minOrderAmount: payload.minOrder != null ? Number(payload.minOrder) || 0 : undefined,
  maxDiscountAmount: payload.maxDiscount != null ? Number(payload.maxDiscount) : undefined,
  usageLimit: payload.usageLimit != null && payload.usageLimit !== '' ? Number(payload.usageLimit) : undefined,
  perUserLimit: payload.perUserLimit != null && payload.perUserLimit !== '' ? Number(payload.perUserLimit) : undefined,
  startsAt: payload.startsAt || undefined,
  // Date-only <input type="date"> value -> end-of-day instant so the coupon
  // is actually usable through its listed expiry date.
  expiresAt: payload.expiry ? new Date(`${payload.expiry}T23:59:59`).toISOString() : undefined,
  active: payload.active ?? true,
});

export const couponService = {
  // Storefront coupon catalog (the few promoted codes).
  // Backend gap: CouponController has no public "list active coupons" endpoint
  // — GET /coupons is admin-only. Using the local promoted list until one exists.
  listPublic: async () => {
    if (DEMO_MODE) return COUPONS;
    return COUPONS;
  },

  // Validate a code against a subtotal → { ok, discount, reason?, coupon? }.
  // Real endpoint: POST /coupons/validate → { orderAmount } → CouponApplication
  // { couponId, code, discount }. Invalid codes come back as a 400 with a message.
  validate: async (code, subtotal) => {
    if (DEMO_MODE) return evaluateCoupon(code, subtotal);
    try {
      const { data } = await api.post('/coupons/validate', { code, orderAmount: subtotal });
      return { ok: true, discount: Number(data?.discount) || 0, coupon: { id: data?.couponId, code: data?.code } };
    } catch (err) {
      if (!err?.response) return evaluateCoupon(code, subtotal);
      return { ok: false, discount: 0, reason: err.response.data?.message || 'This coupon isn\'t valid' };
    }
  },

  // Admin coupon management — real endpoints have no /admin prefix.
  list: async () => {
    if (DEMO_MODE) return couponDemo.list();
    try {
      const { data } = await api.get('/coupons');
      // A genuinely empty real list must render as empty, not silently swap
      // in stale demo data — that swap used to make it look like deletes
      // "came back" after a refresh.
      return asArray(data).map(normalizeCoupon);
    } catch (err) {
      if (!err?.response) return couponDemo.list();
      throw err;
    }
  },
  create: async (payload) => {
    if (DEMO_MODE) return couponDemo.create({ ...payload, used: 0 });
    try {
      const { data } = await api.post('/coupons', toBackend(payload));
      return data ? normalizeCoupon(data) : couponDemo.create({ ...payload, used: 0 });
    } catch (err) {
      if (!err?.response) return couponDemo.create({ ...payload, used: 0 });
      throw err;
    }
  },
  update: async (id, payload) => {
    if (DEMO_MODE) return couponDemo.update(id, payload);
    try {
      const { data } = await api.put(`/coupons/${id}`, toBackend(payload));
      return data ? normalizeCoupon(data) : couponDemo.update(id, payload);
    } catch (err) {
      if (!err?.response) return couponDemo.update(id, payload);
      throw err;
    }
  },
  remove: async (id) => {
    if (DEMO_MODE) return couponDemo.remove(id);
    try { await api.delete(`/coupons/${id}`); return { success: true }; }
    catch (err) { if (!err?.response) return couponDemo.remove(id); throw err; }
  },
};

export default couponService;
