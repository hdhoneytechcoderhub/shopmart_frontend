import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Package, Upload, Download, SlidersHorizontal, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { catalogService } from '../../services/catalogService';
import { useProductsVersion } from '../../hooks/useProductsVersion';
import { formatPrice } from '../../utils/format';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Spinner from '../../components/common/Spinner';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import BulkProductImportModal from '../../components/admin/BulkProductImportModal';
import { toCsv, downloadCsvText } from '../../utils/csv';

const STATUS_BADGE = {
  APPROVED: 'bg-emerald-100 text-emerald-700',
  PENDING: 'bg-amber-100 text-amber-700',
  REJECTED: 'bg-red-100 text-red-700',
};

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING_APPROVAL', label: 'Pending approval' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'name,asc', label: 'Name (A–Z)' },
  { value: 'name,desc', label: 'Name (Z–A)' },
  { value: 'price,asc', label: 'Price (low–high)' },
  { value: 'price,desc', label: 'Price (high–low)' },
  { value: 'stock,asc', label: 'Stock (low–high)' },
];

const statusLabel = (s) => (s ? s[0] + s.slice(1).toLowerCase() : 'Approved');
const PAGE_SIZE = 20;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('createdAt,desc');
  const [page, setPage] = useState(0);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const version = useProductsVersion();

  // Advanced filters
  const [showFilters, setShowFilters] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const activeFilterCount = [categoryId, brandId, minPrice, maxPrice, minStock, maxStock].filter(Boolean).length;

  // Bulk selection & import
  const [selected, setSelected] = useState(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    Promise.all([catalogService.getCategories(), catalogService.getBrands()])
      .then(([cats, brs]) => {
        setCategories(Array.isArray(cats) ? cats : cats?.content || []);
        setBrands(Array.isArray(brs) ? brs : brs?.content || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    let active = true;
    setLoading(true);
    catalogService.getAllProducts({ status: status || undefined, q: q || undefined, sort, page, size: PAGE_SIZE })
      .then((data) => {
        if (!active) return;
        let list = data?.content || [];
        // Advanced filters are applied client-side on top of the fetched page —
        // the admin listing endpoint doesn't take category/brand/price/stock
        // params, so filtering a full 20-item page keeps this simple without a
        // new backend query contract.
        if (categoryId) list = list.filter((p) => String(p.categoryId) === String(categoryId));
        if (brandId) list = list.filter((p) => String(p.brandId) === String(brandId));
        if (minPrice) list = list.filter((p) => Number(p.price) >= Number(minPrice));
        if (maxPrice) list = list.filter((p) => Number(p.price) <= Number(maxPrice));
        if (minStock) list = list.filter((p) => Number(p.stock) >= Number(minStock));
        if (maxStock) list = list.filter((p) => Number(p.stock) <= Number(maxStock));
        setProducts(list);
        setTotalPages(data?.totalPages || 1);
      })
      .catch(() => { if (active) toast.error('Failed to load products'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, q, sort, page, categoryId, brandId, minPrice, maxPrice, minStock, maxStock]);

  // Reload whenever the shared product store changes (e.g. a Super Admin
  // approves or deletes a product elsewhere), so this list stays in sync.
  useEffect(() => load(), [load, version]);

  // Reset to page 0 whenever a filter changes so we don't get stuck on an
  // out-of-range page.
  useEffect(() => { setPage(0); }, [status, q, sort, categoryId, brandId, minPrice, maxPrice, minStock, maxStock]);
  useEffect(() => { setSelected(new Set()); }, [products]);

  const toggleOne = (id) => setSelected((s) => { const next = new Set(s); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const toggleAll = () => setSelected((s) => (s.size === products.length ? new Set() : new Set(products.map((p) => p.id))));

  const clearFilters = () => { setCategoryId(''); setBrandId(''); setMinPrice(''); setMaxPrice(''); setMinStock(''); setMaxStock(''); };

  const bulkDelete = async () => {
    if (!window.confirm(`Delete ${selected.size} selected product(s)? This can't be undone.`)) return;
    setBulkBusy(true);
    const results = await catalogService.bulkDeleteProducts([...selected]);
    const ok = results.filter((r) => r.ok).length;
    toast[ok === results.length ? 'success' : 'error'](`Deleted ${ok} of ${results.length} products`);
    setBulkBusy(false);
    setSelected(new Set());
    load();
  };

  // Backend gap: PUT /products/{id} may not accept an arbitrary `status`
  // change (only the Super Admin approve/reject endpoints are confirmed to
  // move status). This works today in demo mode; on the real API it either
  // works if the backend accepts it, or fails per-row with a clear error in
  // the toast below rather than silently pretending success.
  const bulkSetStatus = async (newStatus) => {
    setBulkBusy(true);
    const targets = products.filter((p) => selected.has(p.id));
    // updateProduct() rebuilds the full backend payload from `patch`, not a
    // partial diff — send the whole product with just the status swapped so
    // required fields (name/price/category…) are still present on the real API path.
    const results = await catalogService.bulkUpdateProducts(targets.map((p) => ({ id: p.id, patch: { ...p, status: newStatus } })));
    const ok = results.filter((r) => r.ok).length;
    toast[ok === results.length ? 'success' : 'error'](`Updated ${ok} of ${results.length} products`);
    setBulkBusy(false);
    setSelected(new Set());
    load();
  };

  const bulkAdjustPrice = async () => {
    const pctStr = window.prompt('Adjust price by percent (e.g. 10 for +10%, -15 for -15%):', '0');
    if (pctStr == null) return;
    const pct = Number(pctStr);
    if (Number.isNaN(pct) || pct === 0) return;
    setBulkBusy(true);
    const targets = products.filter((p) => selected.has(p.id));
    const results = await catalogService.bulkUpdateProducts(targets.map((p) => ({
      id: p.id,
      patch: { ...p, price: Math.max(1, Math.round(p.price * (1 + pct / 100))) },
    })));
    const ok = results.filter((r) => r.ok).length;
    toast[ok === results.length ? 'success' : 'error'](`Adjusted price on ${ok} of ${results.length} products`);
    setBulkBusy(false);
    setSelected(new Set());
    load();
  };

  const exportCsv = () => {
    const columns = [
      { key: 'id', label: 'ID' }, { key: 'name', label: 'Name' }, { key: 'sku', label: 'SKU' },
      { key: 'categoryName', label: 'Category' }, { key: 'brandName', label: 'Brand' },
      { key: 'price', label: 'Price' }, { key: 'stock', label: 'Stock' }, { key: 'status', label: 'Status' },
    ];
    downloadCsvText(toCsv(columns, products), `shopmart-products-${Date.now()}.csv`);
    toast.success(`Exported ${products.length} products`);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await catalogService.deleteProduct(toDelete.id);
      setProducts((list) => list.filter((p) => p.id !== toDelete.id));
      toast.success(`“${toDelete.name}” deleted`);
      setToDelete(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the product');
    } finally {
      setDeleting(false);
    }
  };

  const stockBadge = (stock) => {
    if (stock === 0) return <span className="badge bg-red-100 text-red-700">Out of stock</span>;
    if (stock < 10) return <span className="badge bg-amber-100 text-amber-700">Low · {stock}</span>;
    return <span className="badge bg-emerald-100 text-emerald-700">{stock} in stock</span>;
  };

  return (
    <div>
      <AdminPageHeader
        title="Products"
        subtitle="Create, edit, and manage your catalog. New products go live only after Super Admin approval."
        action={(
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setShowImport(true)} className="btn-outline"><Upload className="h-4 w-4" /> Bulk import</button>
            <button onClick={exportCsv} className="btn-outline"><Download className="h-4 w-4" /> Export</button>
            <Link to="/admin/products/new" className="btn-primary"><Plus className="h-4 w-4" /> Add product</Link>
          </div>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="field pl-10" placeholder="Search products…" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="field w-auto">
          {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="field w-auto">
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setShowFilters((v) => !v)} className={`btn-outline ${activeFilterCount ? '!border-brand-500 !text-brand-700' : ''}`}>
          <SlidersHorizontal className="h-4 w-4" /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {showFilters && (
        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <label className="label !mb-1 text-xs">Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field h-9 text-sm">
              <option value="">Any</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label !mb-1 text-xs">Brand</label>
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)} className="field h-9 text-sm">
              <option value="">Any</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label !mb-1 text-xs">Min price (₹)</label>
            <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="field h-9 text-sm" />
          </div>
          <div>
            <label className="label !mb-1 text-xs">Max price (₹)</label>
            <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="field h-9 text-sm" />
          </div>
          <div>
            <label className="label !mb-1 text-xs">Min stock</label>
            <input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} className="field h-9 text-sm" />
          </div>
          <div>
            <label className="label !mb-1 text-xs">Max stock</label>
            <input type="number" value={maxStock} onChange={(e) => setMaxStock(e.target.value)} className="field h-9 text-sm" />
          </div>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn-ghost col-span-full h-8 w-fit text-xs text-red-600"><X className="h-3.5 w-3.5" /> Clear filters</button>
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5">
          <span className="text-sm font-medium text-brand-700">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {/* No "Mark active" here on purpose — publishing a product is a Super
                Admin approval decision (see Approvals page), not a plain admin
                bulk action. */}
            <button disabled={bulkBusy} onClick={() => bulkSetStatus('ARCHIVED')} className="btn-outline h-8 text-xs">Archive</button>
            <button disabled={bulkBusy} onClick={bulkAdjustPrice} className="btn-outline h-8 text-xs">Adjust price %</button>
            <button disabled={bulkBusy} onClick={bulkDelete} className="btn-outline h-8 border-red-200 text-xs text-red-600 hover:bg-red-50">
              {bulkBusy ? <Spinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />} Delete
            </button>
            <button onClick={() => setSelected(new Set())} className="btn-ghost h-8 text-xs">Clear</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : products.length === 0 ? (
        <EmptyState icon={Package} title="No products found" description="Try a different search or filter, or add a new product." />
      ) : (
        <AdminTable columns={[
          <input key="select-all" type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={selected.size === products.length && products.length > 0} onChange={toggleAll} />,
          'Product', 'Category', 'Brand', 'Price', 'Stock', 'Status', '',
        ]}>
          {products.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <input type="checkbox" className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} />
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={p.images?.[0]} alt={p.name} className="h-11 w-11 rounded-lg object-cover" />
                  <span className="font-medium text-ink line-clamp-1">{p.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{p.categoryName}</td>
              <td className="px-4 py-3 text-ink-soft">{p.brandName}</td>
              <td className="px-4 py-3 font-medium text-ink">{formatPrice(p.price)}</td>
              <td className="px-4 py-3">{stockBadge(p.stock)}</td>
              <td className="px-4 py-3">
                <span className={`badge ${STATUS_BADGE[p.status] || STATUS_BADGE.APPROVED}`}>
                  {statusLabel(p.status)}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <Link to={`/admin/products/${p.id}/edit`} className="btn-ghost h-8 w-8 p-0" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button onClick={() => setToDelete(p)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal
        open={!!toDelete}
        onClose={() => !deleting && setToDelete(null)}
        title="Delete product?"
        footer={(
          <>
            <button onClick={() => setToDelete(null)} disabled={deleting} className="btn-ghost">Cancel</button>
            <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
              {deleting ? <Spinner /> : null} {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">
          Are you sure you want to delete <span className="font-medium text-ink">{toDelete?.name}</span>? This removes it from the storefront immediately and can’t be undone.
        </p>
      </Modal>

      <BulkProductImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        categories={categories}
        brands={brands}
        onDone={load}
      />
    </div>
  );
}
