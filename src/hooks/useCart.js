import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  addItem, updateQuantity, removeItem, clearCart, setServerId,
  selectCartItems, selectCartCount, selectCartSubtotal, cartLineKey,
} from '../redux/slices/cartSlice';
import { openCartDrawer } from '../redux/slices/uiSlice';
import { accountService } from '../services/accountService';
import { DEMO_MODE } from '../services/api';
import { useAuth } from './useAuth';

export const useCart = () => {
  const items = useSelector(selectCartItems);
  const count = useSelector(selectCartCount);
  const subtotal = useSelector(selectCartSubtotal);
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();

  // Sync to the backend only for a real signed-in user (skipped in demo mode,
  // where the cart lives entirely in Redux + localStorage). All server calls are
  // best-effort so the UI never blocks on the network.
  const live = isAuthenticated && !DEMO_MODE;
  const lineFromKey = (key) => items.find((i) => cartLineKey(i) === key);

  return {
    items, count, subtotal,
    add: (item, { silent = false } = {}) => {
      dispatch(addItem(item)); // optimistic
      if (live) {
        const key = cartLineKey(item);
        accountService.addToCart({
          productId: item.productId,
          quantity: item.quantity || 1,
          size: item.size,
          color: item.color,
        }).then((cart) => {
          // Real cart item id is needed for update/remove to hit the right
          // resource — PUT/DELETE /cart/items/{itemId} takes the cart item's
          // own id, not the product id. Without capturing this, later
          // quantity changes or removals would silently fail against the
          // real API (optimistic Redux update would mask the failure).
          const match = cart?.items?.find((ci) => ci.productId === item.productId
            && (item.size || item.color ? true : ci.variantId == null));
          if (match) dispatch(setServerId({ key, serverId: match.id }));
        }).catch(() => {});
      }
      if (!silent) {
        toast.success(`${item.name} added to cart`);
        dispatch(openCartDrawer());
      }
    },
    setQty: (key, quantity) => {
      dispatch(updateQuantity({ key, quantity }));
      if (live) {
        const line = lineFromKey(key);
        if (line?.serverId) accountService.updateCartItem(line.serverId, Math.max(1, quantity)).catch(() => {});
      }
    },
    remove: (key) => {
      const line = lineFromKey(key);
      dispatch(removeItem(key));
      if (live && line?.serverId) accountService.removeCartItem(line.serverId).catch(() => {});
    },
    clear: () => {
      dispatch(clearCart());
      if (live) accountService.clearCart().catch(() => {});
    },
    keyOf: cartLineKey,
  };
};

export default useCart;
