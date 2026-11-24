import api from './api';
import { RAZORPAY_KEY_ID } from '../utils/constants';

// Real Razorpay integration.
//
//   1. POST /orders (done by Checkout) creates a PENDING order from the server cart.
//   2. POST /payments/create-order { orderId } → backend creates the Razorpay order
//      with the backend-calculated amount and returns order id + key id.
//   3. Open the official Razorpay Checkout with that order id.
//   4. POST /payments/verify → backend verifies the signature AND re-reads the payment
//      from Razorpay before marking the ShopMart order PAID.
//
// There is deliberately NO simulated-success fallback: if the backend or Razorpay is
// unavailable, checkout fails instead of confirming an unpaid order.

let scriptPromise = null;
let inFlight = null; // { orderId, promise } — absorbs repeated clicks on the same order

export const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
};

const toMinor = (payOrder) => {
  if (payOrder?.amountMinor != null) return Number(payOrder.amountMinor);
  return Math.round(Number(payOrder?.amount || 0) * 100);
};

export const razorpayService = {
  async createOrder(orderId) {
    const { data } = await api.post('/payments/create-order', { orderId });
    if (!data?.razorpayOrderId) {
      throw new Error(data?.message || 'The server did not return a Razorpay order.');
    }
    return data;
  },

  async verify(orderId, response) {
    const { data } = await api.post('/payments/verify', {
      orderId,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
    });
    // The backend only returns after signature + Razorpay status verification.
    if (!data || (data.status !== 'SUCCESS' && data.status !== 'PAID')) {
      throw new Error('Payment could not be verified by the server.');
    }
    return data;
  },

  async syncStatus(orderId) {
    const { data } = await api.post(`/payments/order/${orderId}/sync`);
    return data;
  },

  async markFailed(orderId, reason) {
    try {
      await api.post(`/payments/${orderId}/fail`, null, { params: { reason } });
    } catch {
      // Best-effort: if this fails the order simply stays PENDING and can be retried.
    }
  },

  async checkout({ orderId, name = 'ShopMart', description = 'Order payment', prefill = {}, notes = {} }) {
    if (inFlight && inFlight.orderId === orderId) return inFlight.promise;
    const promise = this.openCheckout({ orderId, name, description, prefill, notes });
    inFlight = { orderId, promise };
    try {
      return await promise;
    } finally {
      if (inFlight && inFlight.promise === promise) inFlight = null;
    }
  },

  async openCheckout({ orderId, name, description, prefill, notes }) {
    // Backend creates the Razorpay order using the trusted order total.
    const payOrder = await this.createOrder(orderId);
    if (String(payOrder.provider || 'razorpay').toLowerCase() !== 'razorpay') {
      throw new Error('The configured payment gateway is not Razorpay.');
    }
    const key = payOrder.keyId || RAZORPAY_KEY_ID;
    if (!key) {
      throw new Error('Razorpay is not configured on the server (missing key id).');
    }
    const amount = toMinor(payOrder);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('The server returned an invalid payable amount.');
    }

    const loaded = await loadRazorpay();
    if (!loaded || !window.Razorpay) {
      throw new Error('Could not load the Razorpay checkout. Check your connection and try again.');
    }

    return new Promise((resolve, reject) => {
      let settled = false;
      let lastFailure = null;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };

      let rzp;
      try {
        rzp = new window.Razorpay({
          key,
          amount,
          currency: payOrder.currency || 'INR',
          name,
          description,
          order_id: payOrder.razorpayOrderId,
          prefill,
          notes: { ...notes, shopmartOrderId: String(orderId) },
          theme: { color: '#4f46e5' },
          handler: async (response) => {
            try {
              const payment = await razorpayService.verify(orderId, response);
              finish(resolve, {
                paymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                payment,
              });
            } catch (err) {
              finish(reject, err);
            }
          },
          modal: {
            ondismiss: async () => {
              if (settled) return;
              // Razorpay lets the customer retry after payment.failed inside the same
              // window; only a dismiss ends this attempt.
              const reason = lastFailure ? 'PAYMENT_FAILED' : 'PAYMENT_CANCELLED';
              await razorpayService.markFailed(orderId, reason);
              const err = Object.assign(
                new Error(lastFailure?.description || 'Payment was cancelled before completion.'),
                { cancelled: !lastFailure, failed: !!lastFailure, paymentFailed: !!lastFailure },
              );
              finish(reject, err);
            },
          },
        });
      } catch {
        finish(reject, new Error('Could not open the Razorpay checkout window.'));
        return;
      }

      rzp.on('payment.failed', (response) => {
        lastFailure = response?.error || { description: 'Payment failed' };
        // Keep the popup open so the customer can retry; the outcome is decided by
        // handler (success) or modal.ondismiss (failure/cancel).
      });

      rzp.open();
    });
  },
};

export default razorpayService;
