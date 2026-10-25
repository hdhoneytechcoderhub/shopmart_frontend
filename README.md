# ShopMart — Frontend

A complete, production-ready e-commerce frontend built with **React 18 + Vite + Redux Toolkit + Tailwind CSS**. It includes a full customer storefront, account dashboard, and a separate admin panel — all wired to a Spring Boot REST API, with a built-in demo mode so the UI is fully browsable even without the backend running.

## Tech stack

- **React 18.3** with React Router 6 (lazy-loaded routes)
- **Redux Toolkit 2** + React Redux 9 (auth, cart, wishlist, UI state)
- **Vite 5** build tooling with a dev proxy to the backend
- **Tailwind CSS 3.4** with a custom design system (indigo + amber)
- **axios** for API calls (JWT auth with automatic refresh on 401)
- **lucide-react** icons and **react-hot-toast** notifications

## Prerequisites

- Node.js 18+ (tested on Node 22)
- npm 9+
- (Optional) The ShopMart Spring Boot backend running on `http://localhost:8080`

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. (Optional) configure the API base URL
cp .env.example .env
#   VITE_API_BASE_URL=/api    ← default; proxied to the backend in dev

# 3. Start the dev server
npm run dev
```

The app runs at **http://localhost:5173**.

## Connecting the backend

This project is wired to the deployed backend on Railway:
**`https://shopmart-backend-production.up.railway.app`** (API context path `/api`).

**Development (`npm run dev`):** `VITE_API_BASE_URL` is left as `/api`, and the Vite dev server proxies every `/api/*` request to the Railway backend server-side (see `vite.config.js`). Because the call is made by Vite rather than the browser, there's **no CORS** to configure — it just works. To proxy to a different backend instead (e.g. a local one), set `VITE_API_TARGET`:

```bash
VITE_API_TARGET=http://localhost:8080 npm run dev
```

**Production / static build (`npm run build`):** there's no dev proxy, so the browser must call the backend directly. Point `VITE_API_BASE_URL` at the full URL (including `/api`) and ensure the backend's CORS allows your frontend origin:

```bash
VITE_API_BASE_URL=https://shopmart-backend-production.up.railway.app/api
```

If the backend is unreachable, the storefront falls back to bundled demo data, so the UI stays browsable either way.

## Demo mode (no backend required)

The storefront is designed to be explored without a running backend. When the API is unreachable (a network/connection error, **not** a real 4xx/5xx response), the catalog, dashboard, and admin screens fall back to bundled mock data. This makes the UI easy to review and demo out of the box.

**Demo login:**

- Any email + password signs you in as a customer.
- An email **starting with `admin`** (e.g. `admin@shopmart.com`) signs you in with admin access, unlocking the admin panel at `/admin`.
- OTP verification accepts any 6 digits in demo mode.

Once the real backend is connected, authentication, catalog, and account data come from the API instead.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server with hot reload |
| `npm run build` | Produce an optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

## Project structure

```
src/
├── components/      Reusable UI (common, product, cart, layout, admin)
├── hooks/           useAuth, useCart, useDebounce, useFetch
├── layouts/         MainLayout, AuthLayout, DashboardLayout, AdminLayout
├── pages/           Storefront, auth, dashboard/, and admin/ pages
├── redux/           store + auth/cart/wishlist/ui slices
├── routes/          ProtectedRoute, AdminRoute guards
├── services/        api (axios), catalog/auth/account services, mock data
├── utils/           constants, formatters, validators
├── App.jsx          Route tree
├── main.jsx         App entry (Provider + Router + Toaster)
└── index.css        Tailwind layers + component classes
```

## Routes overview

**Storefront:** `/`, `/shop`, `/product/:slug`, `/cart`, `/checkout`, `/order-success`, `/blog`, `/about`, `/contact`, `/faq`, `/privacy`, `/terms`

**Auth:** `/login`, `/register`, `/verify-otp`

**Customer dashboard** (protected): `/dashboard`, `/dashboard/orders`, `/dashboard/orders/:id`, `/dashboard/profile`, `/dashboard/wishlist`, `/dashboard/addresses`, `/dashboard/payments`, `/dashboard/settings`

**Admin** (admin-only): `/admin/login`, `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id/edit`, `/admin/categories`, `/admin/brands`, `/admin/orders`, `/admin/customers`, `/admin/coupons`, `/admin/blogs`, `/admin/reports`, `/admin/settings`

## Feature highlights

- **Super Admin panel** (`/superadmin`): role-based menu, dashboard with KPI cards (Total Admins, Pending Approvals, Orders, Revenue, Active Users) and recharts analytics, **admin management** (add/edit/delete/activate), **product approvals** (pending/approved/rejected with approve/reject/view), **activity logs**, **system settings**, and reports. Demo login: email starting with `superadmin`.
- **Admin panel** (`/admin`): dashboard (Products, Orders, Customers, Working Hours, Revenue) with recharts (sales, orders, revenue, top products, status pie), products/categories/brands/orders/customers/coupons/blogs, **attendance** (login/logout, total + monthly hours), reports, settings.

- **Storefront:** advanced product filters, live search suggestions (with recent/trending), best-seller ranking, product image zoom + lightbox, related products, frequently-bought-together bundles, recently-viewed history.
- **Reviews & ratings:** rating summary, distribution bars, star filters, verified badges, helpful votes, write-a-review.
- **Cart & checkout:** coupon apply UI (with a coupon catalog), multi-step checkout, Razorpay-style payment gateway with order summary and trust badges.
- **Orders:** order-tracking timeline (+ public `/track`), PDF **invoice download** (jsPDF, lazy-loaded on demand).
- **Notifications:** header bell with unread badge + dropdown, full notifications page with tabs and preferences.
- **Wishlist:** save items and **share** via link / Web Share API; public shared-wishlist view at `/wishlist/shared`.
- **Admin:** dashboard with revenue area chart, donut/status breakdowns, and sales analytics + CSV export.
- **Dark mode:** persisted light/dark theme toggle (`class` strategy) covering the whole app.
- **PWA:** installable web app manifest, offline service worker, and app icons (auto-registered in production builds).

## Notes

- Prices are formatted in **INR** via `Intl.NumberFormat`.
- **Product approval workflow:** admin-created products start as `PENDING` and only appear on the storefront after a **Super Admin approves** them. Rejected and deleted products are hidden/removed immediately. In demo mode this is backed by a shared `localStorage` store (`src/services/demoStore.js`) that the storefront, Admin, and Super Admin panels all read from; with a live backend, the same flow runs through the `/products` + `/admin/products/*` endpoints.
- All Phase 1 surfaces (catalog, auth, profile, cart, wishlist, orders, checkout) are wired through the service layer with a dual **real-API + demo-fallback** pattern, so the app runs standalone in demo mode and against the backend when `VITE_DEMO_MODE=false`.
- **Phase 2 (Enterprise)** is connected the same way: reports & analytics (`analyticsService`), notifications (`notificationService`), coupons (`couponService`), loyalty/rewards (`loyaltyService` → `/dashboard/loyalty`), and returns/RMA (`returnsService` → `/dashboard/returns` for customers, `/admin/returns` for admins). Admin dashboard statistics and customer analytics are served from `analyticsService`. See `PHASE2.md` for the full per-item mapping.
- **Going live:** `npm run dev` stays in standalone demo mode (`.env`), while `npm run build` uses `.env.production` (`VITE_DEMO_MODE=false` + the Railway API URL) to talk to the live Spring Boot backend.
- The design system lives in `src/index.css` and `tailwind.config.js` — adjust the `brand` / `accent` palettes there to re-theme the whole app.
