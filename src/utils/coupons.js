// Demo coupon catalog. When the backend coupon API is connected, validation can
// move server-side; the UI contract (code, type, value, minOrder) stays the same.
export const COUPONS = [
  { code: 'SAVE10', type: 'PERCENT', value: 10, minOrder: 0, maxDiscount: 1000, label: '10% off your order' },
  { code: 'WELCOME200', type: 'FLAT', value: 200, minOrder: 1499, label: 'Flat ₹200 off above ₹1,499' },
  { code: 'FESTIVE25', type: 'PERCENT', value: 25, minOrder: 2999, maxDiscount: 2000, label: '25% off above ₹2,999' },
  { code: 'FREESHIP', type: 'FLAT', value: 79, minOrder: 0, label: 'Free shipping (₹79 off)' },
];

export const findCoupon = (code) =>
  COUPONS.find((c) => c.code.toUpperCase() === String(code || '').trim().toUpperCase()) || null;

// Returns { ok, reason?, discount } for a coupon against a subtotal.
export const evaluateCoupon = (coupon, subtotal) => {
  if (!coupon) return { ok: false, reason: 'Enter a coupon code', discount: 0 };
  const found = typeof coupon === 'string' ? findCoupon(coupon) : coupon;
  if (!found) return { ok: false, reason: 'Invalid coupon code', discount: 0 };
  if (subtotal < (found.minOrder || 0)) {
    return { ok: false, reason: `Minimum order ₹${found.minOrder.toLocaleString('en-IN')} required`, discount: 0, coupon: found };
  }
  let discount = found.type === 'PERCENT' ? Math.round((subtotal * found.value) / 100) : found.value;
  if (found.maxDiscount) discount = Math.min(discount, found.maxDiscount);
  discount = Math.min(discount, subtotal);
  return { ok: true, discount, coupon: found };
};
