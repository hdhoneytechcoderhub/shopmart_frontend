import { IndianRupee, ShoppingBag, TrendingUp, Percent, FileText, FileSpreadsheet, Star, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analyticsService';
import { exportService } from '../../services/exportService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice } from '../../utils/format';
import { AdminPageHeader, StatCard, AdminTable } from '../../components/admin/AdminUI';
import { ChartCard, SalesChart, OrdersChart, RevenueChart, TopProductsChart, StatusPie } from '../../components/admin/Charts';
import { exportReportPdf, exportReportExcel } from '../../utils/reportExport';
import Spinner from '../../components/common/Spinner';

export default function AdminReports() {
  const { data: report, loading } = useFetch(() => analyticsService.getAdminReport(), []);

  const onPdf = () => { exportReportPdf(report); toast.success('PDF exported'); };
  const onExcel = () => { exportReportExcel(report); toast.success('Excel (CSV) exported'); };
  const onCsv = async () => {
    try {
      await exportService.csv('/admin/reports/sales', {}, 'sales-report.csv');
      toast.success('CSV exported');
    } catch {
      toast.error('CSV export failed');
    }
  };

  if (loading || !report) {
    return (
      <div>
        <AdminPageHeader title="Reports & Analytics" subtitle="Sales analytics and performance insights." />
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      </div>
    );
  }

  const series = report.salesSeries || [];
  // Orders-by-status → pie shape.
  const statusColors = { DELIVERED: '#10b981', SHIPPED: '#4f46e5', PROCESSING: '#f59e0b', PENDING: '#94a3b8', CANCELLED: '#ef4444', CONFIRMED: '#06b6d4' };
  const statusPie = (report.ordersByStatus || []).map((r) => ({ name: r.status, value: r.count, color: statusColors[r.status] || '#94a3b8' }));

  return (
    <div>
      <AdminPageHeader
        title="Reports & Analytics"
        subtitle="Sales analytics and performance insights."
        action={(
          <div className="flex gap-2">
            <button onClick={onExcel} className="btn-outline"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
            <button onClick={onCsv} className="btn-outline"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={onPdf} className="btn-primary"><FileText className="h-4 w-4" /> PDF</button>
          </div>
        )}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={IndianRupee} label="Total revenue" value={formatPrice(report.revenue)} delta="+12.4%" tone="emerald" />
        <StatCard icon={ShoppingBag} label="Total orders" value={report.orders.toLocaleString('en-IN')} delta="+5.1%" tone="brand" />
        <StatCard icon={TrendingUp} label="Avg. order value" value={formatPrice(report.avgOrderValue)} tone="purple" />
        <StatCard icon={Percent} label="Fulfilment rate" value={`${report.fulfilmentRate}%`} tone="amber" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Sales trend" subtitle="Monthly sales (₹ thousands)"><SalesChart data={series} /></ChartCard>
        <ChartCard title="Revenue" subtitle="Monthly revenue (₹ thousands)"><RevenueChart data={series} /></ChartCard>
        <ChartCard title="Orders" subtitle="Orders per month"><OrdersChart data={series} /></ChartCard>
        <ChartCard title="Category-wise sales" subtitle="Revenue share by category"><StatusPie data={report.categorySales || []} /></ChartCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <ChartCard title="Top products" subtitle="Best sellers by units" height={300}><TopProductsChart data={report.topProducts || []} /></ChartCard>
        <ChartCard title="Orders by status"><StatusPie data={statusPie} /></ChartCard>
      </div>

      {/* Vendor performance */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">Vendor performance</h2>
        <AdminTable columns={['Vendor', 'Orders', 'Revenue', 'Rating']}>
          {(report.vendorPerformance || []).map((v) => (
            <tr key={v.name} className="hover:bg-slate-50/60">
              <td className="px-4 py-3 font-medium text-ink">{v.name}</td>
              <td className="px-4 py-3 text-ink-soft">{v.orders}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(v.revenue)}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1 text-ink-soft"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {v.rating}</span>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      {/* Top products table */}
      <div className="mt-6">
        <h2 className="mb-3 font-semibold text-ink">Top-selling products</h2>
        <AdminTable columns={['Product', 'Units sold', 'Revenue']}>
          {(report.topProducts || []).map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  {p.image && <img src={p.image} alt={p.name} className="h-10 w-10 rounded-lg object-cover" />}
                  <span className="font-medium text-ink line-clamp-1">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{p.units}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(p.revenue)}</td>
            </tr>
          ))}
        </AdminTable>
      </div>
    </div>
  );
}
