# Phase 1 (Critical) — API Integration ✅ Complete

Every Phase 1 surface is now wired through the service layer using a dual
**real-API + demo-fallback** pattern. With `VITE_DEMO_MODE=true` (default) the app
runs fully standalone on a shared local store; with `VITE_DEMO_MODE=false` the same
calls hit the Spring Boot backend.

## Catalog / Storefront

| Item | Status | Where |
| --- | --- | --- |
| Home API Connect | ✅ | `catalogService.getHomeFeeds/getBanners/getCategories` → `Home.jsx` |
| Product API Connect | ✅ | `catalogService.getProducts` (approved-only) → `Shop.jsx`, `ProductGrid` |
| Category API Connect | ✅ | `catalogService.getCategories` → `Home.jsx`, `Shop.jsx`, product form |
| Search API Connect | ✅ | `catalogService.suggest/getProducts({ q })` → header search, `Shop.jsx` |
| Product Details API Connect | ✅ | `catalogService.getProductBySlug/getRelated/getReviews` → `ProductDetails.jsx` |

## Customer

| Item | Status | Where |
| --- | --- | --- |
| Login API Connect | ✅ | `authService.login` → `loginUser` thunk → `Login.jsx` |
| Register API Connect | ✅ | `authService.register` + `verifyOtp/resendOtp` → `Register.jsx`, `OtpVerification.jsx` |
| Profile API Connect | ✅ | `accountService.getProfile/updateProfile` → `dashboard/Profile.jsx` |

## Commerce

| Item | Status | Where |
| --- | --- | --- |
| Cart API Connect | ✅ | `accountService` cart endpoints synced via `useCart` + `useCommerceSync` |
| Wishlist API Connect | ✅ | `accountService` wishlist endpoints via `useWishlist` + `useCommerceSync` |
| Order API Connect | ✅ | `accountService.getOrders/getOrder/placeOrder` → `Orders.jsx`, `OrderDetail.jsx`, `Payment.jsx` |
| Checkout API Connect | ✅ | `Checkout.jsx` → `Payment.jsx` → `accountService.placeOrder` |

---

## Approval & deletion fixes (this update)

1. **Products require Super Admin approval before going live.**
   New admin products are created with status `PENDING` and do **not** appear on the
   storefront. They show on `/superadmin/approvals`; approving flips them to
   `APPROVED` and they appear on the site instantly.

2. **Deleted products are removed from the storefront immediately.**
   Deleting from either the Admin panel (`/admin/products`) or the Super Admin
   approvals page removes the product from the shared store, so it disappears from
   the storefront right away — and stays gone after a refresh.

### How it works
- `src/services/demoStore.js` is the single source of truth for products in demo
  mode (persisted to `localStorage`, broadcasts change events across tabs).
- `catalogService` storefront reads return **approved-only** products; admin /
  super-admin methods handle all statuses plus approve / reject / delete.
- `useProductsVersion()` lets storefront views (`Home`, `Shop`, `ProductDetails`)
  refresh the moment an approval or deletion happens.
- For a live backend, storefront reads pass `status=APPROVED`, and approvals run
  through `PUT /admin/products/:id/approve|reject` and `DELETE /products/:id`.
