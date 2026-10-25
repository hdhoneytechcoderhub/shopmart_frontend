import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setCart } from '../redux/slices/cartSlice';
import { setWishlist } from '../redux/slices/wishlistSlice';
import { accountService } from '../services/accountService';
import { DEMO_MODE } from '../services/api';
import { useAuth } from './useAuth';

// On sign-in (real backend only), pull the user's server-side cart and wishlist
// into Redux so they carry across devices/sessions. In demo mode this is a no-op
// and the local-only cart/wishlist remain the source of truth.
const normalizeCartItems = (data) => {
  const raw = Array.isArray(data) ? data : (data?.items || data?.content || []);
  return raw.map((i) => ({
    serverId: i.id ?? i.itemId,
    productId: i.productId ?? i.product?.id,
    slug: i.slug ?? i.product?.slug,
    name: i.name ?? i.product?.name,
    // Backend CartItemResponse uses unitPrice/thumbnail, not price/image —
    // without this, every server-synced cart item's price was undefined,
    // making the cart subtotal (and the Razorpay payment amount) NaN.
    price: i.price ?? i.unitPrice ?? i.product?.price,
    image: i.image ?? i.thumbnail ?? i.product?.images?.[0],
    size: i.size,
    color: i.color,
    quantity: i.quantity ?? 1,
  })).filter((i) => i.productId != null);
};

const normalizeWishlist = (data) => {
  const raw = Array.isArray(data) ? data : (data?.items || data?.content || []);
  return raw.map((i) => (i.product ? i.product : i)).filter(Boolean);
};

export const useCommerceSync = () => {
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || DEMO_MODE) return;
    let active = true;

    accountService.getCart()
      .then((data) => { if (active) { const items = normalizeCartItems(data); if (items.length) dispatch(setCart(items)); } })
      .catch(() => {});

    accountService.getWishlist()
      .then((data) => { if (active) { const items = normalizeWishlist(data); if (items.length) dispatch(setWishlist(items)); } })
      .catch(() => {});

    return () => { active = false; };
  }, [isAuthenticated, dispatch]);
};

export default useCommerceSync;
