import { useRef, useState } from 'react';
import { UploadCloud, Download, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../common/Modal';
import { catalogService } from '../../services/catalogService';
import { parseCsv, toCsv, downloadCsvText } from '../../utils/csv';

const TEMPLATE_COLUMNS = ['name', 'sku', 'description', 'price', 'mrp', 'categoryName', 'brandName', 'stock', 'images', 'sizes', 'colors', 'featured'];
const TEMPLATE_ROW = {
  name: 'Classic Cotton Shirt', sku: 'SM-SHIRT-001', description: 'Breathable everyday cotton shirt.',
  price: 799, mrp: 999, categoryName: 'Fashion', brandName: 'ShopMart Basics', stock: 50,
  images: 'https://example.com/img1.jpg|https://example.com/img2.jpg', sizes: 'S|M|L', colors: 'Navy|White', featured: 'false',
};

const REQUIRED = ['name', 'price', 'stock'];

export default function BulkProductImportModal({ open, onClose, categories = [], brands = [], onDone }) {
  const inputRef = useRef(null);
  const [rows, setRows] = useState([]); // parsed + validated
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null); // [{ok,label,error}]
  const [progress, setProgress] = useState(0);

  const reset = () => { setRows([]); setFileName(''); setResults(null); setProgress(0); };
  const close = () => { if (!importing) { reset(); onClose(); } };

  const findId = (list, name) => list.find((x) => x.name.trim().toLowerCase() === (name || '').trim().toLowerCase())?.id || '';

  const handleFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const { records } = parseCsv(String(reader.result));
      const validated = records.map((r, i) => {
        const errors = [];
        REQUIRED.forEach((k) => { if (!r[k]) errors.push(`${k} is required`); });
        if (r.price && Number.isNaN(Number(r.price))) errors.push('price must be a number');
        if (r.stock && Number.isNaN(Number(r.stock))) errors.push('stock must be a number');
        const categoryId = findId(categories, r.categoryName);
        const brandId = findId(brands, r.brandName);
        if (r.categoryName && !categoryId) errors.push(`unknown category "${r.categoryName}"`);
        if (r.brandName && !brandId) errors.push(`unknown brand "${r.brandName}"`);
        return {
          rowNumber: i + 2, // +1 header, +1 for 1-index
          raw: r,
          errors,
          payload: {
            name: r.name, sku: r.sku, description: r.description,
            price: Number(r.price) || 0, mrp: Number(r.mrp) || Number(r.price) || 0,
            categoryId, categoryName: r.categoryName, brandId, brandName: r.brandName,
            stock: Number(r.stock) || 0,
            images: (r.images || '').split('|').map((s) => s.trim()).filter(Boolean),
            variants: { sizes: (r.sizes || '').split('|').map((s) => s.trim()).filter(Boolean), colors: (r.colors || '').split('|').map((s) => s.trim()).filter(Boolean) },
            featured: String(r.featured).toLowerCase() === 'true',
          },
        };
      });
      setRows(validated);
      setResults(null);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const runImport = async () => {
    if (!validRows.length) return;
    setImporting(true);
    setProgress(0);
    const out = [];
    for (let i = 0; i < validRows.length; i++) {
      const r = validRows[i];
      const [res] = await catalogService.bulkCreateProducts([r.payload]);
      out.push({ ...res, label: r.payload.name, rowNumber: r.rowNumber });
      setProgress(i + 1);
    }
    setResults(out);
    setImporting(false);
    const okCount = out.filter((r) => r.ok).length;
    if (okCount) toast.success(`Imported ${okCount} of ${validRows.length} products`);
    if (okCount < out.length) toast.error(`${out.length - okCount} rows failed — see details below`);
    onDone?.();
  };

  return (
    <Modal open={open} onClose={close} title="Bulk product import" size="xl" footer={(
      <>
        <button onClick={close} disabled={importing} className="btn-ghost">{results ? 'Close' : 'Cancel'}</button>
        {!results && (
          <button onClick={runImport} disabled={!validRows.length || importing} className="btn-primary">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
            {importing ? `Importing ${progress}/${validRows.length}…` : `Import ${validRows.length || ''} product${validRows.length === 1 ? '' : 's'}`}
          </button>
        )}
      </>
    )}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 p-4">
          <div>
            <p className="text-sm font-medium text-ink">1. Download the template</p>
            <p className="text-xs text-ink-muted">Fill it in, keeping the header row. New products go to the Super Admin approval queue like any other.</p>
          </div>
          <button
            onClick={() => downloadCsvText(toCsv(TEMPLATE_COLUMNS.map((c) => ({ key: c, label: c })), [TEMPLATE_ROW]), 'shopmart-product-import-template.csv')}
            className="btn-outline h-9 shrink-0 text-sm"
          >
            <Download className="h-4 w-4" /> Template CSV
          </button>
        </div>

        {!results && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">2. Upload your filled CSV</p>
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
              className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 px-6 py-8 text-center text-sm text-ink-muted hover:border-brand-400 hover:bg-slate-50"
            >
              <UploadCloud className="h-6 w-6" />
              <span>{fileName || 'Drag or click to upload a .csv file'}</span>
            </div>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
        )}

        {rows.length > 0 && !results && (
          <div>
            <p className="mb-2 text-sm text-ink-soft">
              <span className="font-medium text-emerald-700">{validRows.length} ready to import</span>
              {invalidRows.length > 0 && <span className="ml-2 font-medium text-red-600">{invalidRows.length} with errors (will be skipped)</span>}
            </p>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left uppercase tracking-wide text-ink-muted">
                  <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Price</th><th className="px-3 py-2">Stock</th><th className="px-3 py-2">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="px-3 py-1.5 text-ink-muted">{r.rowNumber}</td>
                      <td className="px-3 py-1.5">{r.raw.name || '—'}</td>
                      <td className="px-3 py-1.5">{r.raw.price || '—'}</td>
                      <td className="px-3 py-1.5">{r.raw.stock || '—'}</td>
                      <td className="px-3 py-1.5">
                        {r.errors.length === 0
                          ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Ready</span>
                          : <span className="inline-flex items-center gap-1 text-red-600" title={r.errors.join('; ')}><XCircle className="h-3.5 w-3.5" /> {r.errors[0]}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results && (
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Import results</p>
            <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-slate-50 text-left uppercase tracking-wide text-ink-muted">
                  <tr><th className="px-3 py-2">Row</th><th className="px-3 py-2">Product</th><th className="px-3 py-2">Result</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((r) => (
                    <tr key={r.rowNumber}>
                      <td className="px-3 py-1.5 text-ink-muted">{r.rowNumber}</td>
                      <td className="px-3 py-1.5">{r.label}</td>
                      <td className="px-3 py-1.5">
                        {r.ok
                          ? <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Imported</span>
                          : <span className="inline-flex items-center gap-1 text-red-600"><XCircle className="h-3.5 w-3.5" /> {r.error}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
