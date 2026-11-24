import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  MapPin, CreditCard, Check, Plus, Star, Pencil, Smartphone,
  ShieldCheck, Loader2, CheckCircle2, XCircle, Lock, ArrowRight, Tag, X, BadgePercent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { useAuth } from '../hooks/useAuth';
import { setCoupon as setCouponAction, clearCoupon, selectCoupon } from '../redux/slices/cartSlice';
import { couponService } from '../services/couponService';
import { COUPONS } from '../utils/coupons';
import { accountService } from '../services/accountService';
import { cartService } from '../services/cartService';
import { razorpayService } from '../services/razorpayService';
import { DEMO_MODE } from '../services/api';
import { addNotification } from '../redux/slices/notificationSlice';
import { mockAddresses } from '../services/mockAccount';
import { isEmail, isPhone, required } from '../utils/validators';
import { formatPrice } from '../utils/format';
import Modal from '../components/common/Modal';

const STEPS = ['Address', 'Payment', 'Review'];
const EMPTY = {
  label: 'Home', name: '', phone: '', email: '', line1: '', line2: '',
  city: '', state: '', pincode: '', country: 'India', isDefault: false,
};
const PENDING_KEY = 'sm_pending_order_v1';
const IDEMPOTENCY_KEY = 'sm_checkout_idempotency_v1';

const readPending = () => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};
const writePending = (value) => {
  try {
    if (value) sessionStorage.setItem(PENDING_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(PENDING_KEY);
  } catch { /* ignore */ }
};
const newIdempotencyKey = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `sm-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const readIdempotencyKey = () => {
  try { return sessionStorage.getItem(IDEMPOTENCY_KEY); } catch { return null; }
};
const ensureIdempotencyKey = () => {
  let key = readIdempotencyKey();
  if (!key) {
    key = newIdempotencyKey();
    try { sessionStorage.setItem(IDEMPOTENCY_KEY, key); } catch { /* ignore */ }
  }
  return key;
};
const clearIdempotencyKey = () => {
  try { sessionStorage.removeItem(IDEMPOTENCY_KEY); } catch { /* ignore */ }
};

export default function Checkout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const retryOrderId = searchParams.get('order');
  const dispatch = useDispatch();
  const { items, subtotal, clear } = useCart();
  const { user } = useAuth();
  const coupon = useSelector(selectCoupon);

  const [step, setStep] = useState(0);

  // Saved addresses
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Payment (Razorpay)
  const [phase, setPhase] = useState('idle'); // idle | processing | done | failed
  const [statusText, setStatusText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [pendingOrder, setPendingOrder] = useState(null);
  const [restoring, setRestoring] = useState(() => !!readPending() || !!searchParams.get('order'));
  const createdOrderRef = useRef(null); // reuse the same order on retry
  const placingRef = useRef(false);     // absorbs repeated clicks

  // Shipping rules mirror OrderServiceImpl (free over ₹499, otherwise ₹49) so the
  // amount shown here matches the server-calculated Razorpay amount.
  const isFreeShip = coupon?.code === 'FREESHIP';
  const baseShipping = subtotal >= 499 || subtotal === 0 ? 0 : 49;
  const shipping = isFreeShip ? 0 : baseShipping;
  const discount = isFreeShip ? 0 : (coupon?.discount || 0);
  const cartTotal = Math.max(0, subtotal + shipping - discount);
  const payable = pendingOrder?.total != null ? Number(pendingOrder.total) : cartTotal;

  const selectedAddress = addresses.find((a) => a.id === selectedId) || null;
  const pendingAddress = pendingOrder?.address
    ? { ...pendingOrder.address, pincode: pendingOrder.address.postalCode || pendingOrder.address.pincode }
    : null;
  const activeAddress = selectedAddress || pendingAddress;

  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);

  const finishSuccess = (order) => {
    writePending(null);
    clearIdempotencyKey();
    setPendingOrder(null);
    createdOrderRef.current = null;
    clear();
    dispatch(addNotification({
      category: 'ORDER', icon: 'box', title: 'Payment successful',
      body: `Your order ${order.orderNumber || order.id} has been confirmed. We'll notify you when it ships.`,
      link: `/dashboard/orders/${order.id}`,
    }));
    navigate(`/order-success/${order.id}`, { replace: true, state: { order } });
  };

  useEffect(() => {
    let active = true;
    accountService.getAddresses()
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        setSelectedId((list.find((a) => a.isDefault) || list[0])?.id ?? null);
      })
      .catch((err) => {
        if (!active || err?.response) return;
        setAddresses(mockAddresses);
        setSelectedId((mockAddresses.find((a) => a.isDefault) || mockAddresses[0])?.id ?? null);
      });
    return () => { active = false; };
  }, []);

  // Restore a pending order after a refresh: the customer keeps the same order
  // (and Razorpay order) instead of creating a duplicate.
  useEffect(() => {
    let active = true;
    const restore = async () => {
      const saved = readPending();
      const candidateId = retryOrderId || saved?.id;
      if (!candidateId) { setRestoring(false); return; }
      const explicitRetry = String(candidateId) === String(retryOrderId);
      try {
        const order = await accountService.getOrder(candidateId);
        if (!active) return;
        if (order?.paymentStatus === 'PAID') {
          finishSuccess(order);
          return;
        }
        if (order?.status === 'CANCELLED') {
          writePending(null);
          clearIdempotencyKey();
          return;
        }
        // If the cart changed since this order was created, it is stale: cancel it
        // (best effort) and let the customer create a fresh order. An explicit
        // "retry payment" from My Orders always keeps the order.
        if (explicitRetry || Math.abs(Number(order.total) - Number(cartTotal)) < 0.01) {
          createdOrderRef.current = order;
          setPendingOrder(order);
          setStep(2);
          writePending({
            id: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            idempotencyKey: saved?.idempotencyKey || undefined,
          });
        } else {
          writePending(null);
          clearIdempotencyKey();
          try { await accountService.cancelOrder(order.id); } catch { /* ignore */ }
        }
      } catch {
        // Leave the pending marker for the next attempt if this was a network error;
        // the idempotency key still prevents a duplicate order.
      } finally {
        if (active) setRestoring(false);
      }
    };
    restore();
    return () => { active = false; };
  }, []);

  const applyCoupon = async (raw) => {
    const c = (raw ?? couponCode).trim();
    if (!c) return;
    setCouponValidating(true);
    try {
      const res = await couponService.validate(c, subtotal);
      if (!res.ok) { toast.error(res.reason || 'Invalid coupon'); return; }
      const appliedCode = (res.coupon?.code || c).toUpperCase();
      dispatch(setCouponAction({ code: appliedCode, discount: res.discount }));
      setCouponCode('');
      toast.success(`Coupon ${appliedCode} applied`);
    } finally {
      setCouponValidating(false);
    }
  };

  const removeCoupon = () => { dispatch(clearCoupon()); toast('Coupon removed'); };

  if (items.length === 0 && !pendingOrder && !restoring && phase === 'idle') {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Add items before checking out.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-6">Browse products</button>
      </div>
    );
  }

  // ── Address form (add / edit) ─────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
    setErrors({});
    setModalOpen(true);
  };
  const openEdit = (a) => { setEditingId(a.id); setForm({ ...EMPTY, ...a }); setErrors({}); setModalOpen(true); };
  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const validateForm = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Name is required';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid 10-digit number';
    if (!isEmail(form.email)) next.email = 'Enter a valid email address';
    if (!required(form.line1)) next.line1 = 'Address is required';
    if (!required(form.city)) next.city = 'City is required';
    if (!required(form.state)) next.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode';
    if (!required(form.country)) next.country = 'Country is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveAddress = async () => {
    if (!validateForm()) return;
    setSaving(true);
    const payload = { ...form };
    let saved;
    try {
      saved = editingId
        ? await accountService.updateAddress(editingId, payload)
        : await accountService.addAddress(payload);
    } catch (err) {
      if (err?.response) { toast.error(err.response.data?.message || 'Could not save address'); setSaving(false); return; }
      saved = null;
    }
    const record = saved || { ...payload, id: editingId || Date.now() };
    setAddresses((list) => {
      let next = editingId ? list.map((a) => (a.id === editingId ? record : a)) : [...list, record];
      if (record.isDefault) next = next.map((a) => ({ ...a, isDefault: a.id === record.id }));
      return next;
    });
    setSelectedId(record.id);
    toast.success(editingId ? 'Address updated' : 'Address added');
    setModalOpen(false);
    setSaving(false);
  };

  const toOrderAddress = (a) => ({
    name: a.name || user?.name || '',
    phone: a.phone || '',
    email: a.email || user?.email || '',
    line1: a.line1 || '',
    line2: a.line2 || '',
    city: a.city || '',
    state: a.state || '',
    postalCode: a.pincode || a.postalCode || '',
    country: a.country || 'India',
  });

  // Place order → server order (PENDING) → Razorpay order → popup → server verify.
  const placeOrder = async () => {
    if (placingRef.current) return;
    if (DEMO_MODE) {
      setErrorMsg('Checkout is disabled in demo mode. Set VITE_DEMO_MODE=false and run the ShopMart backend.');
      setPhase('failed');
      return;
    }
    if (!activeAddress) { toast.error('Please select a delivery address'); setStep(0); return; }
    if (!isEmail(activeAddress.email || user?.email)) {
      toast.error('Please add an email address to the delivery address');
      setStep(0);
      return;
    }

    placingRef.current = true;
    setPhase('processing');
    setErrorMsg('');

    try {
      // 1. Create (or reuse) the pending ShopMart order. The backend calculates the
      //    amount from the server-side cart; client-supplied amounts are ignored.
      let order = createdOrderRef.current;
      if (!order) {
        setStatusText('Syncing your cart...');
        const { skipped } = await cartService.syncToBackend(items);
        if (skipped.length) {
          throw new Error(`${skipped.length} item(s) with a selected size/color can't be checked out yet — variant selection isn't wired to the backend cart. Remove them or check out without variants.`);
        }
        setStatusText('Creating your order...');
        const saved = readPending();
        // Persisted before the request so a lost response can be retried safely.
        const idempotencyKey = saved?.idempotencyKey || ensureIdempotencyKey();
        const payload = {
          shippingAddress: toOrderAddress(activeAddress),
          paymentMethod: 'RAZORPAY',
          couponCode: coupon?.code || undefined,
        };
        order = await accountService.placeOrder(payload, idempotencyKey);
        createdOrderRef.current = order;
        setPendingOrder(order);
        writePending({
          id: order.id, orderNumber: order.orderNumber,
          total: order.total, idempotencyKey,
        });
        console.log('ShopMart order created', order.orderNumber);
      }

      const orderId = order.id;
      if (!orderId) throw new Error('The server did not return an order id.');

      // 2. If an earlier attempt might have succeeded, reconcile with Razorpay before
      //    opening a second payment.
      setStatusText('Checking your payment status...');
      try {
        const synced = await accountService.syncPaymentStatus(orderId);
        if (synced?.paymentStatus === 'PAID') {
          setStatusText('Payment confirmed');
          setPhase('done');
          const paid = await accountService.finalizePaidOrder(orderId);
          finishSuccess(paid);
          return;
        }
      } catch (syncErr) {
        // A definitive 4xx/5xx blocks the retry; a transient network error is retried
        // by the backend's own initiate sync.
        if (syncErr?.response) throw syncErr;
      }

      // 3. Backend creates the Razorpay order; the popup must open here.
      setStatusText('Opening secure Razorpay checkout...');
      await razorpayService.checkout({
        orderId,
        name: 'ShopMart',
        description: `Payment for order ${order.orderNumber || orderId}`,
        prefill: {
          name: activeAddress?.name || user?.name || '',
          email: activeAddress?.email || user?.email || '',
          contact: activeAddress?.phone || user?.phone || '',
        },
        notes: { receipt: `rcpt_${orderId}` },
      });

      // 4. Razorpay verified server-side. Re-read the order and require PAID.
      setStatusText('Confirming your payment...');
      const paidOrder = await accountService.finalizePaidOrder(orderId);
      setPhase('done');
      setStatusText('Payment confirmed');
      finishSuccess(paidOrder);
    } catch (err) {
      // The pending order is intentionally kept: retry reuses it and its Razorpay order.
      setPhase('failed');
      setErrorMsg(
        err?.cancelled
          ? 'Payment was cancelled before completion. Your cart and address are still saved.'
          : (err?.response?.data?.message || err?.message || 'Payment could not be completed. Please try again.'),
      );
    } finally {
      placingRef.current = false;
    }
  };

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {/* Steps */}
      <div className="mt-5 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${i <= step ? 'bg-brand-600 text-white' : 'bg-slate-100 text-ink-muted'}`}>
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-xs">
                {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              {label}
            </div>
            {i < STEPS.length - 1 && <div className={`h-0.5 w-6 ${i < step ? 'bg-brand-600' : 'bg-slate-200'}`} />}
          </div>
        ))}
      </div>

      {pendingOrder && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            Pending payment for order <span className="font-semibold">#{pendingOrder.orderNumber || pendingOrder.id}</span>.
            Your cart is still saved.
          </span>
          <button
            onClick={async () => {
              try {
                const synced = await accountService.syncPaymentStatus(pendingOrder.id);
                if (synced?.paymentStatus === 'PAID') {
                  const paid = await accountService.finalizePaidOrder(pendingOrder.id);
                  finishSuccess(paid);
                } else {
                  toast.success('No completed payment found. You can retry.');
                }
              } catch (e) {
                toast.error(e?.response?.data?.message || 'Could not refresh the payment status.');
              }
            }}
            className="text-xs font-semibold underline"
          >
            Refresh status
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="card p-6">
          {step === 0 && (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-lg font-semibold"><MapPin className="h-5 w-5 text-brand-600" /> Select delivery address</h2>
                <button onClick={openAdd} className="btn-outline h-9 text-sm"><Plus className="h-4 w-4" /> Add new</button>
              </div>

              {addresses.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-sm text-ink-muted">No saved addresses yet.</p>
                  <button onClick={openAdd} className="btn-primary mt-4"><Plus className="h-4 w-4" /> Add address</button>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <label key={a.id}
                      className={`relative cursor-pointer rounded-xl border p-4 transition ${selectedId === a.id ? 'border-brand-600 bg-brand-50/40 ring-1 ring-brand-200' : 'border-slate-200 hover:border-slate-300'}`}>
                      <div className="flex items-start gap-3">
                        <input type="radio" name="address" checked={selectedId === a.id} onChange={() => setSelectedId(a.id)} className="mt-1 accent-brand-600" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="chip">{a.label}</span>
                            {a.isDefault && <span className="inline-flex items-center gap-1 text-xs font-medium text-brand-700"><Star className="h-3 w-3 fill-brand-600 text-brand-600" /> Default</span>}
                          </div>
                          <p className="mt-2 text-sm font-semibold text-ink">{a.name}</p>
                          <p className="text-xs text-ink-muted">{[a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ')}</p>
                          <p className="text-xs text-ink-muted">Phone: {a.phone}</p>
                          {a.email && <p className="text-xs text-ink-muted">Email: {a.email}</p>}
                          <button type="button" onClick={(e) => { e.preventDefault(); openEdit(a); }} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"><Pencil className="h-3 w-3" /> Edit</button>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              <button disabled={!selectedAddress} onClick={() => setStep(1)} className="btn-primary mt-6">Continue to payment</button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold"><CreditCard className="h-5 w-5 text-brand-600" /> Payment method</h2>
              <p className="mb-4 text-sm text-ink-muted">Secure payments powered by Razorpay.</p>
              <div className="rounded-xl border border-brand-600 bg-brand-50/40 p-4 ring-1 ring-brand-200">
                <div className="flex items-center gap-3">
                  <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-brand-600">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                  </span>
                  <Smartphone className="h-5 w-5 text-ink-soft" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink">Razorpay</p>
                    <p className="text-xs text-ink-muted">Pay using Cards, UPI, Net Banking, Wallets &amp; more</p>
                  </div>
                  <span className="hidden items-center gap-1 sm:flex">
                    {['VISA', 'MC', 'UPI', '+5'].map((t) => (
                      <span key={t} className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-ink-soft">{t}</span>
                    ))}
                  </span>
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-muted">
                <Lock className="h-3.5 w-3.5" /> Choose UPI, Card, Net Banking or Wallets inside the Razorpay window
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setStep(0)} className="btn-outline">Back</button>
                <button onClick={() => setStep(2)} className="btn-primary">Review order</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              {phase === 'processing' || phase === 'done' ? (
                <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                  {phase === 'done'
                    ? <CheckCircle2 className="h-14 w-14 text-emerald-500 animate-pop" />
                    : <Loader2 className="h-14 w-14 animate-spin text-brand-600" />}
                  <p className="text-lg font-semibold text-ink">{statusText}</p>
                  <p className="text-sm text-ink-muted">Please don't close or refresh this page.</p>
                </div>
              ) : (
                <>
                  <h2 className="mb-4 text-lg font-semibold">Review &amp; pay</h2>

                  {phase === 'failed' && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700">Payment not completed</p>
                        <p className="text-xs text-red-600/90">{errorMsg}</p>
                        <Link
                          to={`/payment-failed/${createdOrderRef.current?.id || ''}?reason=${encodeURIComponent(errorMsg)}${errorMsg.toLowerCase().includes('cancel') ? '&status=cancelled' : ''}`}
                          className="mt-1 inline-block text-xs font-medium text-red-700 underline"
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 p-4 text-sm">
                    <p className="font-semibold">{activeAddress?.name} · {activeAddress?.phone}</p>
                    <p className="text-ink-soft">{[activeAddress?.line1, activeAddress?.line2, activeAddress?.city, activeAddress?.state, activeAddress?.pincode].filter(Boolean).join(', ')}</p>
                    <p className="text-ink-soft">{activeAddress?.email || user?.email}</p>
                    <p className="mt-2 text-ink-muted">Payment: <span className="font-medium text-ink">Razorpay</span></p>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {items.map((i, idx) => (
                      <div key={idx} className="flex items-center gap-3 py-3">
                        <img src={i.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{i.name}</p>
                          <p className="text-ink-muted">Qty {i.quantity}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatPrice(i.price * i.quantity)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button onClick={() => setStep(1)} className="btn-outline">Back</button>
                    <button onClick={placeOrder} disabled={phase === 'processing'} className="btn-accent flex-1">
                      {phase === 'failed' ? 'Retry Payment' : 'Pay Now'} · {formatPrice(payable)} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-2 text-center text-xs text-ink-muted">You'll choose UPI / Card / Net Banking / Wallet in the Razorpay window</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Summary</h2>

            {/* Coupon */}
            {coupon ? (
              <div className="mt-4 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700">
                  <Check className="h-4 w-4" /> {coupon.code} applied
                </span>
                <button onClick={removeCoupon} className="text-emerald-700 hover:text-emerald-900" aria-label="Remove coupon"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <>
                <div className="mt-4 flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && applyCoupon()}
                      placeholder="Coupon code"
                      className="field pl-9 uppercase"
                    />
                  </div>
                  <button onClick={() => applyCoupon()} disabled={couponValidating} className="btn-outline">
                    {couponValidating ? 'Checking…' : 'Apply'}
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COUPONS.slice(0, 3).map((c) => (
                    <button key={c.code} onClick={() => applyCoupon(c.code)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-ink-soft hover:border-brand-400 hover:text-brand-700">
                      <BadgePercent className="h-3 w-3" /> {c.code}
                    </button>
                  ))}
                </div>
              </>
            )}

            <dl className="mt-4 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Items ({items.length})</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount ({coupon?.code})</dt><dd className="font-medium">−{formatPrice(discount)}</dd></div>}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold"><dt>Total</dt><dd>{formatPrice(payable)}</dd></div>
            </dl>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" /> 100% secure payments via Razorpay
            </div>
          </div>
        </aside>
      </div>

      {/* Add / edit address popup */}
      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingId ? 'Edit address' : 'Add new address'}
        size="lg"
        footer={(
          <>
            <button onClick={() => setModalOpen(false)} disabled={saving} className="btn-ghost">Cancel</button>
            <button onClick={saveAddress} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save address'}</button>
          </>
        )}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Label</label>
            <select name="label" value={form.label} onChange={updateForm} className="field"><option>Home</option><option>Work</option><option>Other</option></select>
          </div>
          <div>
            <label className="label">Full name</label>
            <input name="name" className="field" value={form.name} onChange={updateForm} />
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>
          <div>
            <label className="label">Mobile number</label>
            <input name="phone" className="field" value={form.phone} onChange={updateForm} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Email address</label>
            <input name="email" type="email" className="field" value={form.email} onChange={updateForm} />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>
          <div>
            <label className="label">PIN code</label>
            <input name="pincode" className="field" value={form.pincode} onChange={updateForm} />
            {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
          </div>
          <div>
            <label className="label">Country</label>
            <input name="country" className="field" value={form.country} onChange={updateForm} />
            {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address line 1</label>
            <input name="line1" className="field" value={form.line1} onChange={updateForm} />
            {errors.line1 && <p className="mt-1 text-xs text-red-600">{errors.line1}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="label">Address line 2 (optional)</label>
            <input name="line2" className="field" value={form.line2} onChange={updateForm} />
          </div>
          <div>
            <label className="label">City</label>
            <input name="city" className="field" value={form.city} onChange={updateForm} />
            {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
          </div>
          <div>
            <label className="label">State</label>
            <input name="state" className="field" value={form.state} onChange={updateForm} />
            {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-soft sm:col-span-2">
            <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={updateForm} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
            Set as default address
          </label>
        </div>
      </Modal>
    </div>
  );
}
