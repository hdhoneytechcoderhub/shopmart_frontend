import { IndianRupee, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { AdminPageHeader, StatCard } from '../../components/admin/AdminUI';
import { ChartCard, SalesChart, OrdersChart, RevenueChart, TopProductsChart, StatusPie } from '../../components/admin/Charts';
import { analyticsService } from '../../services/analyticsService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice } from '../../utils/format';
import Spinner from '../../components/common/Spinner';

export default function SuperAdminReports() {
  const { data: report, loading } = useFetch(() => analyticsService.getSuperReport(), []);

  if (loading || !report) {
    return (
      <div>
        <AdminPageHeader title="Reports & Analytics" subtitle="Platform performance across all admins." />
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      </div>
    );
  }

  const series = report.salesSeries || [];
  const totalRevenueK = series.reduce((s, m) => s + m.revenue, 0);
  const totalOrders = series.reduce((s, m) => s + m.orders, 0) || report.totalOrders;
  const avgOrder = totalOrders ? Math.round((totalRevenueK * 1000) / totalOrders) : 0;

  return (
    <div>
      <AdminPageHeader title="Reports & Analytics" subtitle="Platform performance across all admins." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatPrice(report.revenue)} delta="+12.4%" tone="emerald" />
        <StatCard icon={ShoppingBag} label="Total orders" value={report.totalOrders.toLocaleString('en-IN')} delta="+5.1%" tone="brand" />
        <StatCard icon={TrendingUp} label="Avg. order value" value={formatPrice(avgOrder)} tone="purple" />
        <StatCard icon={Users} label="Active users" value={report.activeUsers} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sales trend" subtitle="Monthly sales (₹ thousands)"><SalesChart data={series} /></ChartCard>
        <ChartCard title="Revenue" subtitle="Monthly revenue (₹ thousands)"><RevenueChart data={series} /></ChartCard>
        <ChartCard title="Orders" subtitle="Orders per month"><OrdersChart data={series} /></ChartCard>
        <ChartCard title="Orders by status"><StatusPie data={report.ordersByStatus || []} /></ChartCard>
        <ChartCard title="Top products" subtitle="Best sellers by units" height={320}><TopProductsChart data={report.topProducts || []} /></ChartCard>
      </div>
    </div>
  );
}
