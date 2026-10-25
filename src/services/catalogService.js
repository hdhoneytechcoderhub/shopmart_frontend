import api, { DEMO_MODE } from './api';
import { mockCategories, mockBrands, mockReviews, mockBanners } from './mockData';
import * as demoStore from './demoStore';
import { createDemoStore } from './demoCrud';

// Catalog reads gracefully fall back to demo data on network error,
// so the storefront is browsable before the backend is connected.
const useMock = (err) => {
  // Only fall back for connection-level failures, not for real 4xx/5xx from the API.
  if (err?.response) throw err;
  return true;
};

// ── Real-API → admin-UI normalizer ──────────────────────────────────────
// Backend ProductStatus is DRAFT/PENDING_APPROVAL/ACTIVE/REJECTED/ARCHIVED/
// OUT_OF_STOCK; the admin approval screens were built against a simpler
// PENDING/APPROVED/REJECTED vocabulary. Backend "price" is the base/original
// price (shown as MRP with a strikethrough) and "salePrice" is the actual
// selling price — the opposite of what the admin form's field names suggest.
const PRODUCT_STATUS_MAP = {
  DRAFT: 'PENDING', PENDING_APPROVAL: 'PENDING',
  ACTIVE: 'APPROVED', OUT_OF_STOCK: 'APPROVED',
  REJECTED: 'REJECTED', ARCHIVED: 'REJECTED',
};

const normalizeAdminProduct = (p) => ({
  ...p,
  mrp: p.price,
  price: p.salePrice ?? p.price,
  images: Array.isArray(p.images)
    ? p.images.map((im) => (typeof im === 'string' ? im : im.url))
    : (p.thumbnail ? [p.thumbnail] : []),
  status: PRODUCT_STATUS_MAP[p.status] || p.status,
  reason: p.rejectionReason,
});

// Reverse direction: the admin form builds a payload in the app's long-standing
// shape ({ price, mrp, images: [urls], variants: {sizes, colors, rows} }). The
// real backend wants { price: <base>, salePrice: <discounted>, images: [{url,alt,position}] }.
// There is now a proper per-combo variant editor (VariantMatrixEditor), so
// variants.rows — one row per size+color combo with its own sku/price/stock —
// is sent as `variants: [{size,color,sku,price,stock}]`, matching the
// ProductVariantDto shape described in the original comment here.
//
// Backend gap, flagged rather than guessed at: metaTitle/metaDescription/
// metaKeywords and lowStockThreshold are NOT confirmed fields on
// ProductRequest today (Category's DTO does accept metaTitle/metaDescription,
// Product's has not been verified). They're still included below so the data
// travels once the backend adds the columns; until then, an API that ignores
// unknown JSON fields will silently drop them — nothing here assumes they're
// persisted.
const toBackendPayload = (payload) => ({
  name: payload.name,
  description: payload.description,
  sku: payload.sku || undefined,
  price: Number(payload.mrp) || Number(payload.price) || 0,
  salePrice: payload.price ? Number(payload.price) : undefined,
  stock: Number(payload.stock) || 0,
  status: payload.status || undefined,
  categoryId: payload.categoryId ? Number(payload.categoryId) : null,
  brandId: payload.brandId ? Number(payload.brandId) : null,
  featured: !!payload.featured,
  images: (payload.images || []).filter(Boolean).map((url, i) => ({ url, alt: payload.name, position: i })),
  variants: (payload.variants?.rows || [])
    .filter((v) => v.sku || v.price || v.stock)
    .map((v) => ({
      size: v.size ?? undefined,
      color: v.color ?? undefined,
      sku: v.sku || undefined,
      price: v.price ? Number(v.price) : undefined,
      stock: v.stock !== '' && v.stock != null ? Number(v.stock) : 0,
    })),
  lowStockThreshold: payload.lowStockThreshold != null ? Number(payload.lowStockThreshold) : undefined,
  metaTitle: payload.metaTitle || undefined,
  metaDescription: payload.metaDescription || undefined,
  metaKeywords: payload.metaKeywords || undefined,
});


// Tolerate different backend response shapes: a raw array, a PageResponse
// ({ content: [...] }), or an already-unwrapped object.
// Storefront product cards/detail pages read product.mrp / product.rating /
// product.reviewCount everywhere (ProductCard, ProductDetails, Home, Shop) —
// none of those exist on the real backend, which sends price+salePrice (no
// separate mrp), ratingAverage, and ratingCount. Applied at every point a
// storefront-facing product list or detail object is returned.
const normalizeStorefrontProduct = (p) => (p ? {
  ...p,
  images: Array.isArray(p.images)
    ? p.images.map((im) => (typeof im === 'string' ? im : im.url))
    : (p.thumbnail ? [p.thumbnail] : (p.images || [])),
  mrp: p.mrp ?? p.price,
  price: p.salePrice ?? p.price,
  rating: p.rating ?? p.ratingAverage ?? 0,
  reviewCount: p.reviewCount ?? p.ratingCount ?? 0,
} : p);

const normalizeStorefrontProducts = (list) => (Array.isArray(list) ? list.map(normalizeStorefrontProduct) : list);

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  return [];
};

const asPage = (payload, fallbackItems = []) => {
  if (Array.isArray(payload)) {
    return { content: payload, totalElements: payload.length, totalPages: 1, number: 0 };
  }
  if (Array.isArray(payload?.content)) return payload;
  if (Array.isArray(payload?.data?.content)) return payload.data;
  if (Array.isArray(payload?.data)) {
    return { content: payload.data, totalElements: payload.data.length, totalPages: 1, number: 0 };
  }
  return { content: fallbackItems, totalElements: fallbackItems.length, totalPages: 1, number: 0 };
};

const paginate = (items, page = 0, size = 12) => ({
  content: items.slice(page * size, page * size + size),
  totalElements: items.length,
  totalPages: Math.max(1, Math.ceil(items.length / size)),
  number: page,
  size,
});

const toSlug = (s = '') => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const applyFilters = (items, params = {}) => {
  let list = [...items];
  const { q, category, brand, deal, minPrice, maxPrice, rating, sort } = params;
  if (q) list = list.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  if (category) list = list.filter((p) => String(p.categoryId) === String(category) || toSlug(p.categoryName) === category);
  if (brand) list = list.filter((p) => String(p.brandId) === String(brand) || toSlug(p.brandName) === toSlug(String(brand)));
  if (deal === true || deal === 'true') list = list.filter((p) => p.salePrice != null && Number(p.salePrice) < Number(p.mrp ?? p.price));
  if (minPrice) list = list.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));
  if (rating) list = list.filter((p) => Number(p.rating) >= Number(rating));
  switch (sort) {
    case 'price_asc': list.sort((a, b) => a.price - b.price); break;
    case 'price_desc': list.sort((a, b) => b.price - a.price); break;
    case 'rating': list.sort((a, b) => b.rating - a.rating); break;
    case 'popular': list.sort((a, b) => b.reviewCount - a.reviewCount); break;
    default: break;
  }
  return list;
};

// Storefront data is always the approved-only catalog (demo source of truth).
const approved = () => demoStore.getApprovedProducts();

export const catalogService = {
  // ── Storefront reads (APPROVED products only) ──────────────────────────
  async getProducts(params = {}) {
    if (DEMO_MODE) {
      return paginate(applyFilters(approved(), params), params.page || 0, params.size || 12);
    }
    try {
      // Ask the backend for live (approved) products only.
      const { data } = await api.get('/products', { params: { ...params, status: 'APPROVED' } });
      const page = asPage(data);
      return { ...page, content: normalizeStorefrontProducts(page.content) };
    } catch (err) {
      if (useMock(err)) {
        return paginate(applyFilters(approved(), params), params.page || 0, params.size || 12);
      }
    }
    return paginate(applyFilters(approved(), params), params.page || 0, params.size || 12);
  },

  async getProductBySlug(slug) {
    if (DEMO_MODE) {
      return demoStore.getProductBySlug(slug) || approved()[0] || null;
    }
    try {
      const { data } = await api.get(`/products/slug/${slug}`);
      return normalizeStorefrontProduct(data?.data ?? data);
    } catch (err) {
      if (useMock(err)) {
        return demoStore.getProductBySlug(slug) || approved()[0] || null;
      }
    }
    return demoStore.getProductBySlug(slug) || approved()[0] || null;
  },

  async getRelated(product) {
    const related = () => approved()
      .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
      .slice(0, 4);
    if (DEMO_MODE) return related();
    try {
      const { data } = await api.get(`/products/${product.id}/similar`, { params: { limit: 8 } });
      return normalizeStorefrontProducts(asArray(data));
    } catch (err) {
      if (useMock(err)) return related();
    }
    return related();
  },

  async getReviews(productId) {
    if (DEMO_MODE) return mockReviews(productId);
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      return asArray(data);
    } catch (err) {
      if (useMock(err)) return mockReviews(productId);
    }
    return mockReviews(productId);
  },

  // Admin management listing — every category regardless of active/inactive
  // status, so the admin table can see and re-enable disabled categories.
  async getCategories() {
    if (DEMO_MODE) return categoryDemo.list();
    try {
      const { data } = await api.get('/categories');
      return asArray(data).map(fromCategoryApi);
    } catch (err) {
      if (useMock(err)) return categoryDemo.list();
    }
    return categoryDemo.list();
  },

  // Storefront-facing listing — top-level, active-only categories, backed by
  // GET /categories/root. Nothing should render on the public site until an
  // admin has actually created and activated a category, so this never falls
  // back to the full admin list; the empty-array case is a real, valid result.
  async getStorefrontCategories() {
    const activeTopLevel = (list) => list.filter((c) => c.active !== false && !c.parentId);
    if (DEMO_MODE) return activeTopLevel(categoryDemo.list());
    try {
      const { data } = await api.get('/categories/root');
      return asArray(data).map(fromCategoryApi);
    } catch (err) {
      if (useMock(err)) return activeTopLevel(categoryDemo.list());
    }
    return activeTopLevel(categoryDemo.list());
  },

  async getBrands() {
    if (DEMO_MODE) return brandDemo.list();
    try {
      const { data } = await api.get('/brands');
      return asArray(data).map(fromBrandApi);
    } catch (err) {
      if (useMock(err)) return brandDemo.list();
    }
    return brandDemo.list();
  },

  async getBanners() {
    if (DEMO_MODE) return mockBanners;
    try {
      const { data } = await api.get('/banners');
      return asArray(data);
    } catch (err) {
      if (useMock(err)) return mockBanners;
    }
    return mockBanners;
  },

  async suggest(term) {
    const q = (term || '').trim();
    if (!q) return { products: [], categories: [] };
    const localSuggest = () => {
      const lc = q.toLowerCase();
      const products = approved()
        .filter((p) => p.name.toLowerCase().includes(lc) || p.brandName?.toLowerCase().includes(lc) || p.categoryName?.toLowerCase().includes(lc))
        .slice(0, 6);
      const categories = mockCategories.filter((c) => c.name.toLowerCase().includes(lc)).slice(0, 4);
      return { products, categories };
    };
    if (DEMO_MODE) return localSuggest();
    try {
      const { data } = await api.get('/products', { params: { q, size: 6, status: 'APPROVED' } });
      return { products: normalizeStorefrontProducts(asArray(data)).slice(0, 6), categories: [] };
    } catch (err) {
      if (useMock(err)) return localSuggest();
      return { products: [], categories: [] };
    }
  },

  // Backend gap: there's no `bestSeller` flag or a public "rank by units
  // sold" endpoint — the only real sales-ranking data
  // (/admin/analytics/top-products) is admin-only. Uses the real
  // /products/featured and /products/latest endpoints for the two sections
  // that do have real backend support. "Best Sellers" uses GET /products
  // with sort=popular (featured-first, then rating — the closest available
  // proxy for "sells well" until real units-sold data exists) rather than
  // silently falling back to newest-first; that limitation is documented
  // here, not hidden.
  async getHomeFeeds() {
    const localFeeds = () => {
      const list = approved();
      return {
        featured: list.filter((p) => p.featured).slice(0, 8),
        bestSellers: list.filter((p) => p.bestSeller).slice(0, 8),
        newArrivals: list.filter((p) => p.newArrival).slice(0, 8),
      };
    };
    if (DEMO_MODE) return localFeeds();
    try {
      const [featured, latest, best] = await Promise.all([
        api.get('/products/featured', { params: { limit: 8 } }),
        api.get('/products/latest', { params: { limit: 8 } }),
        api.get('/products', { params: { size: 8, sort: 'popular' } }),
      ]);
      return {
        featured: normalizeStorefrontProducts(asArray(featured.data)),
        newArrivals: normalizeStorefrontProducts(asArray(latest.data)),
        bestSellers: normalizeStorefrontProducts(asArray(best.data)),
      };
    } catch (err) {
      if (useMock(err)) return localFeeds();
    }
    return localFeeds();
  },

  // ── Admin catalog (every status, incl. PENDING / REJECTED) ─────────────
  // Real endpoint: GET /products/admin/all?status=&q=&page=&size= — a real
  // unified listing across every status, with actual server-side pagination.
  // Previously this combined two separate endpoint calls (ACTIVE + PENDING)
  // and missed DRAFT/REJECTED/OUT_OF_STOCK entirely.
  async getAllProducts(params = {}) {
    if (DEMO_MODE) {
      const list = applyFilters(demoStore.getAllProducts(), params);
      return paginate(list, params.page || 0, params.size || 1000);
    }
    try {
      const { data } = await api.get('/products/admin/all', {
        params: { status: params.status || undefined, q: params.q || undefined, page: params.page || 0, size: params.size || 20, sort: params.sort || undefined },
      });
      const content = asArray(data).map(normalizeAdminProduct);
      return { content, totalElements: data?.totalElements ?? content.length, totalPages: data?.totalPages ?? 1, number: data?.page ?? (params.page || 0) };
    } catch (err) {
      if (useMock(err)) {
        const list = applyFilters(demoStore.getAllProducts(), params);
        return paginate(list, params.page || 0, params.size || 1000);
      }
      throw err;
    }
  },

  async getProductById(id) {
    if (DEMO_MODE) return demoStore.getProductById(id);
    try {
      const { data } = await api.get(`/products/${id}`);
      return data ? normalizeAdminProduct(data) : data;
    } catch (err) {
      if (useMock(err)) return demoStore.getProductById(id);
    }
    return demoStore.getProductById(id);
  },

  // ── Admin writes ───────────────────────────────────────────────────────
  // AdminProductForm.jsx builds payload in the app's long-standing shape;
  // toBackendPayload() translates it to the real backend's ProductRequest
  // shape only when actually calling the API (demo mode keeps the old shape).
  async createProduct(payload, opts = {}) {
    if (DEMO_MODE) return demoStore.createProduct(payload, opts);
    try {
      const { data } = await api.post('/products', toBackendPayload(payload));
      return data ? normalizeAdminProduct(data) : data;
    } catch (err) {
      if (useMock(err)) return demoStore.createProduct(payload, opts);
    }
    return demoStore.createProduct(payload, opts);
  },

  async updateProduct(id, payload) {
    if (DEMO_MODE) return demoStore.updateProduct(id, payload);
    try {
      const { data } = await api.put(`/products/${id}`, toBackendPayload(payload));
      return data ? normalizeAdminProduct(data) : data;
    } catch (err) {
      if (useMock(err)) return demoStore.updateProduct(id, payload);
    }
    return demoStore.updateProduct(id, payload);
  },

  async deleteProduct(id) {
    if (DEMO_MODE) { demoStore.deleteProduct(id); return { success: true }; }
    try {
      const { data } = await api.delete(`/products/${id}`);
      return data ?? { success: true };
    } catch (err) {
      if (useMock(err)) { demoStore.deleteProduct(id); return { success: true }; }
    }
    return { success: true };
  },

  // ── Super Admin approvals ──────────────────────────────────────────────
  // Was only ever calling the PENDING-only queue (GET /super-admin/products/pending),
  // so the Approved and Rejected tabs could never show anything — even a product
  // approved seconds ago would vanish from every tab, since it's no longer PENDING
  // and nothing fetched anything else. GET /products/admin/all returns every status
  // when no status filter is passed, so it covers all three tabs from one call.
  // Still missing on the backend: submittedBy / submittedAt / reviewedBy audit-trail
  // fields — not fabricated here.
  async getApprovals() {
    if (DEMO_MODE) return demoStore.getAllProducts();
    try {
      const { data } = await api.get('/products/admin/all', { params: { size: 500 } });
      return asArray(data).map(normalizeAdminProduct);
    } catch (err) {
      if (useMock(err)) return demoStore.getAllProducts();
    }
    return demoStore.getAllProducts();
  },

  async approveProduct(id) {
    if (DEMO_MODE) return demoStore.setProductStatus(id, demoStore.PRODUCT_STATUS.APPROVED, { reviewedBy: 'Super Admin' });
    try {
      const { data } = await api.put(`/super-admin/products/${id}/approve`);
      return data ?? { success: true };
    } catch (err) {
      if (useMock(err)) return demoStore.setProductStatus(id, demoStore.PRODUCT_STATUS.APPROVED, { reviewedBy: 'Super Admin' });
    }
    return { success: true };
  },

  async rejectProduct(id, reason) {
    if (DEMO_MODE) return demoStore.setProductStatus(id, demoStore.PRODUCT_STATUS.REJECTED, { reviewedBy: 'Super Admin', reason });
    try {
      const { data } = await api.put(`/super-admin/products/${id}/reject`, { reason });
      return data ?? { success: true };
    } catch (err) {
      if (useMock(err)) return demoStore.setProductStatus(id, demoStore.PRODUCT_STATUS.REJECTED, { reviewedBy: 'Super Admin', reason });
    }
    return { success: true };
  },
};

// ─── Category CRUD (admin) ──────────────────────────────────────────────
// Backend: no /admin prefix — POST/PUT/DELETE /categories (real ADMIN-role
// routes). Backend field is `bannerUrl`; the admin form calls it `image`.
// Backend gap: Category has no soft-delete (`isDeleted`) column — delete()
// is a hard DELETE, so removing a category still referenced by products
// will fail with a real FK-constraint error rather than silently soft-deleting.
const categoryDemo = createDemoStore('sm_demo_categories_v1', mockCategories);
// Backend gap, flagged rather than guessed at: the Category entity/DTO has
// not been confirmed to have parentId or sortOrder columns yet — this is a
// genuinely missing backend feature (see status doc). They're sent anyway so
// the hierarchy/drag-sort UI works fully in demo mode today and starts
// working for real the moment those columns exist; an API that ignores
// unknown fields will just drop them in the meantime, same as SEO fields.
const toCategoryApi = (payload) => ({
  name: payload.name, description: payload.description, bannerUrl: payload.image,
  metaTitle: payload.metaTitle, metaDescription: payload.metaDescription, metaKeywords: payload.metaKeywords,
  parentId: payload.parentId || null, sortOrder: payload.sortOrder ?? 0,
  active: payload.active ?? true,
});
const fromCategoryApi = (c) => ({ ...c, image: c.bannerUrl, parentId: c.parentId ?? null, sortOrder: c.sortOrder ?? 0 });

catalogService.createCategory = async function(payload) {
  if (DEMO_MODE) return categoryDemo.create(payload);
  const { data } = await api.post('/categories', toCategoryApi(payload));
  return fromCategoryApi(data);
};

catalogService.updateCategory = async function(id, payload) {
  if (DEMO_MODE) return categoryDemo.update(id, payload);
  const { data } = await api.put(`/categories/${id}`, toCategoryApi(payload));
  return fromCategoryApi(data);
};

catalogService.deleteCategory = async function(id) {
  if (DEMO_MODE) return categoryDemo.remove(id);
  const { data } = await api.delete(`/categories/${id}`);
  return data ?? { success: true };
};

// ─── Brand CRUD (admin) ─────────────────────────────────────────────────
// This didn't exist before — AdminBrands.jsx only mutated local React state,
// so every add/edit/delete vanished on refresh. Backend field is `logoUrl`;
// the admin form calls it `logo`.
const brandDemo = createDemoStore('sm_demo_brands_v1', mockBrands);
const toBrandApi = (payload) => ({
  name: payload.name, description: payload.description, logoUrl: payload.logo,
  bannerUrl: payload.banner, metaTitle: payload.metaTitle, metaDescription: payload.metaDescription,
  active: payload.active ?? true,
});
const fromBrandApi = (b) => ({ ...b, logo: b.logoUrl });

catalogService.createBrand = async function(payload) {
  if (DEMO_MODE) return brandDemo.create(payload);
  const { data } = await api.post('/brands', toBrandApi(payload));
  return fromBrandApi(data);
};

catalogService.updateBrand = async function(id, payload) {
  if (DEMO_MODE) return brandDemo.update(id, payload);
  const { data } = await api.put(`/brands/${id}`, toBrandApi(payload));
  return fromBrandApi(data);
};

catalogService.deleteBrand = async function(id) {
  if (DEMO_MODE) return brandDemo.remove(id);
  const { data } = await api.delete(`/brands/${id}`);
  return data ?? { success: true };
};

// ─── Bulk product operations ────────────────────────────────────────────
// Backend gap: there's no dedicated bulk endpoint (e.g. POST /products/bulk).
// These loop over the existing single-item create/update/delete calls
// instead of fabricating a bulk API that doesn't exist — slower than a real
// batch endpoint, but every call is one that's already known to work. Each
// result is reported individually so a partial failure (e.g. row 14 of a
// 200-row CSV) doesn't silently drop the other 199.
async function runBulk(items, fn, getLabel) {
  const results = [];
  for (const item of items) {
    try {
      const data = await fn(item);
      results.push({ ok: true, label: getLabel(item), data });
    } catch (err) {
      results.push({ ok: false, label: getLabel(item), error: err?.response?.data?.message || err.message || 'Failed' });
    }
  }
  return results;
}

catalogService.bulkCreateProducts = function(rows) {
  return runBulk(rows, (row) => catalogService.createProduct(row, { submittedBy: 'Bulk import' }), (row) => row.name);
};

catalogService.bulkUpdateProducts = function(updates) {
  // updates: [{ id, patch }]
  return runBulk(updates, (u) => catalogService.updateProduct(u.id, u.patch), (u) => `#${u.id}`);
};

catalogService.bulkDeleteProducts = function(ids) {
  return runBulk(ids, (id) => catalogService.deleteProduct(id), (id) => `#${id}`);
};

// ─── Machines & Services (storefront reads) ────────────────────────────────
catalogService.getMachines = async function() {
  if (DEMO_MODE) {
    return [
      { id: 1, name: 'CNC Milling Machine', model: 'CM-3000', status: 'Active', location: 'Unit A' },
      { id: 2, name: 'Hydraulic Press', model: 'HP-500', status: 'Active', location: 'Unit B' },
      { id: 3, name: 'Laser Cutter', model: 'LC-200', status: 'Maintenance', location: 'Unit A' },
    ];
  }
  try {
    const { data } = await api.get('/machines');
    return Array.isArray(data) ? data : data?.content || [];
  } catch (err) {
    if (useMock(err)) return [];
  }
  return [];
};

catalogService.getPublicServices = async function() {
  if (DEMO_MODE) {
    return [
      { id: 1, name: 'Express Delivery', description: 'Same-day delivery within city limits', price: 99, status: 'Active' },
      { id: 2, name: 'Installation Support', description: 'Professional on-site installation', price: 499, status: 'Active' },
      { id: 3, name: 'Extended Warranty', description: '2-year extended warranty plan', price: 1299, status: 'Active' },
    ];
  }
  try {
    const { data } = await api.get('/services');
    return Array.isArray(data) ? data : data?.content || [];
  } catch (err) {
    if (useMock(err)) return [];
  }
  return [];
};
