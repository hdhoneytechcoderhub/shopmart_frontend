// App-wide constants

export const APP_NAME = 'ShopMart';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Razorpay publishable key id (test or live). Leave empty to run the simulated
// checkout in demo mode. Set VITE_RAZORPAY_KEY_ID in .env to go live.
export const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// Map our payment option ids → Razorpay checkout "method" groups.
export const RAZORPAY_METHOD = {
  UPI: 'upi',
  CARD: 'card',
  NETBANKING: 'netbanking',
  WALLET: 'wallet',
  RAZORPAY: undefined, // show all methods
};

// export const ROLES = {
//   SUPER_ADMIN: 'SUPER_ADMIN',
//   ADMIN: 'ADMIN',
//   ENGINEER: 'ENGINEER',
//   CUSTOMER: 'CUSTOMER'
// };

// localStorage keys
export const STORAGE = {
  ACCESS_TOKEN: 'sm_access_token',
  REFRESH_TOKEN: 'sm_refresh_token',
  USER: 'sm_user',
  CART_GUEST: 'sm_cart_guest',
  REMEMBER: 'sm_remember',
};

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PACKED: 'PACKED',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  RETURNED: 'RETURNED',
};

export const ORDER_STATUS_META = {
  PENDING: { label: 'Pending', tone: 'bg-amber-100 text-amber-700' },
  CONFIRMED: { label: 'Confirmed', tone: 'bg-blue-100 text-blue-700' },
  PACKED: { label: 'Packed', tone: 'bg-indigo-100 text-indigo-700' },
  SHIPPED: { label: 'Shipped', tone: 'bg-purple-100 text-purple-700' },
  DELIVERED: { label: 'Delivered', tone: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-red-100 text-red-700' },
  RETURNED: { label: 'Returned', tone: 'bg-slate-200 text-slate-700' },
};

export const PAYMENT_STATUS_META = {
  PENDING: { label: 'Pending', tone: 'bg-amber-100 text-amber-700' },
  INITIATED: { label: 'Initiated', tone: 'bg-amber-100 text-amber-700' },
  PAID: { label: 'Paid', tone: 'bg-emerald-100 text-emerald-700' },
  FAILED: { label: 'Failed', tone: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Refunded', tone: 'bg-slate-100 text-slate-600' },
};

// Razorpay is the only gateway — UPI / Card / Net Banking / Wallets are all
// handled inside the Razorpay checkout popup. No COD.
export const PAYMENT_METHODS = [
  { id: 'RAZORPAY', label: 'Razorpay' },
];

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'popular', label: 'Most Popular' },
];

export const ROLES = { SUPER_ADMIN: 'SUPER_ADMIN', ADMIN: 'ADMIN', ENGINEER: 'ENGINEER', CUSTOMER: 'CUSTOMER' };

// Normalize backend role strings (which use a ROLE_ prefix) to our role ids.
export const normalizeRole = (role) => {
  if (!role) return ROLES.CUSTOMER;
  const r = String(role).toUpperCase().replace(/^ROLE_/, '');
  return ROLES[r] || ROLES.CUSTOMER;
};

// Normalize a full list of backend role strings (e.g. ["ROLE_CUSTOMER", "ROLE_ADMIN"])
// to our role ids (e.g. ["CUSTOMER", "ADMIN"]).
export const normalizeRoles = (roles) => {
  if (!Array.isArray(roles)) return [];
  return roles.filter(Boolean).map(normalizeRole);
};

// Highest-privilege role wins when a user has multiple roles (e.g. a Super
// Admin account also carries ROLE_CUSTOMER). Accepts either a single role
// string or an array of role strings.
const ROLE_PRIORITY = [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.ENGINEER, ROLES.CUSTOMER];

export const pickPrimaryRole = (rolesOrRole) => {
  const list = Array.isArray(rolesOrRole) ? rolesOrRole : [rolesOrRole];
  const normalized = normalizeRoles(list);
  return ROLE_PRIORITY.find((r) => normalized.includes(r)) || ROLES.CUSTOMER;
};


