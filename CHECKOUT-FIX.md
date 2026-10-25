# Checkout & Payment — Fixes

## Critical
1. **Duplicate payment step removed.** The separate `/payment` page is gone. The flow
   now lives entirely in Checkout:
   `Address → Payment (Razorpay) → Review → Place Order → Razorpay popup → Success`.
   Clicking **Place Order** on the Review step opens the Razorpay popup directly.
   (`/payment` now redirects to `/checkout`.)
2. **Only Razorpay shown.** No UPI / Card / Net Banking / Wallet / COD radios on the
   payment step — those are chosen inside the Razorpay popup.
3. **COD fully removed** from UI, selection logic, and flow.
4. **Review page label fixed** → shows “Payment: **Razorpay**”.

## Order
5 & 6. **₹0.00 line items fixed.** The order payload now carries each item's
   `price`, `name`, and `image` (previously only `productId/quantity` were sent), so
   the Success page and order record show the correct per-item amount.

## Flow / verification
7. Razorpay is the single gateway — UPI/Card/Net Banking/Wallet are inside the popup.
8. No second payment selection after Review — removes the confusion.
9. **Failure flow**: on cancel / failure / popup close → error banner + **Retry
   Payment** button; the order is NOT created until payment succeeds.
10. **Verification**: `razorpayService` verifies the signature (`/payments/razorpay/verify`)
    before the order is created (simulated in demo mode).
11 & 12. On success the order is created with `paymentStatus = PAID` and
    `status = CONFIRMED`; admins can advance PENDING → CONFIRMED → PROCESSING → …
    (Persisting PAID/CONFIRMED in the DB is the backend's responsibility.)

## Note
Make sure you run **this** build (clear any old `dist/` and hard-refresh the browser).
Set `VITE_RAZORPAY_KEY_ID` + `VITE_DEMO_MODE=false` for real payments; otherwise a
simulated Razorpay flow runs so the full journey is testable.
