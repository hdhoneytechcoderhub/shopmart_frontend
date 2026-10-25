import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Tag, Check, X, BadgePercent } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useCart } from '../hooks/useCart';
import { setCoupon as setCouponAction, clearCoupon, selectCoupon } from '../redux/slices/cartSlice';
import { COUPONS } from '../utils/coupons';
import { couponService } from '../services/couponService';
import QuantityStepper from '../components/common/QuantityStepper';
import EmptyState from '../components/common/EmptyState';
import { formatPrice } from '../utils/format';

export default function Cart() {
  const { items, subtotal, setQty, remove, keyOf } = useCart();
  const dispatch = useDispatch();
  // { code, discount } | null — discount is whatever the backend actually
  // computed in validate(), never re-derived locally. Real (admin-created)
  // coupons used to validate successfully but then show a ₹0 discount
  // because the old code re-looked-up the amount in a hardcoded local
  // catalog that only ever contained the 4 demo codes.
  const coupon = useSelector(selectCoupon);
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);

  const baseShipping = subtotal > 999 || subtotal === 0 ? 0 : 79;
  // FREESHIP is the one local demo code that discounts shipping instead of
  // the subtotal; every other coupon (including all real backend-managed
  // ones) discounts the subtotal by the amount the backend computed.
  const isFreeShip = coupon?.code === 'FREESHIP';
  const shipping = isFreeShip ? 0 : baseShipping;
  const couponDiscount = isFreeShip ? 0 : (coupon?.discount || 0);
  const total = Math.max(0, subtotal + shipping - couponDiscount);

  // Re-validate a persisted or previously-applied coupon whenever the
  // subtotal changes (items added/removed) — the discount amount and even
  // the coupon's validity (min order, usage limits) can depend on it.
  useEffect(() => {
    if (!coupon?.code || subtotal <= 0) return;
    let active = true;
    couponService.validate(coupon.code, subtotal).then((res) => {
      if (!active) return;
      if (res.ok) {
        if (res.discount !== coupon.discount) dispatch(setCouponAction({ code: coupon.code, discount: res.discount }));
      } else {
        dispatch(clearCoupon());
        toast.error(`Coupon ${coupon.code} no longer applies${res.reason ? `: ${res.reason}` : ''}`);
      }
    });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const apply = async (raw) => {
    const c = (raw ?? code).trim();
    if (!c) return;
    setValidating(true);
    try {
      const res = await couponService.validate(c, subtotal);
      if (!res.ok) { toast.error(res.reason || 'Invalid coupon'); return; }
      const appliedCode = (res.coupon?.code || c).toUpperCase();
      dispatch(setCouponAction({ code: appliedCode, discount: res.discount }));
      setCode('');
      toast.success(`Coupon ${appliedCode} applied`);
    } finally {
      setValidating(false);
    }
  };

  const removeCoupon = () => { dispatch(clearCoupon()); toast('Coupon removed'); };

  if (items.length === 0) {
    return (
      <div className="container-page py-12">
        <h1 className="mb-6 text-2xl font-bold">Your cart</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet."
          action={<Link to="/shop" className="btn-primary">Browse products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <h1 className="mb-6 text-2xl font-bold">Your cart ({items.length})</h1>
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {items.map((item) => {
            const key = keyOf(item);
            return (
              <div key={key} className="card flex gap-4 p-4">
                <Link to={`/product/${item.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/product/${item.slug}`} className="font-semibold hover:text-brand-700">{item.name}</Link>
                    <button onClick={() => remove(key)} className="text-slate-400 hover:text-red-500" aria-label="Remove">
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                  {(item.size || item.color) && (
                    <p className="text-sm text-ink-muted">{[item.size, item.color].filter(Boolean).join(' · ')}</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <QuantityStepper size="sm" value={item.quantity} onChange={(q) => setQty(key, q)} />
                    <span className="font-bold">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="text-lg font-semibold">Order summary</h2>

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
                    <input value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && apply()} placeholder="Coupon code" className="field pl-9 uppercase" />
                  </div>
                  <button onClick={() => apply()} disabled={validating} className="btn-outline">{validating ? 'Checking…' : 'Apply'}</button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {COUPONS.slice(0, 3).map((c) => (
                    <button key={c.code} onClick={() => apply(c.code)} className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-[11px] font-medium text-ink-soft hover:border-brand-400 hover:text-brand-700">
                      <BadgePercent className="h-3 w-3" /> {c.code}
                    </button>
                  ))}
                </div>
              </>
            )}

            <dl className="mt-5 space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Subtotal</dt><dd className="font-medium">{formatPrice(subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Shipping</dt><dd className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</dd></div>
              {couponDiscount > 0 && <div className="flex justify-between text-emerald-600"><dt>Discount ({coupon.code})</dt><dd className="font-medium">−{formatPrice(couponDiscount)}</dd></div>}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-bold"><dt>Total</dt><dd>{formatPrice(total)}</dd></div>
            </dl>

            <Link to="/checkout" className="btn-accent mt-5 w-full">
              Proceed to checkout <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" className="btn-ghost mt-2 w-full">Continue shopping</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
