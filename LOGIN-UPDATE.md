# Update — Login fixes + checkout blockers

## Highest-priority blockers
1. **Admin Login fixed** — `/admin/login` now signs in Admin, Super Admin, **and
   Engineer** and routes each to the right place (`/admin`, `/superadmin`,
   `/engineer`). Demo shortcuts: email starting with `admin`, `superadmin`,
   `engineer`, else customer. Backend `ROLE_*` values are normalized.
2. **Razorpay popup** — opens from the Review step's **Place Order** button
   (`razorpayService.checkout`).
3. **Place Order flow** — single consolidated flow, no duplicate page:
   Address → Payment → Review → Place Order → Razorpay popup → Success.
4. **Order Success page** — shows real order id, line items (with prices), totals,
   ETA, Download Invoice, View Order, Track Order.
5. **Payment APIs connected** — `POST /payments/razorpay/order` → checkout →
   `POST /payments/razorpay/verify` → `POST /orders`.

## Login section
- **Admin / Super Admin / Engineer login** — all supported with correct redirects
  and role guards (`AdminRoute`, `SuperAdminRoute`, new `EngineerRoute`).
- **Forgot Password** — new `/forgot-password` page → `authService.forgotPassword`
  (`POST /auth/forgot-password`).
- **Reset Password** — new `/reset-password?token=…&email=…` page →
  `authService.resetPassword` (`POST /auth/reset-password`).
- **Remember Me** — on both the customer and admin logins. When on, tokens persist
  in `localStorage`; when off, they go to `sessionStorage` and clear when the
  browser closes. Token refresh preserves the choice.

## New
- **Engineer role** (`ROLES.ENGINEER`) + `EngineerRoute` guard + **Engineer
  Dashboard** at `/engineer` (assigned service jobs with Start / Complete actions).

## Notes
- Blockers 2–5 were implemented previously and are re-verified building here — if
  you were still seeing the old behaviour, make sure you're running THIS build
  (clear `dist/`, hard-refresh).
- Backend endpoints expected: `/auth/login`, `/auth/forgot-password`,
  `/auth/reset-password`, `/payments/razorpay/order`, `/payments/razorpay/verify`,
  `/orders`. All have graceful demo fallbacks.
- The broader list (multi-gateway PhonePe/COD/etc., refund/failure/invoice/analytics
  pages) wasn't in the 5 blockers — tell me which to tackle next and I'll continue.
