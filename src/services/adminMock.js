// Demo data for admin screens so the panel is fully explorable without a backend.

export const adminStats = {
  revenue: 1284500,
  todaysRevenue: 42300,
  orders: 1842,
  pendingOrders: 38,
  completedOrders: 612,
  customers: 968,
  products: 124,
  attendanceCount: 6,
  revenueSeries: [42, 55, 48, 67, 72, 64, 80, 92, 86, 101, 96, 118],
  ordersByStatus: [
    { status: 'PENDING', count: 38 },
    { status: 'CONFIRMED', count: 64 },
    { status: 'PROCESSING', count: 52 },
    { status: 'SHIPPED', count: 90 },
    { status: 'DELIVERED', count: 612 },
    { status: 'CANCELLED', count: 41 },
  ],
};

export const adminRecentOrders = [
  { id: 'SM-100238', customer: 'Dhaval Shah', date: '2026-05-30T10:24:00Z', total: 8470, status: 'SHIPPED' },
  { id: 'SM-100237', customer: 'Aanya Rao', date: '2026-05-30T09:02:00Z', total: 2199, status: 'CONFIRMED' },
  { id: 'SM-100236', customer: 'Karthik Nair', date: '2026-05-29T19:40:00Z', total: 5499, status: 'DELIVERED' },
  { id: 'SM-100235', customer: 'Meera Iyer', date: '2026-05-29T14:15:00Z', total: 1299, status: 'PENDING' },
  { id: 'SM-100234', customer: 'Rohan Mehta', date: '2026-05-29T11:50:00Z', total: 3760, status: 'PROCESSING' },
];

export const adminCustomers = [
  { id: 1, name: 'Dhaval Shah', email: 'dhaval@example.com', orders: 12, spent: 84200, joined: '2025-02-14', status: 'Active' },
  { id: 2, name: 'Aanya Rao', email: 'aanya@example.com', orders: 8, spent: 41250, joined: '2025-04-02', status: 'Active' },
  { id: 3, name: 'Karthik Nair', email: 'karthik@example.com', orders: 5, spent: 22990, joined: '2025-06-19', status: 'Active' },
  { id: 4, name: 'Meera Iyer', email: 'meera@example.com', orders: 3, spent: 9870, joined: '2025-08-08', status: 'Active' },
  { id: 5, name: 'Rohan Mehta', email: 'rohan@example.com', orders: 1, spent: 3760, joined: '2026-01-22', status: 'Inactive' },
];

export const adminCoupons = [
  { id: 1, code: 'SAVE10', type: 'PERCENT', value: 10, minOrder: 999, expiry: '2026-12-31', active: true, used: 142 },
  { id: 2, code: 'WELCOME200', type: 'FLAT', value: 200, minOrder: 1499, expiry: '2026-09-30', active: true, used: 87 },
  { id: 3, code: 'FESTIVE25', type: 'PERCENT', value: 25, minOrder: 2999, expiry: '2026-06-01', active: false, used: 310 },
];

export const adminBlogs = [
  { id: 1, title: 'The 2026 Spring Edit', author: 'Aisha Verma', status: 'Published', date: '2026-05-28' },
  { id: 2, title: 'Building a Capsule Wardrobe', author: 'Rohan Mehta', status: 'Published', date: '2026-05-14' },
  { id: 3, title: 'Caring for Your Footwear', author: 'Neha Kapoor', status: 'Draft', date: '2026-04-30' },
];
