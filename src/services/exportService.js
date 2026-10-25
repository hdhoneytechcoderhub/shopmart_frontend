import api from './api';
import jsPDF from 'jspdf';

// CSV: hits the REAL backend CSV endpoints (ReportController already supports
// ?format=csv on /admin/reports/sales, /revenue-by-category, /revenue-by-brand,
// /revenue-by-vendor, /top-customers, /inventory). Downloads as an authenticated
// blob since these are protected admin endpoints (a plain <a href> wouldn't
// carry the JWT).
async function downloadBlob(path, params, filename) {
  const { data } = await api.get(path, { params: { ...params, format: 'csv' }, responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export const exportService = {
  async csv(path, params, filename) {
    return downloadBlob(path, params, filename);
  },

  // "Excel" export: there's no .xlsx-writing library in this backend or
  // frontend yet (would need Apache POI server-side, or a new SheetJS
  // dependency client-side). This generates a real CSV from the data already
  // on screen instead — Excel/Sheets both open CSV natively, but it's a CSV
  // file, not a native .xlsx workbook. Flagging that honestly rather than
  // relabeling a CSV as something it isn't.
  excelCsv(columns, rows, filename) {
    const escape = (v) => {
      const s = v == null ? '' : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [columns.map((c) => escape(c.label)).join(',')];
    rows.forEach((r) => lines.push(columns.map((c) => escape(typeof c.value === 'function' ? c.value(r) : r[c.key])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Real client-side PDF using jsPDF (already a project dependency, used for
  // invoices) — a simple ruled table, no external table plugin needed.
  pdf(title, columns, rows, filename) {
    const doc = new jsPDF();
    const marginX = 14;
    let y = 18;
    doc.setFontSize(14);
    doc.text(title, marginX, y);
    y += 8;
    doc.setFontSize(9);
    const colWidth = (200 - marginX) / columns.length;

    const drawRow = (cells, bold) => {
      doc.setFont(undefined, bold ? 'bold' : 'normal');
      cells.forEach((cell, i) => doc.text(String(cell ?? ''), marginX + i * colWidth, y));
      y += 6;
    };

    drawRow(columns.map((c) => c.label), true);
    doc.line(marginX, y - 4, 200, y - 4);

    rows.forEach((r) => {
      if (y > 280) { doc.addPage(); y = 18; }
      drawRow(columns.map((c) => (typeof c.value === 'function' ? c.value(r) : r[c.key])), false);
    });

    doc.save(filename);
  },
};

export default exportService;
