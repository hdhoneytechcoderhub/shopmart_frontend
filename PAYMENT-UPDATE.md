# Payment Module Update — Razorpay only

## Frontend changes
- **Checkout → Payment step**: now shows a single **Razorpay** option (no UPI / Card /
  Net Banking / COD radios). `Checkout.jsx`
- **Payment page** (`Payment.jsx`): removed the entire "Other Payment Options" block
  (UPI, Card, Net Banking, Wallets, COD). Only the Razorpay card remains.
  - Button is now **Place Order** → opens the Razorpay checkout popup, where the
    customer picks UPI / Card / Net Banking / Wallet.
  - **Failure flow**: on failure or dismissal, shows an inline error banner and the
    button becomes **Retry Payment** (the order is not created until payment succeeds).
- **COD removed everywhere**: radio, validation, flow, labels, admin settings toggle,
  and seeded demo data. `constants.js`, `AdminSettings.jsx`, `mockAccount.js`
- **Flow**: Cart → Address → Payment (Razorpay) → Review → Place Order → Razorpay
  Checkout → Payment Success → Order Confirmation.

## Success / status handling
- On a verified payment: order is created with `paymentStatus = PAID`,
  `status = CONFIRMED`, and the Razorpay order/payment ids are stored.
- Order status workflow supported in the UI:
  `PENDING → PAYMENT_INITIATED → PAID → CONFIRMED → PROCESSING → SHIPPED → DELIVERED`
  (`constants.js`, admin status dropdown, tracking timeline).

## Admin panel (`AdminOrders.jsx`)
Order table + details modal now show: Order ID, Customer, Total, Payment method
(Razorpay), **Razorpay Order ID**, **Razorpay Payment ID**, Payment status, Order status.

## Razorpay integration (`razorpayService.js`)
Place Order → `POST /payments/razorpay/order` → open checkout popup → verify
(`POST /payments/razorpay/verify`) → create order. Runs a simulated checkout when
`VITE_DEMO_MODE=true` or no key is set; set `VITE_RAZORPAY_KEY_ID` + `VITE_DEMO_MODE=false`
to go live.

## Backend (for your side — not in this frontend)
Remove COD from payment methods / status / business logic. Ensure the orders table
keeps: `razorpay_order_id`, `razorpay_payment_id`, `payment_status`, `order_status`.
On verify: mark PAID, confirm order, reduce stock, generate invoice.
