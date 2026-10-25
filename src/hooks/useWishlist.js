import { useSelector, useDispatch } from 'react-redux';
import { toggleWishlist, removeWishlist, selectWishlist, selectIsWishlisted } from '../redux/slices/wishlistSlice';
import { accountService } from '../services/accountService';
import { DEMO_MODE } from '../services/api';
import { useAuth } from './useAuth';

// Wishlist with an optimistic local mirror (Redux + localStorage) that also
// syncs to the backend when a real user is signed in (non-demo). In demo mode
// it stays purely local so the feature works standalone.
export const useWishlist = () => {
  const items = useSelector(selectWishlist);
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const live = isAuthenticated && !DEMO_MODE;

  const isWishlisted = (id) => items.some((p) => p.id === id);

  const toggle = (product) => {
    const wasIn = isWishlisted(product.id);
    dispatch(toggleWishlist(product)); // optimistic
    if (!live) return;
    const op = wasIn
      ? accountService.removeFromWishlist(product.id)
      : accountService.addToWishlist(product.id);
    op.catch(() => { /* keep optimistic state; surfaced elsewhere if needed */ });
  };

  const remove = (id) => {
    dispatch(removeWishlist(id));
    if (live) accountService.removeFromWishlist(id).catch(() => {});
  };

  return { items, isWishlisted, toggle, remove };
};

export { selectIsWishlisted };
export default useWishlist;
