import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { closeCartDrawer } from '../../redux/slices/uiSlice';
import { useCart } from '../../hooks/useCart';
import { formatPrice } from '../../utils/format';
import QuantityStepper from '../common/QuantityStepper';

export default function CartDrawer() {
  const open = useSelector((s) => s.ui.cartDrawerOpen);
  const dispatch = useDispatch();
  const { items, subtotal, setQty, remove, keyOf } = useCart();
  const close = () => dispatch(closeCartDrawer());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={close} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md animate-slide-in flex-col bg-white shadow-pop">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShoppingBag className="h-5 w-5 text-brand-600" /> Your cart
          </h2>
          <button onClick={close} className="btn-ghost h-8 w-8 p-0" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-slate-300" />
            <p className="text-ink-muted">Your cart is empty.</p>
            <button onClick={close} className="btn-primary">Start shopping</button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {items.map((item) => {
                const key = keyOf(item);
                return (
                  <div key={key} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl border border-slate-100 object-cover" />
                    <div className="flex flex-1 flex-col">
                      <Link to={`/product/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-semibold hover:text-brand-700">
                        {item.name}
                      </Link>
                      <p className="text-xs text-ink-muted">
                        {[item.size, item.color].filter(Boolean).join(' · ')}
                      </p>
                      <div className="mt-auto flex items-center justify-between">
                        <QuantityStepper size="sm" value={item.quantity} onChange={(q) => setQty(key, q)} />
                        <span className="text-sm font-bold">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                    <button onClick={() => remove(key)} className="self-start text-slate-400 hover:text-red-500" aria-label="Remove item">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <footer className="space-y-3 border-t border-slate-100 px-5 py-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-muted">Subtotal</span>
                <span className="text-lg font-bold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-ink-muted">Shipping &amp; taxes calculated at checkout.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link to="/cart" onClick={close} className="btn-outline">View cart</Link>
                <Link to="/checkout" onClick={close} className="btn-accent">Checkout</Link>
              </div>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
