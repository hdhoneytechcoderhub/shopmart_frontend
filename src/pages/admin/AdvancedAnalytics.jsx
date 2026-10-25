import { useEffect, useState } from 'react';
import {
  IndianRupee, ShoppingBag, Users, TrendingUp, Package, AlertTriangle,
  FileSpreadsheet, FileText, Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { analyticsService } from '../../services/analyticsService';
import { AdminPageHeader, StatCard } from '../../components/admin/AdminUI';
import { ChartCard, RevenueChart, CustomerGrowthChart } from '../../components/admin/Charts';
import { SkeletonStatRow, SkeletonChart } from '../../components/common/Skeleton';
import { formatPrice } from '../../utils/format';
import { exportKpiPdf, exportKpiExcel } from '../../utils/reportExport';

// Genuinely unbuildable against the current backend — no fabricated charts
// or numbers for these; each reason is the specific missing endpoint/data
// source, not a vague "coming soon".
const UNAVAILABLE = [
  { name: 'Revenue Forecast Dashboard', reason: 'No forecasting endpoint or predictive model exists on the backend — only historical sales data is available.' },
  { name: 'Customer Cohort Analysis', reason: 'Needs a signup-cohort × purchase-period retention matrix; the backend has no endpoint that returns orders grouped by customer signup cohort.' },
  { name: 'Customer Retention Dashboard', reason: 'The backend exposes one aggregate repeat-purchase rate (a snapshot), not a retention curve over time — there\'s no historical series to chart.' },
  { name: 'Scheduled Reports', reason: 'No job scheduler exists on the backend to run and store reports on a recurring basis.' },
  { name: 'Email Reports', reason: 'No email dispatch integration exists on the backend (SMTP/SendGrid/etc. — Platform Settings has an SMTP toggle but nothing wired behind it yet).' },
];

export default function AdvancedAnalytics() {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [monthlySales, setMonthlySales] = useState(null);
  const [customerGrowth, setCustomerGrowth] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([
      analyticsService.getAdminStats(),
      analyticsService.getAdminReport(),
      analyticsService.getMonthlySales(6),
      analyticsService.getCustomerGrowth(6),
      analyticsService.getInventoryReport(10),
    ])
      .then(([s, r, ms, cg, inv]) => {
        if (!active) return;
        setStats(s); setReport(r); setMonthlySales(ms); setCustomerGrowth(cg); setInventory(inv);
      })
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const kpis = stats && report ? {
    revenue: stats.revenue,
    orders: stats.orders,
    customers: stats.customers,
    avgOrderValue: report.avgOrderValue,
    conversionRate: null, // no traffic/visit tracking exists — see UNAVAILABLE note below
    inventoryValue: inventory?.totalStockValue ?? null,
    lowStockCount: inventory?.lowStockCount ?? null,
  } : null;

  const exportData = () => ({ ...stats, ...report, monthlySales, customerGrowth, inventory });

  return (
    <div>
      <AdminPageHeader
        title="Advanced Analytics"
        subtitle="Real-time KPIs and growth trends, built entirely on live backend data."
        action={kpis && (
          <div className="flex gap-2">
            <button onClick={() => exportKpiExcel(exportData())} className="btn-outline"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
            <button onClick={() => exportKpiPdf(exportData())} className="btn-primary"><FileText className="h-4 w-4" /> PDF</button>
          </div>
        )}
      />

      {loading || !kpis ? (
        <>
          <SkeletonStatRow count={6} />
          <div className="mt-6 grid gap-6 lg:grid-cols-2"><SkeletonChart /><SkeletonChart /></div>
        </>
      ) : (
        <>
          {/* KPI Dashboard */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard icon={IndianRupee} label="Revenue" value={formatPrice(kpis.revenue)} tone="brand" />
            <StatCard icon={ShoppingBag} label="Orders" value={kpis.orders.toLocaleString('en-IN')} tone="purple" />
            <StatCard icon={Users} label="Customers" value={kpis.customers.toLocaleString('en-IN')} tone="emerald" />
            <StatCard icon={TrendingUp} label="Avg. order value" value={formatPrice(kpis.avgOrderValue)} tone="amber" />
            <StatCard icon={Package} label="Inventory value" value={kpis.inventoryValue != null ? formatPrice(kpis.inventoryValue) : '—'} tone="brand" />
            <StatCard icon={AlertTriangle} label="Low stock items" value={kpis.lowStockCount ?? '—'} tone="amber" />
          </div>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
            <Info className="h-3.5 w-3.5" /> Conversion rate isn't shown — no site-traffic/visit tracking exists on the backend to compute it against orders.
          </p>

          {/* Growth Trend Dashboard */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Revenue trend" subtitle="Last 6 months, real sales data">
              <RevenueChart data={monthlySales || []} />
            </ChartCard>
            <ChartCard title="Customer growth" subtitle="New customers per month">
              <CustomerGrowthChart data={customerGrowth || []} />
            </ChartCard>
          </div>
        </>
      )}

      {/* Documented gaps */}
      <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold text-amber-900"><Info className="h-4 w-4" /> Not yet available — needs backend work</h2>
        <ul className="space-y-2">
          {UNAVAILABLE.map((u) => (
            <li key={u.name} className="text-sm text-amber-800"><span className="font-medium">{u.name}:</span> {u.reason}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
