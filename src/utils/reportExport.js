import { jsPDF } from 'jspdf';

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString('en-IN')}`;

// Export the admin report as a clean PDF summary.
export function exportReportPdf(report) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 70, 229); doc.setFontSize(22);
  doc.text('ShopMart', M, y);
  doc.setTextColor(15, 23, 42); doc.setFontSize(16);
  doc.text('Sales Report', W - M, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - M, y, { align: 'right' });

  y += 26; doc.setDrawColor(226, 232, 240); doc.line(M, y, W - M, y); y += 26;

  // KPI summary
  const kpis = [
    ['Total revenue', rs(report.revenue)],
    ['Total orders', String(report.orders)],
    ['Avg. order value', rs(report.avgOrderValue)],
    ['Fulfilment rate', `${report.fulfilmentRate}%`],
  ];
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('Summary', M, y); y += 18;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  kpis.forEach(([k, v]) => {
    doc.setTextColor(100, 116, 139); doc.text(k, M, y);
    doc.setTextColor(15, 23, 42); doc.text(v, M + 180, y); y += 16;
  });

  // Top products
  y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Top products', M, y); y += 18;
  doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  doc.text('PRODUCT', M, y); doc.text('UNITS', W - M - 140, y, { align: 'right' }); doc.text('REVENUE', W - M, y, { align: 'right' }); y += 14;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(15, 23, 42);
  (report.topProducts || []).forEach((p) => {
    doc.text(String(p.name).slice(0, 52), M, y);
    doc.text(String(p.units), W - M - 140, y, { align: 'right' });
    doc.text(rs(p.revenue), W - M, y, { align: 'right' }); y += 15;
  });

  // Category sales
  if (report.categorySales?.length) {
    y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Category-wise sales', M, y); y += 18;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    report.categorySales.forEach((c) => {
      doc.setTextColor(100, 116, 139); doc.text(c.name, M, y);
      doc.setTextColor(15, 23, 42); doc.text(rs(c.value), W - M, y, { align: 'right' }); y += 15;
    });
  }

  doc.save(`ShopMart-Report-${Date.now()}.pdf`);
}

const csvCell = (v) => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Export the report as a multi-section CSV that opens cleanly in Excel.
export function exportReportExcel(report) {
  const rows = [];
  rows.push(['ShopMart Sales Report']);
  rows.push(['Generated', new Date().toLocaleString('en-IN')]);
  rows.push([]);
  rows.push(['Summary']);
  rows.push(['Total revenue', report.revenue]);
  rows.push(['Total orders', report.orders]);
  rows.push(['Avg order value', report.avgOrderValue]);
  rows.push(['Fulfilment rate (%)', report.fulfilmentRate]);
  rows.push([]);
  rows.push(['Top products', 'Units', 'Revenue']);
  (report.topProducts || []).forEach((p) => rows.push([p.name, p.units, p.revenue]));
  rows.push([]);
  rows.push(['Category', 'Revenue']);
  (report.categorySales || []).forEach((c) => rows.push([c.name, c.value]));
  rows.push([]);
  rows.push(['Vendor', 'Orders', 'Revenue', 'Rating']);
  (report.vendorPerformance || []).forEach((v) => rows.push([v.name, v.orders, v.revenue, v.rating]));

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ShopMart-Report-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Advanced Analytics (KPI + growth trend) export ─────────────────────────
// Separate from exportReportPdf/Excel above because the data shape is
// different (KPI snapshot + two time series, not a sales/category/vendor
// report) — reuses the same jsPDF/CSV approach rather than a new library.
export function exportKpiPdf(data) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 48;
  let y = 56;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(79, 70, 229); doc.setFontSize(22);
  doc.text('ShopMart', M, y);
  doc.setTextColor(15, 23, 42); doc.setFontSize(16);
  doc.text('Advanced Analytics', W - M, y, { align: 'right' });
  y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(100, 116, 139);
  doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, W - M, y, { align: 'right' });

  y += 26; doc.setDrawColor(226, 232, 240); doc.line(M, y, W - M, y); y += 26;

  const kpis = [
    ['Revenue', rs(data.revenue)],
    ['Orders', String(data.orders ?? '—')],
    ['Customers', String(data.customers ?? '—')],
    ['Avg. order value', rs(data.avgOrderValue)],
    ['Inventory value', data.totalStockValue != null ? rs(data.totalStockValue) : '—'],
    ['Low stock items', String(data.lowStockCount ?? '—')],
  ];
  doc.setTextColor(15, 23, 42); doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
  doc.text('KPI Summary', M, y); y += 18;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  kpis.forEach(([k, v]) => {
    doc.setTextColor(100, 116, 139); doc.text(k, M, y);
    doc.setTextColor(15, 23, 42); doc.text(v, M + 200, y); y += 16;
  });

  if (data.monthlySales?.length) {
    y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Revenue trend (₹ thousands)', M, y); y += 18;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    data.monthlySales.forEach((m) => {
      doc.setTextColor(100, 116, 139); doc.text(m.month, M, y);
      doc.setTextColor(15, 23, 42); doc.text(String(m.revenue), M + 200, y); y += 15;
    });
  }

  if (data.customerGrowth?.length) {
    y += 14; doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.text('Customer growth', M, y); y += 18;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    data.customerGrowth.forEach((c) => {
      doc.setTextColor(100, 116, 139); doc.text(c.period, M, y);
      doc.setTextColor(15, 23, 42); doc.text(String(c.newCustomers), M + 200, y); y += 15;
    });
  }

  doc.save(`ShopMart-Analytics-${Date.now()}.pdf`);
}

export function exportKpiExcel(data) {
  const rows = [];
  rows.push(['ShopMart Advanced Analytics']);
  rows.push(['Generated', new Date().toLocaleString('en-IN')]);
  rows.push([]);
  rows.push(['KPI Summary']);
  rows.push(['Revenue', data.revenue]);
  rows.push(['Orders', data.orders]);
  rows.push(['Customers', data.customers]);
  rows.push(['Avg. order value', data.avgOrderValue]);
  rows.push(['Inventory value', data.totalStockValue]);
  rows.push(['Low stock items', data.lowStockCount]);
  rows.push([]);
  rows.push(['Revenue trend', 'Revenue (₹k)', 'Orders']);
  (data.monthlySales || []).forEach((m) => rows.push([m.month, m.revenue, m.orders]));
  rows.push([]);
  rows.push(['Customer growth', 'New customers']);
  (data.customerGrowth || []).forEach((c) => rows.push([c.period, c.newCustomers]));

  const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
  const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `ShopMart-Analytics-${Date.now()}.csv`; a.click();
  URL.revokeObjectURL(url);
}
