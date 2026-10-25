// ──────────────────────────────────────────────────────────────────────────
// Demo product store — the single source of truth for products while the app
// runs in demo mode (VITE_DEMO_MODE=true, the default).
//
// Why this exists:
//   The storefront, the Admin panel, and the Super Admin panel used to each
//   read/mutate their own static copy of the catalog. That meant admin-added
//   products never reached the storefront, approvals did nothing, and deletes
//   weren't reflected on the site. This module gives all three surfaces one
//   shared, persisted store (localStorage) so the approval + delete workflows
//   behave like a real backend:
//
//     • Admin "Add product"      → product is created with status PENDING.
//     • Storefront               → only ever shows status APPROVED products.
//     • Super Admin "Approve"    → flips PENDING → APPROVED (now visible).
//     • Super Admin "Reject"     → flips to REJECTED (stays hidden).
//     • Super Admin / Admin "Delete" → removed everywhere, immediately.
//
// Changes broadcast a custom event (same tab) and ride the native `storage`
// event (other tabs), so an open storefront refreshes the moment the admin
// approves or deletes a product — no manual reload needed.
// ──────────────────────────────────────────────────────────────────────────
import { mockProducts } from './mockData';
import { seedApprovals } from './superAdminMock';

const KEY = 'sm_demo_products_v1';
const EVENT = 'sm:demo-products-changed';

export const PRODUCT_STATUS = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
};

const slugify = (s = '') =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Build the initial product set from the catalog mock, deriving an approval
// status for each product from the seed approval queue so the demo is coherent:
// products that were "submitted but not yet approved/rejected" stay hidden from
// the storefront until a Super Admin acts on them.
function seed() {
  const byId = new Map();
  seedApprovals.forEach((a) => {
    const pid = a.product?.id;
    if (pid == null) return;
    byId.set(pid, {
      approvalId: a.id,
      status: a.status,
      submittedBy: a.submittedBy,
      submittedAt: a.submittedAt,
      reviewedBy: a.reviewedBy || null,
      reason: a.reason || null,
    });
  });

  return mockProducts.map((p) => {
    const meta = byId.get(p.id);
    const status = meta?.status || PRODUCT_STATUS.APPROVED;
    return {
      ...p,
      status,
      approvalId: meta?.approvalId || `AP-${1000 + p.id}`,
      submittedBy: meta?.submittedBy || 'System',
      submittedAt: meta?.submittedAt || new Date(Date.now() - p.id * 86400000).toISOString(),
      reviewedBy: meta?.reviewedBy ?? (status === PRODUCT_STATUS.APPROVED ? 'Super Admin' : null),
      reviewedAt: meta && status !== PRODUCT_STATUS.PENDING ? p.submittedAt : null,
      reason: meta?.reason ?? null,
    };
  });
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch { /* fall through to re-seed */ }
  const seeded = seed();
  persist(seeded, { silent: true });
  return seeded;
}

function persist(list, { silent = false } = {}) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* ignore quota */ }
  if (!silent && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

const clone = (x) => JSON.parse(JSON.stringify(x));

// ── Reads ────────────────────────────────────────────────────────────────
export const getAllProducts = () => clone(read());

export const getApprovedProducts = () =>
  read().filter((p) => p.status === PRODUCT_STATUS.APPROVED).map(clone);

export const getProductById = (id) => {
  const found = read().find((p) => String(p.id) === String(id));
  return found ? clone(found) : null;
};

export const getProductBySlug = (slug, { approvedOnly = true } = {}) => {
  const list = read();
  const match = list.find((p) => p.slug === slug);
  if (match && (!approvedOnly || match.status === PRODUCT_STATUS.APPROVED)) return clone(match);
  return null;
};

// ── Writes ──────────────────────────────────────────────────────────────
export function createProduct(payload, { submittedBy = 'Admin' } = {}) {
  const list = read();
  const nextId = list.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0) + 1;
  const now = new Date().toISOString();

  const product = {
    id: nextId,
    name: payload.name || 'Untitled product',
    slug: payload.slug || slugify(payload.name) || `product-${nextId}`,
    description: payload.description || '',
    price: Number(payload.price) || 0,
    mrp: Number(payload.mrp) || Number(payload.price) || 0,
    rating: 0,
    reviewCount: 0,
    stock: Number(payload.stock) || 0,
    categoryId: payload.categoryId ? Number(payload.categoryId) : null,
    categoryName: payload.categoryName || '',
    brandId: payload.brandId ? Number(payload.brandId) : null,
    brandName: payload.brandName || '',
    featured: !!payload.featured,
    bestSeller: false,
    newArrival: true,
    sku: payload.sku || '',
    images: (payload.images || []).filter(Boolean).length
      ? payload.images.filter(Boolean)
      : [`https://picsum.photos/seed/sm-new-${nextId}/600/600`],
    variants: {
      sizes: payload.variants?.sizes || payload.sizes || [],
      colors: payload.variants?.colors || payload.colors || [],
    },
    // New admin-created products always start life awaiting Super Admin review.
    status: PRODUCT_STATUS.PENDING,
    approvalId: `AP-${2000 + nextId}`,
    submittedBy,
    submittedAt: now,
    reviewedBy: null,
    reviewedAt: null,
    reason: null,
  };

  list.push(product);
  persist(list);
  return clone(product);
}

export function updateProduct(id, patch = {}) {
  const list = read();
  const idx = list.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;

  const current = list[idx];
  const next = {
    ...current,
    ...patch,
    price: patch.price != null ? Number(patch.price) : current.price,
    mrp: patch.mrp != null ? Number(patch.mrp) : current.mrp,
    stock: patch.stock != null ? Number(patch.stock) : current.stock,
    categoryId: patch.categoryId != null ? Number(patch.categoryId) : current.categoryId,
    brandId: patch.brandId != null ? Number(patch.brandId) : current.brandId,
    variants: {
      sizes: patch.variants?.sizes || patch.sizes || current.variants?.sizes || [],
      colors: patch.variants?.colors || patch.colors || current.variants?.colors || [],
    },
    images: patch.images ? patch.images.filter(Boolean) : current.images,
  };

  list[idx] = next;
  persist(list);
  return clone(next);
}

export function setProductStatus(id, status, meta = {}) {
  const list = read();
  const idx = list.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return null;

  list[idx] = {
    ...list[idx],
    status,
    reviewedBy: meta.reviewedBy || 'Super Admin',
    reviewedAt: new Date().toISOString(),
    reason: status === PRODUCT_STATUS.REJECTED ? (meta.reason || 'Not specified') : null,
  };
  persist(list);
  return clone(list[idx]);
}

export function deleteProduct(id) {
  const list = read();
  const next = list.filter((p) => String(p.id) !== String(id));
  if (next.length === list.length) return false;
  persist(next);
  return true;
}

// Restore the original seeded catalog (handy for demos / QA).
export function resetProducts() {
  const seeded = seed();
  persist(seeded);
  return seeded.map(clone);
}

// ── Change subscription ────────────────────────────────────────────────────
export function subscribe(cb) {
  if (typeof window === 'undefined') return () => {};
  const onCustom = () => cb();
  const onStorage = (e) => { if (e.key === KEY) cb(); };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
