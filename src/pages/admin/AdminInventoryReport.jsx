import { useState } from 'react';
import { Package, IndianRupee, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../../services/analyticsService';
import { useFetch } from '../../hooks/useFetch';
import { formatPrice } from '../../utils/format';
import { AdminPageHeader, StatCard, AdminTable } from '../../components/admin/AdminUI';
import ExportButtons from '../../components/admin/ExportButtons';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';

export default function AdminInventoryReport() {
  const [threshold, setThreshold] = useState(5);
  const { data: report, loading } = useFetch(() => analyticsService.getInventoryReport(threshold), [threshold]);

  const lowStock = report?.lowStock || [];
  const columns = [
    { key: 'id', label: 'Product ID' },
    { key: 'name', label: 'Product' },
    { key: 'stock', label: 'Stock remaining' },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Inventory Report"
        subtitle="Stock levels and low-stock alerts across your catalog."
        action={report && (
          <ExportButtons
            title="ShopMart Inventory Report"
            columns={columns}
            rows={lowStock}
            filenameBase="inventory-report"
            csv={{ path: '/admin/reports/inventory', params: { threshold } }}
          />
        )}
      />

      {loading || !report ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard icon={Package} label="Total products" value={report.totalProducts.toLocaleString('en-IN')} tone="brand" />
            <StatCard icon={IndianRupee} label="Total stock value" value={formatPrice(report.totalStockValue)} tone="emerald" />
            <StatCard icon={AlertTriangle} label="Low-stock items" value={report.lowStockCount} tone="amber" />
          </div>

          <div className="mt-6 flex items-center gap-3">
            <label className="label !mb-0">Low-stock threshold</label>
            <select value={threshold} onChange={(e) => setThreshold(Number(e.target.value))} className="field w-auto">
              {[5, 10, 15, 20, 50].map((n) => <option key={n} value={n}>{n} units or fewer</option>)}
            </select>
          </div>

          <div className="mt-4">
            {lowStock.length === 0 ? (
              <EmptyState icon={Package} title="No low-stock products" description="Everything is comfortably stocked at this threshold." />
            ) : (
              <AdminTable columns={['Product', 'Stock remaining']}>
                {lowStock.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${p.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                      </span>
                    </td>
                  </tr>
                ))}
              </AdminTable>
            )}
          </div>
        </>
      )}
    </div>
  );
}
