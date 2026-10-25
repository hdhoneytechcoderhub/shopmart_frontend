import { DEMO_MODE } from './api';
import { accountService } from './accountService';

// The cart has always been purely client-side (Redux + localStorage). Turns
// out accountService already had correct getCart/addToCart/clearCart calls
// wired to the real backend — they just were never actually called by
// anything (not the Redux cart slice, not checkout). That's the real gap:
// OrderServiceImpl.create() on the backend builds the order from the
// SERVER-SIDE cart, not from any items in the create-order request body, so
// without a sync, checkout against the real API always fails with "Your cart
// is empty" — a second, separate blocker from the paymentMethod bug, hit
// immediately after that one's fixed.
//
// Backend gap: AddToCartRequest takes a `variantId` (Long), not size/color
// strings, and nothing in this app resolves a chosen size+color back to a
// real ProductVariant id (see the Products-module notes on the variant model
// mismatch). Items with a size/color selected can't be synced yet; they're
// skipped here rather than sent with a made-up variantId, and the caller is
// told which ones so it can warn the customer instead of silently dropping them.
export const cartService = {
  async syncToBackend(items) {
    if (DEMO_MODE) return { synced: items.length, skipped: [] };

    const syncable = items.filter((i) => !i.size && !i.color);
    const skipped = items.filter((i) => i.size || i.color);

    await accountService.clearCart();
    for (const item of syncable) {
      await accountService.addToCart({ productId: Number(item.productId), quantity: item.quantity });
    }

    return { synced: syncable.length, skipped };
  },
};

export default cartService;
