import { createSlice } from '@reduxjs/toolkit';

const KEY = 'sm_wishlist_guest';
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};
const persist = (items) => localStorage.setItem(KEY, JSON.stringify(items));

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: load() },
  reducers: {
    toggleWishlist(state, action) {
      const product = action.payload;
      const idx = state.items.findIndex((p) => p.id === product.id);
      if (idx >= 0) state.items.splice(idx, 1);
      else state.items.push(product);
      persist(state.items);
    },
    removeWishlist(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      persist(state.items);
    },
    setWishlist(state, action) {
      state.items = action.payload || [];
      persist(state.items);
    },
  },
});

export const { toggleWishlist, removeWishlist, setWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

export const selectWishlist = (s) => s.wishlist.items;
export const selectIsWishlisted = (id) => (s) => s.wishlist.items.some((p) => p.id === id);
