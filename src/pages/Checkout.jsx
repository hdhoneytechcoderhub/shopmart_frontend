import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
import { addNotification } from '../redux/slices/notificationSlice';
import { mockAddresses } from '../services/mockAccount';
import { isPhone, required } from '../utils/validators';
import { formatPrice } from '../utils/format';
import Modal from '../components/common/Modal';

const STEPS = ['Address', 'Payment', 'Review'];
const EMPTY = { label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

export default function Checkout() {
  const navigate = useNavigate();
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
  const createdOrderRef = useRef(null); // reuse the same order on retry

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

  const isFreeShip = coupon?.code === 'FREESHIP';
  const baseShipping = subtotal > 999 || subtotal === 0 ? 0 : 79;
  const freeShip = isFreeShip;
  const shipping = freeShip ? 0 : baseShipping;
  const discount = freeShip ? 0 : (coupon?.discount || 0);
  const total = Math.max(0, subtotal + shipping - discount);

  const selectedAddress = addresses.find((a) => a.id === selectedId) || null;

  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);

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

  if (items.length === 0 && phase === 'idle') {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-muted">Add items before checking out.</p>
        <button onClick={() => navigate('/shop')} className="btn-primary mt-6">Browse products</button>
      </div>
    );
  }

  // ── Address form (add / edit) ─────────────────────────────────────────
  const openAdd = () => { setEditingId(null); setForm({ ...EMPTY, name: user?.name || '' }); setErrors({}); setModalOpen(true); };
  const openEdit = (a) => { setEditingId(a.id); setForm({ ...EMPTY, ...a }); setErrors({}); setModalOpen(true); };
  const updateForm = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };
  const validateForm = () => {
    const next = {};
    if (!required(form.name)) next.name = 'Name is required';
    if (!isPhone(form.phone)) next.phone = 'Enter a valid 10-digit number';
    if (!required(form.line1)) next.line1 = 'Address is required';
    if (!required(form.city)) next.city = 'City is required';
    if (!required(form.state)) next.state = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) next.pincode = 'Enter a valid 6-digit pincode';
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

  // Place order → create order (API) → create payment order → Razorpay → verify.
  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); setStep(0); return; }
    setPhase('processing');
    setErrorMsg('');

    try {
      // 1. Create the order first (status PENDING / PAYMENT_INITIATED). Reuse it on retry.
      let order = createdOrderRef.current;
      if (!order) {
        setStatusText('Syncing your cart...');
        const { skipped } = await cartService.syncToBackend(items);
        if (skipped.length) {
          throw Object.assign(
            new Error(`${skipped.length} item(s) with a selected size/color can't be checked out yet — variant selection isn't wired to the backend cart. Remove them or check out without variants.`),
            { cancelled: false }
          );
        }
        setStatusText('Creating your order...');
        const payload = {
          items: items.map((i) => ({
            productId: i.productId, quantity: i.quantity, size: i.size, color: i.color,
            price: i.price, name: i.name, image: i.image, slug: i.slug,
          })),
          shippingAddress: selectedAddress,
          // Backend only accepts paymentMethod in {COD, UPI, CARD, NETBANKING,
          // WALLET} — 'RAZORPAY' isn't one of them and was rejected with a 400
          // at order creation, before the code ever got to open the Razorpay
          // popup. Razorpay is the gateway, not the method; any non-COD value
          // here routes through the same gateway flow on the backend, and the
          // customer still picks UPI/Card/NetBanking/Wallet inside the Razorpay
          // widget itself. Using CARD as the stored label until there's a
          // method-selection step in the UI.
          paymentMethod: 'CARD',
          amount: total, subtotal, shipping, discount, couponCode: coupon?.code,
          status: 'PAYMENT_INITIATED', paymentStatus: 'PENDING',
        };
        order = await accountService.placeOrder(payload);
        createdOrderRef.current = order;
      }
      const orderId = order.id || order.orderId;
      console.log('Order Created', orderId);

      // 2 + 3. Create payment order from orderId, then open Razorpay.
      setStatusText('Opening secure payment...');
      const payload = { orderId, amount: total };
      console.log('Payment Request', payload);
      const result = await razorpayService.checkout({
        orderId,
        amount: total,
        name: 'ShopMart',
        description: `Payment for order ${orderId}`,
        prefill: {
          name: selectedAddress?.name || user?.name || '',
          email: user?.email || '',
          contact: selectedAddress?.phone || user?.phone || '',
        },
        notes: { receipt: `rcpt_${Date.now()}` },
      });

      // 4. Payment verified inside checkout → finalize (PAID / CONFIRMED).
      setPhase('done');
      setStatusText('Payment confirmed');
      const finalOrder = (await accountService.finalizePaidOrder(orderId, result)) || {
        ...order, paymentStatus: 'PAID', status: 'CONFIRMED',
        razorpayPaymentId: result.paymentId, razorpayOrderId: result.razorpayOrderId,
      };

      clear();
      dispatch(addNotification({
        category: 'ORDER', icon: 'box', title: 'Payment successful',
        body: `Your order ${orderId} has been confirmed. We'll notify you when it ships.`,
        link: `/dashboard/orders/${orderId}`,
      }));
      await new Promise((r) => setTimeout(r, 400));
      navigate(`/order-success/${orderId}`, { replace: true, state: { order: finalOrder } });
    } catch (err) {
      // Order stays PENDING; allow retry against the same order.
      setPhase('failed');
      setErrorMsg(err?.cancelled ? 'Payment was cancelled before completion.' : (err?.message || 'Payment could not be completed. Please try again.'));
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
                  <h2 className="mb-4 text-lg font-semibold">Review &amp; place order</h2>

                  {phase === 'failed' && (
                    <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
                      <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-700">Payment failed</p>
                        <p className="text-xs text-red-600/90">{errorMsg}</p>
                        <Link to={`/payment-failed/${createdOrderRef.current?.id || createdOrderRef.current?.orderId || ''}?reason=${encodeURIComponent(errorMsg)}`} className="mt-1 inline-block text-xs font-medium text-red-700 underline">
                          View details
                        </Link>
                      </div>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 p-4 text-sm">
                    <p className="font-semibold">{selectedAddress?.name} · {selectedAddress?.phone}</p>
                    <p className="text-ink-soft">{[selectedAddress?.line1, selectedAddress?.line2, selectedAddress?.city, selectedAddress?.state, selectedAddress?.pincode].filter(Boolean).join(', ')}</p>
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
                    <button onClick={placeOrder} className="btn-accent flex-1">
                      {phase === 'failed' ? 'Retry Payment' : 'Place Order'} · {formatPrice(total)} <ArrowRight className="h-4 w-4" />
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
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
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
            <label className="label">Phone</label>
            <input name="phone" className="field" value={form.phone} onChange={updateForm} />
            {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>
          <div>
            <label className="label">Pincode</label>
            <input name="pincode" className="field" value={form.pincode} onChange={updateForm} />
            {errors.pincode && <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>}
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
