# Phase 2 (Enterprise) — API Integration ✅ Complete

All Phase 2 surfaces are wired through the service layer with the same dual
**real-API + demo-fallback** pattern as Phase 1. Read-only dashboards fall back to
demo data on any error so panels always render, even before a given backend
endpoint exists.

## Enterprise

| Item | Status | Service · endpoint | UI |
| --- | --- | --- | --- |
| Reports API Connect | ✅ | `analyticsService.getAdminReport` · `GET /admin/reports`; `getSuperReport` · `GET /admin/super/reports` | `AdminReports`, `SuperAdminReports` |
| Analytics API Connect | ✅ | `analyticsService.getAnalytics` · `GET /admin/analytics` | Admin + Super Admin dashboards |
| Notifications API Connect | ✅ | `notificationService.list/markRead/markAllRead` · `/notifications*` | bell + `dashboard/Notifications` |
| Coupon API Connect | ✅ | `couponService.list/validate/create/update/remove` · `/admin/coupons`, `/coupons/validate` | `AdminCoupons`, `Cart` |
| Loyalty API Connect | ✅ | `loyaltyService.getSummary/getTiers/redeem` · `/loyalty/*` | new `dashboard/Loyalty` |
| Returns API Connect | ✅ | `returnsService.listMine/listAll/create/updateStatus` · `/returns*`, `/admin/returns*` | new `dashboard/Returns`, `admin/Returns` |

## Admin

| Item | Status | Service · endpoint | UI |
| --- | --- | --- | --- |
| Product Approval API Connect | ✅ | `catalogService.getApprovals/approveProduct/rejectProduct` · `/admin/products/*` | `superadmin/ProductApprovals` |
| Dashboard Statistics API Connect | ✅ | `analyticsService.getAdminStats` · `GET /admin/stats`; `getSuperStats` · `GET /admin/super/stats` | Admin + Super Admin dashboards |
| Customer Analytics API Connect | ✅ | `analyticsService.getCustomers/getCustomerAnalytics` · `/admin/customers*` | `AdminCustomers` |

## Going live (real backend)

The project ships with two env files:

- **`.env`** — `VITE_DEMO_MODE=true` (default). `npm run dev` runs fully standalone on local data.
- **`.env.production`** — `VITE_DEMO_MODE=false` + the Railway API base URL. `npm run build` produces a build that talks to the live Spring Boot backend.

Phase 2 go-live checklist:

1. ✅ `VITE_DEMO_MODE=false` — set in `.env.production`.
2. ✅ `VITE_API_BASE_URL` — points at the Spring Boot URL (`…/api`).
3. ✅ Product APIs — `catalogService` (`/products`, `/products/slug/:slug`, `/products/:id/related`).
4. ✅ Category APIs — `catalogService.getCategories` (`/categories`), brands/banners alongside.
5. ✅ Home APIs — `catalogService.getHomeFeeds` (`/products?featured|bestSeller|newArrival`).
6. ✅ Login / Register — `authService.login/register/verifyOtp` (`/auth/*`).

To preview the **standalone demo** as a production build instead, set
`VITE_DEMO_MODE=true` for the build (e.g. `VITE_DEMO_MODE=true npm run build`).

### New routes added in Phase 2
- `/dashboard/loyalty` — points, tier progress, history (customer)
- `/dashboard/returns` — request + track returns (customer)
- `/admin/returns` — returns queue with status updates (admin)
