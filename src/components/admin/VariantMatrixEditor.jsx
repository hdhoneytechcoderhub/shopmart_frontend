import { useEffect, useMemo } from 'react';
import { RefreshCcw } from 'lucide-react';

// Builds one editable row per size × color combination — each with its own
// SKU, price override, and stock — matching the real backend's
// ProductVariantDto shape (one row per combo, not two flat chip lists).
// If only sizes or only colors are set, the other axis is treated as a
// single "—" so a row still exists per value on the axis that's in use.
export default function VariantMatrixEditor({ sizes = [], colors = [], baseSku = '', basePrice = '', variants = [], onChange }) {
  const axisSizes = sizes.length ? sizes : [null];
  const axisColors = colors.length ? colors : [null];

  const comboKey = (size, color) => `${size ?? ''}::${color ?? ''}`;

  const rows = useMemo(() => {
    const byKey = new Map(variants.map((v) => [comboKey(v.size, v.color), v]));
    const out = [];
    axisSizes.forEach((size) => {
      axisColors.forEach((color) => {
        if (size == null && color == null) return; // no variant axes defined at all
        const key = comboKey(size, color);
        out.push(byKey.get(key) || { size, color, sku: '', price: '', stock: '' });
      });
    });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sizes.join('|'), colors.join('|')]);

  // Sync generated rows back up whenever the axes change shape (add/remove a
  // size or color chip regenerates the grid, preserving existing combo data).
  useEffect(() => {
    const changed = rows.length !== variants.length || rows.some((r, i) => variants[i] !== r);
    if (changed) onChange(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  const updateRow = (idx, patch) => {
    const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r));
    onChange(next);
  };

  const autoFillSkus = () => {
    const next = rows.map((r, i) => ({
      ...r,
      sku: r.sku || [baseSku, r.size, r.color].filter(Boolean).join('-').toUpperCase() || `VAR-${i + 1}`,
    }));
    onChange(next);
  };

  if (!sizes.length && !colors.length) {
    return <p className="text-sm text-ink-muted">Add at least one size or color above to generate per-combination SKU, price, and stock rows.</p>;
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs text-ink-muted">{rows.length} combination{rows.length === 1 ? '' : 's'} — leave price blank to use the base price.</p>
        <button type="button" onClick={autoFillSkus} className="btn-outline h-8 text-xs"><RefreshCcw className="h-3.5 w-3.5" /> Auto-fill SKUs</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-sm">
          <thead className="bg-slate-50/60 text-left text-xs uppercase tracking-wide text-ink-muted">
            <tr>
              {sizes.length > 0 && <th className="px-3 py-2 font-semibold">Size</th>}
              {colors.length > 0 && <th className="px-3 py-2 font-semibold">Color</th>}
              <th className="px-3 py-2 font-semibold">SKU</th>
              <th className="px-3 py-2 font-semibold">Price override (₹)</th>
              <th className="px-3 py-2 font-semibold">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r, i) => (
              <tr key={comboKey(r.size, r.color)}>
                {sizes.length > 0 && <td className="px-3 py-2 font-medium text-ink">{r.size}</td>}
                {colors.length > 0 && <td className="px-3 py-2 text-ink-soft">{r.color}</td>}
                <td className="px-3 py-2">
                  <input className="field h-9" value={r.sku} onChange={(e) => updateRow(i, { sku: e.target.value })} placeholder={basePrice ? `${baseSku || 'SKU'}-…` : 'SKU'} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" className="field h-9" value={r.price} onChange={(e) => updateRow(i, { price: e.target.value })} placeholder={String(basePrice || 0)} />
                </td>
                <td className="px-3 py-2">
                  <input type="number" className="field h-9" value={r.stock} onChange={(e) => updateRow(i, { stock: e.target.value })} placeholder="0" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
