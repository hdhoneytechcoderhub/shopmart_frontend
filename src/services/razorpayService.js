import api, { DEMO_MODE } from './api';
import { RAZORPAY_KEY_ID } from '../utils/constants';

// Razorpay integration.
// Flow (matches backend):
//   Order is already created (POST /orders) → we pass its orderId here →
//   POST /payments/create-order { orderId } → returns Razorpay order id + amount →
//   open Razorpay checkout → POST /payments/verify.
//
// In demo mode / when no key is set, a realistic simulated flow runs so the
// journey works standalone.

let scriptPromise = null;

export const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const s = document.createElement('script');
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return scriptPromise;
};

export const razorpayLive = () => !DEMO_MODE && !!RAZORPAY_KEY_ID;

export const razorpayService = {
  // Create the Razorpay payment order from an existing backend order id.
  // Backend: POST /payments/create-order  body: { orderId }
  async createOrder({ orderId, amount }) {
    if (!razorpayLive()) {
      return {
        razorpayOrderId: `order_demo_${Date.now()}`,
        amount: Math.round((amount || 0) * 100),
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID || 'rzp_test_demo',
      };
    }
    const { data } = await api.post('/payments/create-order', { orderId });
    return {
      razorpayOrderId: data.razorpayOrderId || data.orderId || data.id,
      amount: data.amount ?? Math.round((amount || 0) * 100),
      currency: data.currency || 'INR',
      keyId: data.keyId || data.key || RAZORPAY_KEY_ID,
    };
  },

  // Verify the payment signature server-side.
  // Backend: POST /payments/verify
  async verify(payload) {
    if (!razorpayLive()) return { verified: true };
    const { data } = await api.post('/payments/verify', payload);
    return data ?? { verified: true };
  },

  // Open checkout for an existing order. Resolves with the payment result.
  async checkout({ orderId, amount, currency = 'INR', name = 'ShopMart', description = 'Order payment', prefill = {}, notes = {} }) {
    // 2 + 3. Create the payment order from the backend order id.
    const payOrder = await this.createOrder({ orderId, amount });
    console.log('Order Created', orderId);
    console.log('Payment Request', { orderId, razorpayOrderId: payOrder.razorpayOrderId, amount: payOrder.amount, currency: payOrder.currency });

    // Demo / no real key: simulate success (still verifies through the stub).
    if (!razorpayLive()) {
      console.log('Opening Razorpay (simulated)');
      await new Promise((r) => setTimeout(r, 600));
      const paymentId = `pay_demo_${Date.now().toString().slice(-10)}`;
      await this.verify({ razorpay_order_id: payOrder.razorpayOrderId, razorpay_payment_id: paymentId, razorpay_signature: 'demo', orderId });
      return { paymentId, orderId, razorpayOrderId: payOrder.razorpayOrderId, signature: 'demo', simulated: true };
    }

    // 5. Ensure the SDK is loaded before opening.
    await loadRazorpay();
    if (!window.Razorpay) throw new Error('Razorpay SDK not loaded');

    console.log('Opening Razorpay');
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: payOrder.keyId,
        amount: payOrder.amount,
        currency: payOrder.currency,
        name,
        description,
        order_id: payOrder.razorpayOrderId,
        prefill,
        notes: { ...notes, orderId },
        theme: { color: '#4f46e5' },
        handler: async (resp) => {
          try {
            const result = await this.verify({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              orderId,
            });
            if (result && result.verified === false) { reject(new Error('Payment verification failed.')); return; }
            resolve({
              paymentId: resp.razorpay_payment_id,
              orderId,
              razorpayOrderId: resp.razorpay_order_id,
              signature: resp.razorpay_signature,
            });
          } catch (err) { reject(err); }
        },
        modal: { ondismiss: () => reject(Object.assign(new Error('Payment cancelled'), { cancelled: true })) },
      });
      rzp.on('payment.failed', (resp) => reject(new Error(resp?.error?.description || 'Payment failed')));
      rzp.open();
    });
  },
};

export default razorpayService;
