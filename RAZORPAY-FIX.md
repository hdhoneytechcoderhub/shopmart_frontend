# Razorpay Fix — endpoints, order-first flow, payload, logs

## 1. Endpoints updated (`razorpayService.js`)
- `POST /payments/razorpay/order` → **`POST /payments/create-order`**
- `POST /payments/razorpay/verify` → **`POST /payments/verify`**

## 2. Create order before payment (`Checkout.jsx`)
New sequence on **Place Order**:
```
Review → Create Order API (POST /orders) → get orderId
       → Create Payment Order API (POST /payments/create-order { orderId })
       → Open Razorpay → POST /payments/verify → Success
```
The order is created first (status `PAYMENT_INITIATED`, payment `PENDING`); after a
verified payment it becomes `CONFIRMED` / `PAID`. On failure the order stays PENDING
and **Retry** reuses the same order (no duplicate orders).

## 3. Correct payload
`create-order` now sends only `{ orderId }` — the amount-based body is removed.
(The rupee amount is still passed locally just to render the demo popup.)

## 4. Debug logs (before opening Razorpay)
```
console.log("Order Created", orderId);
console.log("Payment Request", payload);      // { orderId, amount }
console.log("Opening Razorpay");
```

## 5. SDK load check
```
await loadRazorpay();
if (!window.Razorpay) throw new Error("Razorpay SDK not loaded");
```

## Notes
- Live mode requires `VITE_DEMO_MODE=false` **and** `VITE_RAZORPAY_KEY_ID` set.
  Otherwise a simulated checkout runs so the flow is testable offline.
- Backend contract expected:
  - `POST /orders` → returns the created order with an `id`.
  - `POST /payments/create-order` body `{ orderId }` → returns
    `{ razorpayOrderId, amount, currency, keyId }` (a few field-name variants are
    tolerated: `orderId`/`id`, `key`/`keyId`).
  - `POST /payments/verify` body `{ razorpay_order_id, razorpay_payment_id,
    razorpay_signature, orderId }` → marks the order PAID/CONFIRMED.
