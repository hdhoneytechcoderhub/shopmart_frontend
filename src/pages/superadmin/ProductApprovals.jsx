import { useState, useEffect, useCallback } from 'react';
import { Check, X, Eye, ClipboardCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { AdminPageHeader, AdminTable } from '../../components/admin/AdminUI';
import Modal from '../../components/common/Modal';
import EmptyState from '../../components/common/EmptyState';
import Spinner from '../../components/common/Spinner';
import { catalogService } from '../../services/catalogService';
import { useProductsVersion } from '../../hooks/useProductsVersion';
import { formatPrice, timeAgo, discountPercent } from '../../utils/format';

const TABS = [
  { key: 'PENDING', label: 'Pending' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Rejected' },
];

// Map a stored product (carrying approval metadata) to an approval-row shape.
const toRow = (p) => ({
  id: p.approvalId || `AP-${1000 + p.id}`,
  productId: p.id,
  product: p,
  submittedBy: p.submittedBy || 'Admin',
  submittedAt: p.submittedAt,
  status: p.status || 'APPROVED',
  reviewedBy: p.reviewedBy,
  reason: p.reason,
});

export default function ProductApprovals() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('PENDING');
  const [view, setView] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const version = useProductsVersion();

  const load = useCallback(() => {
    let active = true;
    catalogService.getApprovals()
      .then((list) => { if (active) setRows((Array.isArray(list) ? list : []).map(toRow)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Auto-refresh when the shared store changes (e.g. an admin submits a new product).
  useEffect(() => load(), [load, version]);

  const count = (status) => rows.filter((r) => r.status === status).length;
  const visible = rows.filter((r) => r.status === tab);

  const approve = async (r) => {
    setBusy(true);
    try {
      await catalogService.approveProduct(r.productId);
      toast.success(`Approved “${r.product.name}” — now live on the store`);
      setView(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not approve the product');
    } finally {
      setBusy(false);
    }
  };

  const confirmReject = async () => {
    setBusy(true);
    try {
      await catalogService.rejectProduct(rejecting.productId, reason.trim() || 'Not specified');
      toast.success(`Rejected “${rejecting.product.name}”`);
      setRejecting(null); setReason(''); setView(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not reject the product');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await catalogService.deleteProduct(deleting.productId);
      toast.success(`Deleted “${deleting.product.name}” — removed from the store`);
      setDeleting(null); setView(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not delete the product');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Product Approvals" subtitle="Review products submitted by admins. Only approved products appear on the storefront." />

      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t.key ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'}`}>
            {t.label}
            <span className={`rounded-full px-1.5 text-xs ${tab === t.key ? 'bg-white/20' : 'bg-white'}`}>{count(t.key)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-600"><Spinner className="h-8 w-8" /></div>
      ) : visible.length === 0 ? (
        <EmptyState icon={ClipboardCheck} title={`No ${tab.toLowerCase()} products`} description="Nothing to show in this tab." />
      ) : (
        <AdminTable columns={['Product', 'Submitted by', 'When', 'Status', 'Actions']}>
          {visible.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <img src={a.product.images?.[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                  <div>
                    <p className="font-medium text-ink line-clamp-1">{a.product.name}</p>
                    <p className="text-xs text-ink-muted">{formatPrice(a.product.price)} · {a.id}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{a.submittedBy}</td>
              <td className="px-4 py-3 text-ink-muted">{timeAgo(a.submittedAt)}</td>
              <td className="px-4 py-3">
                <span className={`badge ${a.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : a.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {a.status[0] + a.status.slice(1).toLowerCase()}
                </span>
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1.5">
                  <button onClick={() => setView(a)} className="btn-ghost h-8 px-2 text-xs"><Eye className="h-3.5 w-3.5" /> View Details</button>
                  {a.status === 'PENDING' && (
                    <>
                      <button disabled={busy} onClick={() => approve(a)} className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"><Check className="h-3.5 w-3.5" /> Approve</button>
                      <button disabled={busy} onClick={() => { setRejecting(a); setReason(''); }} className="inline-flex h-8 items-center gap-1 rounded-lg bg-red-600 px-2.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"><X className="h-3.5 w-3.5" /> Reject</button>
                    </>
                  )}
                  <button disabled={busy} onClick={() => setDeleting(a)} className="btn-ghost h-8 w-8 p-0 text-red-600 hover:bg-red-50" aria-label="Delete product"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}

      {/* View details */}
      <Modal
        open={!!view}
        onClose={() => setView(null)}
        title="Product details"
        size="lg"
        footer={view?.status === 'PENDING' ? (
          <>
            <button disabled={busy} onClick={() => { setRejecting(view); setReason(''); }} className="btn-danger">Reject</button>
            <button disabled={busy} onClick={() => approve(view)} className="btn-primary"><Check className="h-4 w-4" /> Approve</button>
          </>
        ) : <button onClick={() => setView(null)} className="btn-ghost">Close</button>}
      >
        {view && (
          <div className="flex gap-4">
            <img src={view.product.images?.[0]} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            <div className="min-w-0 text-sm">
              <p className="text-base font-semibold text-ink">{view.product.name}</p>
              <p className="mt-1 text-ink-muted">{view.product.categoryName} · {view.product.brandName}</p>
              <p className="mt-2">
                <span className="text-lg font-bold text-ink">{formatPrice(view.product.price)}</span>{' '}
                <span className="text-ink-muted line-through">{formatPrice(view.product.mrp)}</span>{' '}
                <span className="font-medium text-emerald-600">{discountPercent(view.product.mrp, view.product.price)}% off</span>
              </p>
              <p className="mt-2 text-ink-soft">Submitted by <span className="font-medium text-ink">{view.submittedBy}</span> · {timeAgo(view.submittedAt)}</p>
              {view.reason && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-red-700">Rejection reason: {view.reason}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Reject reason */}
      <Modal
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        title="Reject product"
        footer={(
          <>
            <button onClick={() => setRejecting(null)} disabled={busy} className="btn-ghost">Cancel</button>
            <button onClick={confirmReject} disabled={busy} className="btn-danger">{busy ? <Spinner /> : null} Confirm reject</button>
          </>
        )}
      >
        <p className="mb-3 text-sm text-ink-muted">Add a reason for rejecting <span className="font-medium text-ink">{rejecting?.product.name}</span>. The submitting admin will see this.</p>
        <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="field resize-none" placeholder="e.g. Images are low quality / pricing needs revision" />
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleting}
        onClose={() => !busy && setDeleting(null)}
        title="Delete product?"
        footer={(
          <>
            <button onClick={() => setDeleting(null)} disabled={busy} className="btn-ghost">Cancel</button>
            <button onClick={confirmDelete} disabled={busy} className="btn-danger">{busy ? <Spinner /> : null} {busy ? 'Deleting…' : 'Delete'}</button>
          </>
        )}
      >
        <p className="text-sm text-ink-muted">
          Permanently delete <span className="font-medium text-ink">{deleting?.product.name}</span>? It will be removed from the storefront immediately and can’t be undone.
        </p>
      </Modal>
    </div>
  );
}
