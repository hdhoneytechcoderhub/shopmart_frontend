import { Link } from 'react-router-dom';
import { IndianRupee, ShoppingBag, Users, Package, CheckCircle2, Clock, CalendarCheck, ArrowRight, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice, formatDate } from '../../utils/format';
import { AdminPageHeader, StatCard, StatusBadge, AdminTable } from '../../components/admin/AdminUI';
import { ChartCard, SalesChart, OrdersChart, RevenueChart, TopProductsChart, StatusPie, CustomerGrowthChart } from '../../components/admin/Charts';
import { SkeletonStatRow, SkeletonChart } from '../../components/common/Skeleton';

export default function AdminDashboard() {
  const { data: stats } = useFetch(() => analyticsService.getAdminStats(), []);
  const { data: analytics } = useFetch(() => analyticsService.getAnalytics(), []);
  const { data: recent } = useFetch(() => analyticsService.getRecentOrders(), []);
  const { data: monthlySales } = useFetch(() => analyticsService.getMonthlySales(6), []);
  const { data: growth } = useFetch(() => analyticsService.getCustomerGrowth(6), []);
  const { data: inventory } = useFetch(() => analyticsService.getInventoryReport(10), []);

  const series = analytics?.salesSeries || [];
  const recentOrders = recent || [];
  const lowStock = (inventory?.lowStock || []).slice(0, 5);

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle="An overview of your store's performance." />

      {!stats ? (
        <>
          <SkeletonStatRow count={4} />
          <div className="mt-6 grid gap-6 lg:grid-cols-2"><SkeletonChart /><SkeletonChart /></div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Package} label="Products" value={stats.products} tone="amber" />
          <StatCard icon={ShoppingBag} label="Orders" value={stats.orders?.toLocaleString('en-IN')} tone="brand" />
          <StatCard icon={Users} label="Customers" value={stats.customers?.toLocaleString('en-IN')} tone="purple" />
          <StatCard icon={IndianRupee} label="Revenue" value={formatPrice(stats.revenue)} tone="emerald" />
          <StatCard icon={IndianRupee} label="Today's Revenue" value={formatPrice(stats.todaysRevenue)} tone="emerald" />
          <StatCard icon={Clock} label="Pending Orders" value={stats.pendingOrders} tone="amber" />
          <StatCard icon={CheckCircle2} label="Completed Orders" value={stats.completedOrders} tone="emerald" />
          <StatCard icon={CalendarCheck} label="Attendance Today" value={stats.attendanceCount} tone="brand" />
        </div>
      )}

      {/* Analytics */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sales" subtitle="Last 30 days (₹ thousands)"><SalesChart data={series} /></ChartCard>
        <ChartCard title="Revenue" subtitle="Last 30 days (₹ thousands)"><RevenueChart data={series} /></ChartCard>
        <ChartCard title="Orders" subtitle="Orders per day"><OrdersChart data={series} /></ChartCard>
        <ChartCard title="Orders by status"><StatusPie data={analytics?.ordersByStatus || []} /></ChartCard>
        <ChartCard title="Monthly Sales" subtitle="Last 6 months (₹ thousands)"><SalesChart data={monthlySales || []} /></ChartCard>
        <ChartCard title="Customer Growth" subtitle="New sign-ups per month"><CustomerGrowthChart data={growth || []} /></ChartCard>
      </div>

      <div className="mt-6">
        <ChartCard title="Top products" subtitle="Best sellers by units" height={300}><TopProductsChart data={analytics?.topProducts || []} /></ChartCard>
      </div>

      {lowStock.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-semibold text-amber-900">
              <AlertTriangle className="h-4 w-4" /> Low-stock alerts
            </h2>
            <Link to="/admin/inventory-report" className="link inline-flex items-center gap-1 text-sm">
              View full report <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((p) => (
              <Link key={p.id} to={`/admin/products/${p.id}/edit`} className="flex items-center gap-2 rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm hover:border-amber-300">
                <span className="font-medium text-ink">{p.name}</span>
                <span className="badge bg-amber-100 text-amber-700">{p.stock} left</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-ink">Recent orders</h2>
          <Link to="/admin/orders" className="link inline-flex items-center gap-1 text-sm">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <AdminTable columns={['Order', 'Customer', 'Date', 'Total', 'Status']}>
          {recentOrders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{o.id}</td>
              <td className="px-4 py-3 text-ink-soft">{o.customer}</td>
              <td className="px-4 py-3 text-ink-muted">{formatDate(o.date)}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(o.total)}</td>
              <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
