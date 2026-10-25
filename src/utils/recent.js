// Lightweight localStorage helpers for "recently viewed" products and recent searches.

const VIEW_KEY = 'shopmart-recently-viewed';
const SEARCH_KEY = 'shopmart-recent-searches';
const MAX_VIEWED = 12;
const MAX_SEARCHES = 6;

const read = (key) => {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
};
const write = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
};

export const getRecentlyViewed = () => read(VIEW_KEY);

export const addRecentlyViewed = (product) => {
  if (!product?.id) return getRecentlyViewed();
  const snapshot = {
    id: product.id, slug: product.slug, name: product.name,
    price: product.price, mrp: product.mrp, images: product.images,
    rating: product.rating, reviewCount: product.reviewCount,
    brandName: product.brandName, categoryName: product.categoryName,
    stock: product.stock, variants: product.variants,
  };
  const next = [snapshot, ...getRecentlyViewed().filter((p) => p.id !== product.id)].slice(0, MAX_VIEWED);
  write(VIEW_KEY, next);
  return next;
};

export const getRecentSearches = () => read(SEARCH_KEY);

export const addRecentSearch = (term) => {
  const t = (term || '').trim();
  if (!t) return getRecentSearches();
  const next = [t, ...getRecentSearches().filter((s) => s.toLowerCase() !== t.toLowerCase())].slice(0, MAX_SEARCHES);
  write(SEARCH_KEY, next);
  return next;
};

export const clearRecentSearches = () => write(SEARCH_KEY, []);
