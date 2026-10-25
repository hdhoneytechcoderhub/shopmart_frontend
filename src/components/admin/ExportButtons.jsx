import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportService } from '../../services/exportService';

// columns: [{ key, label, value?: (row) => any }]
// csv: { path, params } — real backend CSV endpoint (preferred when available)
export default function ExportButtons({ title, columns, rows, filenameBase, csv }) {
  const handle = async (kind) => {
    try {
      if (kind === 'csv') {
        if (csv) await exportService.csv(csv.path, csv.params, `${filenameBase}.csv`);
        else exportService.excelCsv(columns, rows, `${filenameBase}.csv`);
      } else if (kind === 'excel') {
        exportService.excelCsv(columns, rows, `${filenameBase}.csv`);
      } else if (kind === 'pdf') {
        exportService.pdf(title, columns, rows, `${filenameBase}.pdf`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Export failed');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button onClick={() => handle('excel')} className="btn-outline h-9 text-xs" title="Download as CSV (opens in Excel)">
        <Download className="h-3.5 w-3.5" /> Excel
      </button>
      <button onClick={() => handle('csv')} className="btn-outline h-9 text-xs">
        <Download className="h-3.5 w-3.5" /> CSV
      </button>
      <button onClick={() => handle('pdf')} className="btn-outline h-9 text-xs">
        <Download className="h-3.5 w-3.5" /> PDF
      </button>
    </div>
  );
}
