import { mockProducts } from './mockData';

const daysAgo = (d, h = 9, m = 0) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  dt.setHours(h, m, 0, 0);
  return dt.toISOString();
};

// ── Super Admin dashboard stats ──────────────────────────────
export const superStats = {
  totalAdmins: 8,
  pendingApprovals: 5,
  totalOrders: 1842,
  revenue: 1284500,
  activeUsers: 312,
};

// ── Admins managed by the super admin ────────────────────────
export const seedAdmins = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav@shopmart.com', role: 'ADMIN', status: 'Active', createdAt: '2025-02-10', lastLogin: daysAgo(0, 9, 12) },
  { id: 2, name: 'Priya Menon', email: 'priya@shopmart.com', role: 'ADMIN', status: 'Active', createdAt: '2025-03-22', lastLogin: daysAgo(0, 10, 2) },
  { id: 3, name: 'Rahul Patel', email: 'rahul@shopmart.com', role: 'ADMIN', status: 'Active', createdAt: '2025-05-01', lastLogin: daysAgo(1, 18, 40) },
  { id: 4, name: 'Sneha Iyer', email: 'sneha@shopmart.com', role: 'ADMIN', status: 'Inactive', createdAt: '2025-06-18', lastLogin: daysAgo(9, 11, 5) },
  { id: 5, name: 'Vikram Rao', email: 'vikram@shopmart.com', role: 'ADMIN', status: 'Active', createdAt: '2025-08-08', lastLogin: daysAgo(2, 14, 20) },
];

// ── Product approvals (built from catalog) ───────────────────
const p = (i) => mockProducts[i % mockProducts.length];
export const seedApprovals = [
  { id: 'AP-1001', product: p(2), submittedBy: 'Aarav Sharma', submittedAt: daysAgo(0, 8, 30), status: 'PENDING' },
  { id: 'AP-1002', product: p(5), submittedBy: 'Priya Menon', submittedAt: daysAgo(1, 12, 0), status: 'PENDING' },
  { id: 'AP-1003', product: p(8), submittedBy: 'Vikram Rao', submittedAt: daysAgo(1, 16, 45), status: 'PENDING' },
  { id: 'AP-1004', product: p(11), submittedBy: 'Rahul Patel', submittedAt: daysAgo(2, 9, 15), status: 'PENDING' },
  { id: 'AP-1005', product: p(14), submittedBy: 'Aarav Sharma', submittedAt: daysAgo(2, 11, 30), status: 'PENDING' },
  { id: 'AP-0998', product: p(1), submittedBy: 'Priya Menon', submittedAt: daysAgo(4, 10, 0), status: 'APPROVED', reviewedBy: 'Super Admin' },
  { id: 'AP-0997', product: p(4), submittedBy: 'Vikram Rao', submittedAt: daysAgo(5, 14, 0), status: 'APPROVED', reviewedBy: 'Super Admin' },
  { id: 'AP-0996', product: p(7), submittedBy: 'Rahul Patel', submittedAt: daysAgo(6, 9, 0), status: 'APPROVED', reviewedBy: 'Super Admin' },
  { id: 'AP-0990', product: p(9), submittedBy: 'Sneha Iyer', submittedAt: daysAgo(7, 15, 0), status: 'REJECTED', reviewedBy: 'Super Admin', reason: 'Incomplete product images' },
  { id: 'AP-0989', product: p(13), submittedBy: 'Aarav Sharma', submittedAt: daysAgo(8, 13, 0), status: 'REJECTED', reviewedBy: 'Super Admin', reason: 'Pricing needs revision' },
];

// ── Activity logs ────────────────────────────────────────────
export const seedActivityLogs = [
  { id: 1, type: 'PRODUCT_APPROVED', actor: 'Super Admin', target: 'Wireless Headphones', at: daysAgo(0, 9, 5) },
  { id: 2, type: 'ADMIN_LOGIN', actor: 'Aarav Sharma', target: 'Admin panel', at: daysAgo(0, 9, 12) },
  { id: 3, type: 'PRODUCT_ADDED', actor: 'Priya Menon', target: 'Cotton Casual Shirt', at: daysAgo(0, 10, 30) },
  { id: 4, type: 'ORDER_UPDATED', actor: 'Rahul Patel', target: 'Order SM-100238 → Shipped', at: daysAgo(0, 11, 2) },
  { id: 5, type: 'PRODUCT_UPDATED', actor: 'Vikram Rao', target: 'Running Shoes (price)', at: daysAgo(1, 14, 18) },
  { id: 6, type: 'ADMIN_LOGIN', actor: 'Priya Menon', target: 'Admin panel', at: daysAgo(1, 10, 2) },
  { id: 7, type: 'PRODUCT_ADDED', actor: 'Aarav Sharma', target: 'Bluetooth Speaker', at: daysAgo(2, 9, 40) },
  { id: 8, type: 'ORDER_UPDATED', actor: 'Rahul Patel', target: 'Order SM-100201 → Delivered', at: daysAgo(2, 16, 5) },
  { id: 9, type: 'PRODUCT_APPROVED', actor: 'Super Admin', target: 'Leather Wallet', at: daysAgo(3, 12, 0) },
  { id: 10, type: 'ADMIN_LOGIN', actor: 'Vikram Rao', target: 'Admin panel', at: daysAgo(3, 8, 55) },
];

// ── Attendance (admin working hours) ─────────────────────────
const hoursBetween = (inT, outT) => {
  if (!inT || !outT) return 0;
  return Math.round(((new Date(outT) - new Date(inT)) / 3.6e6) * 10) / 10;
};
export const buildAttendance = () => {
  const rows = [];
  for (let i = 0; i < 14; i += 1) {
    const dt = new Date();
    dt.setDate(dt.getDate() - i);
    const day = dt.getDay();
    if (day === 0) { rows.push({ date: dt.toISOString(), login: null, logout: null, weekend: true }); continue; }
    const login = daysAgo(i, 9, [0, 8, 15, 5, 22][i % 5]);
    const logoutToday = i === 0;
    const logout = logoutToday ? null : daysAgo(i, 18, [10, 0, 30, 45, 5][i % 5]);
    rows.push({ date: dt.toISOString(), login, logout, hours: logout ? hoursBetween(login, logout) : null });
  }
  return rows;
};

// ── Analytics chart series (recharts) ────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const salesSeries = MONTHS.map((m, i) => ({
  month: m,
  sales: [42, 55, 48, 67, 72, 64, 80, 92, 86, 101, 96, 118][i],
  orders: [120, 150, 138, 180, 200, 175, 220, 260, 240, 290, 270, 320][i],
  revenue: [42, 55, 48, 67, 72, 64, 80, 92, 86, 101, 96, 118][i] * 1.2,
}));

export const topProductsData = mockProducts.slice(0, 6).map((pr, i) => ({
  name: pr.name.length > 16 ? `${pr.name.slice(0, 16)}…` : pr.name,
  units: 320 - i * 38,
}));

export const ordersByStatusData = [
  { name: 'Delivered', value: 612, color: '#10b981' },
  { name: 'Shipped', value: 190, color: '#4f46e5' },
  { name: 'Processing', value: 116, color: '#f59e0b' },
  { name: 'Pending', value: 78, color: '#94a3b8' },
  { name: 'Cancelled', value: 41, color: '#ef4444' },
];
