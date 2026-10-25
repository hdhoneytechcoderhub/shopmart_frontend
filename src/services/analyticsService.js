import api, { DEMO_MODE } from './api';
import { adminStats, adminRecentOrders, adminCustomers } from './adminMock';
import {
  superStats, salesSeries, topProductsData, ordersByStatusData,
} from './superAdminMock';
import { mockProducts } from './mockData';
import * as demoStore from './demoStore';

// Enterprise analytics + reporting. Read-only dashboards fall back to demo data
// ONLY on a network-level failure (no response at all) or in demo mode — same
// contract as catalogService.useMock. A real 4xx/5xx from the backend must
// surface as an error, not be silently swapped for fake numbers.
const read = async (path, params, fallback) => {
  if (DEMO_MODE) return fallback();
  try {
    const { data } = await api.get(path, { params });
    return data == null ? fallback() : data;
  } catch (err) {
    if (err?.response) throw err;
    return fallback();
  }
};

const STATUS_COLORS = {
  PENDING: '#f59e0b', CONFIRMED: '#4f46e5', PROCESSING: '#8b5cf6',
  PACKED: '#0ea5e9', SHIPPED: '#06b6d4', DELIVERED: '#10b981', CANCELLED: '#ef4444',
};
const titleCase = (s) => s?.charAt(0) + s?.slice(1).toLowerCase();

// Backend SalesPoint = { date, revenue, orders }. Chart components expect
// { month, sales, orders, revenue } (₹ thousands) keyed by a short label.
const mapSalesSeries = (points = []) => points.map((p) => ({
  month: new Date(p.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  sales: Math.round((p.revenue || 0) / 1000),
  revenue: Math.round((p.revenue || 0) / 1000),
  orders: p.orders,
}));

// Backend TopProduct = { productId, name, unitsSold, revenue } → chart wants { name, units }.
const mapTopProducts = (rows = []) => rows.map((r) => ({ name: r.name, units: r.unitsSold, revenue: r.revenue }));

// Backend StatusCount = { status, count } → StatusPie wants { name, value, color }.
const mapOrderStatus = (rows = []) => rows.map((r) => ({
  name: titleCase(r.status), value: r.count, color: STATUS_COLORS[r.status] || '#94a3b8',
}));

// Derived demo "top products" (units + revenue) from the catalog.
const demoTopProducts = () =>
  mockProducts
    .map((p, i) => ({
      id: p.id, name: p.name, image: p.images[0],
      units: 320 - i * 11, revenue: p.price * (320 - i * 11),
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

const CATEGORY_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

// Category-wise sales aggregated from the catalog.
const demoCategorySales = () => {
  const map = new Map();
  mockProducts.forEach((p, i) => {
    const key = p.categoryName || 'Other';
    const revenue = p.price * (60 - (i % 40));
    map.set(key, (map.get(key) || 0) + revenue);
  });
  return [...map.entries()]
    .map(([name, value], i) => ({ name, value: Math.round(value), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);
};

// Vendor/brand performance demo.
const demoVendorPerformance = () => {
  const brands = [...new Set(mockProducts.map((p) => p.brandName).filter(Boolean))].slice(0, 6);
  return brands.map((name, i) => ({
    name,
    orders: 420 - i * 47,
    revenue: (980000 - i * 120000),
    rating: Number((4.8 - i * 0.18).toFixed(1)),
  }));
};

export const analyticsService = {
  // ── Admin dashboard statistics ─────────────────────────────────────────
  // Real endpoint: GET /admin/dashboard → AdminDashboardResponse
  // { totalProducts, pendingProducts, activeProducts, totalOrders, pendingOrders,
  //   completedOrders, revenue, todaysRevenue, totalCustomers, attendanceCount }
  getAdminStats: () => read('/admin/dashboard', undefined, () => ({ ...adminStats })).then((d) => (
    DEMO_MODE ? d : {
      products: d.totalProducts,
      orders: d.totalOrders,
      customers: d.totalCustomers,
      revenue: d.revenue,
      todaysRevenue: d.todaysRevenue,
      pendingOrders: d.pendingOrders,
      completedOrders: d.completedOrders,
      attendanceCount: d.attendanceCount,
      activeProducts: d.activeProducts,
      pendingProducts: d.pendingProducts,
    }
  )),

  // Admin-wide recent orders across all customers.
  // Real endpoint: GET /admin/orders/recent → [{ id, customer, date, total, status }]
  getRecentOrders: () => read('/admin/orders/recent', { size: 5 }, () => adminRecentOrders),

  // ── Analytics chart series (admin + super admin) ───────────────────────
  // Real endpoints: GET /admin/analytics/sales, /top-products, /order-status
  getAnalytics: async () => {
    if (DEMO_MODE) return { salesSeries, topProducts: topProductsData, ordersByStatus: ordersByStatusData };
    try {
      const [sales, top, status] = await Promise.all([
        api.get('/admin/analytics/sales', { params: { days: 30 } }),
        api.get('/admin/analytics/top-products', { params: { limit: 6 } }),
        api.get('/admin/analytics/order-status'),
      ]);
      return {
        salesSeries: mapSalesSeries(sales.data),
        topProducts: mapTopProducts(top.data),
        ordersByStatus: mapOrderStatus(status.data),
      };
    } catch (err) {
      if (err?.response) throw err;
      return { salesSeries, topProducts: topProductsData, ordersByStatus: ordersByStatusData };
    }
  },

  // ── Monthly sales + customer growth (new charts) ───────────────────────
  // Real endpoints: GET /admin/analytics/sales-monthly, /customer-growth
  getMonthlySales: async (months = 6) => {
    if (DEMO_MODE) return salesSeries;
    try {
      const { data } = await api.get('/admin/analytics/sales-monthly', { params: { months } });
      return mapSalesSeries(data);
    } catch (err) {
      if (err?.response) throw err;
      return salesSeries;
    }
  },

  getCustomerGrowth: async (months = 6) => {
    if (DEMO_MODE) {
      return salesSeries.map((m) => ({ period: m.month, newCustomers: Math.max(4, Math.round(m.orders * 0.4)) }));
    }
    try {
      const { data } = await api.get('/admin/analytics/customer-growth', { params: { months } });
      return (data || []).map((p) => ({
        period: new Date(p.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        newCustomers: p.newCustomers,
      }));
    } catch (err) {
      if (err?.response) throw err;
      return salesSeries.map((m) => ({ period: m.month, newCustomers: Math.max(4, Math.round(m.orders * 0.4)) }));
    }
  },

  // ── Super Admin platform stats ─────────────────────────────────────────
  // Real endpoint: GET /super-admin/dashboard → SuperAdminDashboardResponse
  // { totalAdmins, totalProducts, pendingApproval, totalOrders, revenue, totalCustomers }
  getSuperStats: () => read('/super-admin/dashboard', undefined, () => ({ ...superStats })).then((d) => (
    DEMO_MODE ? d : {
      totalAdmins: d.totalAdmins,
      totalOrders: d.totalOrders,
      revenue: d.revenue,
      activeUsers: d.totalCustomers,
      pendingApproval: d.pendingApproval,
      totalProducts: d.totalProducts,
    }
  )),

  // ── Reports (admin) ────────────────────────────────────────────────────
  // Real endpoints: GET /admin/reports/sales, /revenue-by-category,
  // /revenue-by-vendor, plus the order-status/top-products analytics endpoints.
  // Gap: vendor performance only has revenue+unitsSold per vendor on the
  // backend — no per-vendor order count or rating exists, so "Orders" below
  // is really units sold and "Rating" is left blank rather than invented.
  getAdminReport: async () => {
    if (DEMO_MODE) {
      const totalOrders = adminStats.ordersByStatus.reduce((s, r) => s + r.count, 0);
      const delivered = adminStats.ordersByStatus.find((r) => r.status === 'DELIVERED')?.count || 0;
      return {
        revenue: adminStats.revenue,
        orders: adminStats.orders,
        avgOrderValue: Math.round(adminStats.revenue / adminStats.orders),
        fulfilmentRate: Number(((delivered / totalOrders) * 100).toFixed(1)),
        salesSeries,
        ordersByStatus: adminStats.ordersByStatus,
        topProducts: demoTopProducts(),
        categorySales: demoCategorySales(),
        vendorPerformance: demoVendorPerformance(),
      };
    }
    try {
      const [sales, top, status, category, vendor] = await Promise.all([
        api.get('/admin/reports/sales'),
        api.get('/admin/analytics/top-products', { params: { limit: 6 } }),
        api.get('/admin/analytics/order-status'),
        api.get('/admin/reports/revenue-by-category'),
        api.get('/admin/reports/revenue-by-vendor'),
      ]);
      const s = sales.data;
      const statusRows = status.data || [];
      const totalOrders = statusRows.reduce((sum, r) => sum + r.count, 0);
      const delivered = statusRows.find((r) => r.status === 'DELIVERED')?.count || 0;
      return {
        revenue: s.totalRevenue,
        orders: s.totalOrders,
        avgOrderValue: s.totalOrders ? Math.round(s.totalRevenue / s.totalOrders) : 0,
        fulfilmentRate: totalOrders ? Number(((delivered / totalOrders) * 100).toFixed(1)) : 0,
        salesSeries: (s.daily || []).map((d) => ({
          month: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          sales: Math.round((d.revenue || 0) / 1000), revenue: Math.round((d.revenue || 0) / 1000), orders: d.orders,
        })),
        ordersByStatus: statusRows,
        topProducts: mapTopProducts(top.data),
        categorySales: (category.data || []).map((r, i) => ({ name: r.label, value: Math.round(r.revenue), color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] })),
        vendorPerformance: (vendor.data || []).map((r) => ({ name: r.label, orders: r.unitsSold, revenue: r.revenue, rating: '—' })),
      };
    } catch (err) {
      if (err?.response) throw err;
      return {
        revenue: adminStats.revenue, orders: adminStats.orders,
        avgOrderValue: Math.round(adminStats.revenue / adminStats.orders),
        fulfilmentRate: 0, salesSeries, ordersByStatus: adminStats.ordersByStatus,
        topProducts: demoTopProducts(), categorySales: demoCategorySales(), vendorPerformance: demoVendorPerformance(),
      };
    }
  },

  // ── Inventory report ────────────────────────────────────────────────────
  // Real endpoint: GET /admin/reports/inventory?threshold= → InventoryReportResponse
  // { totalProducts, totalStockValue, lowStockCount, lowStock: [{id,name,stock}] }
  getInventoryReport: async (threshold = 5) => {
    if (DEMO_MODE) {
      const low = demoStore.getAllProducts().filter((p) => p.stock <= threshold).map((p) => ({ id: p.id, name: p.name, stock: p.stock }));
      return {
        totalProducts: demoStore.getAllProducts().length,
        totalStockValue: demoStore.getAllProducts().reduce((s, p) => s + p.price * p.stock, 0),
        lowStockCount: low.length,
        lowStock: low,
      };
    }
    const { data } = await api.get('/admin/reports/inventory', { params: { threshold } });
    return data;
  },

  // ── Reports (super admin) ──────────────────────────────────────────────
  // Reuses the same real admin report endpoints — there's no separate
  // super-admin-only reporting endpoint on the backend.
  getSuperReport: async function () {
    if (DEMO_MODE) {
      return { revenue: superStats.revenue, totalOrders: superStats.totalOrders, activeUsers: superStats.activeUsers, salesSeries, topProducts: topProductsData, ordersByStatus: ordersByStatusData };
    }
    const [report, customers] = await Promise.all([this.getAdminReport(), api.get('/admin/analytics/customers').catch(() => null)]);
    return {
      revenue: report.revenue, totalOrders: report.orders,
      activeUsers: customers?.data?.customersWithOrders ?? null,
      salesSeries: report.salesSeries, topProducts: report.topProducts, ordersByStatus: report.ordersByStatus,
    };
  },

  // ── Customers + customer analytics ─────────────────────────────────────
  // Backend gap: the only customer-directory endpoint is
  // GET /super-admin/customers (SUPER_ADMIN role) — this Admin-role page
  // won't be able to load it while logged in as a plain Admin. It also
  // doesn't include per-customer order count / lifetime spend (those columns
  // show 0 rather than an invented number until the backend adds them).
  // Every customer segment is mutually exclusive and exhaustive (see
  // CustomerSegment enum doc) — fetching all 6 in parallel and joining by id
  // gives real per-customer order count/spend without an N+1 call per row.
  // /super-admin/customers alone has no order/spend fields at all; the old
  // code hardcoded orders:0, spent:0 for every customer, which displayed as
  // if it were real (and always wrong) rather than actually being fetched.
  getCustomers: async () => {
    if (DEMO_MODE) return adminCustomers;
    try {
      const [{ data: base }, ...segmentResults] = await Promise.all([
        api.get('/super-admin/customers', { params: { size: 200 } }),
        ...['VIP', 'HIGH_VALUE', 'RETURNING', 'NEW', 'INACTIVE', 'STANDARD'].map((seg) =>
          api.get(`/admin/customers/segments/${seg}`, { params: { size: 500 } }).catch(() => ({ data: null }))),
      ]);
      const insightsById = new Map();
      segmentResults.forEach((r) => {
        const list = Array.isArray(r.data) ? r.data : r.data?.content || [];
        list.forEach((c) => insightsById.set(c.customerId, c));
      });
      const rows = Array.isArray(base) ? base : base?.content || [];
      return rows.map((u) => {
        const insight = insightsById.get(u.id);
        return {
          id: u.id, name: u.name, email: u.email,
          joined: u.createdAt, status: u.enabled ? 'Active' : 'Inactive',
          orders: insight?.totalOrders ?? 0, spent: Number(insight?.totalSpent) || 0,
          segment: insight?.segment,
        };
      });
    } catch (err) {
      if (err?.response) throw err;
      return adminCustomers;
    }
  },

  // Real endpoint: GET /admin/analytics/customers → CustomerAnalyticsResponse
  // { totalCustomers, customersWithOrders, repeatCustomers, repeatRatePct,
  //   avgOrderValue, newCustomers30d }. Note: "avg lifetime value" in the UI
  // is actually average *order* value here — the backend has no true
  // customer-lifetime-value calculation yet.
  getCustomerAnalytics: async () => {
    if (DEMO_MODE) {
      const total = adminCustomers.length;
      const active = adminCustomers.filter((c) => c.status === 'Active').length;
      const totalSpent = adminCustomers.reduce((s, c) => s + c.spent, 0);
      return {
        totalCustomers: superStats.activeUsers + 656,
        activeCustomers: active,
        inactiveCustomers: total - active,
        avgLifetimeValue: Math.round(totalSpent / total),
        newVsReturning: [
          { name: 'New', value: 38, color: '#4f46e5' },
          { name: 'Returning', value: 62, color: '#10b981' },
        ],
        growthSeries: salesSeries.map((m) => ({ month: m.month, customers: Math.round(m.orders * 0.7) })),
        topCustomers: [...adminCustomers].sort((a, b) => b.spent - a.spent).slice(0, 5),
      };
    }
    try {
      const [analytics, top] = await Promise.all([
        api.get('/admin/analytics/customers'),
        api.get('/admin/reports/top-customers'),
      ]);
      const a = analytics.data;
      const returningPct = Number(a.repeatRatePct) || 0;
      return {
        totalCustomers: a.totalCustomers,
        activeCustomers: a.customersWithOrders,
        inactiveCustomers: a.totalCustomers - a.customersWithOrders,
        avgLifetimeValue: a.avgOrderValue,
        newVsReturning: [
          { name: 'New', value: Number((100 - returningPct).toFixed(1)), color: '#4f46e5' },
          { name: 'Returning', value: returningPct, color: '#10b981' },
        ],
        topCustomers: (top.data || []).map((r) => ({ id: r.userId, name: r.name, spent: r.totalSpent })),
      };
    } catch (err) {
      if (err?.response) throw err;
      const total = adminCustomers.length;
      const active = adminCustomers.filter((c) => c.status === 'Active').length;
      const totalSpent = adminCustomers.reduce((s, c) => s + c.spent, 0);
      return {
        totalCustomers: total, activeCustomers: active, inactiveCustomers: total - active,
        avgLifetimeValue: Math.round(totalSpent / total),
        newVsReturning: [{ name: 'New', value: 38, color: '#4f46e5' }, { name: 'Returning', value: 62, color: '#10b981' }],
        topCustomers: [...adminCustomers].sort((a, b) => b.spent - a.spent).slice(0, 5),
      };
    }
  },
};

export default analyticsService;
