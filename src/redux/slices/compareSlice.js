import { createSlice } from '@reduxjs/toolkit';

// Compare Products didn't exist anywhere in this app. Client-side only, like
// the cart/wishlist guest mirrors — there's no backend concept of a
// "comparison list" to sync to (nor should there need to be; this is a
// disposable browsing aid, not account data).
const KEY = 'sm_compare_products';
const MAX_ITEMS = 4;
const load = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
};
const persist = (items) => localStorage.setItem(KEY, JSON.stringify(items));

const compareSlice = createSlice({
  name: 'compare',
  initialState: { items: load() },
  reducers: {
    addToCompare(state, action) {
      const product = action.payload;
      if (state.items.some((p) => p.id === product.id)) return;
      if (state.items.length >= MAX_ITEMS) state.items.shift();
      state.items.push(product);
      persist(state.items);
    },
    removeFromCompare(state, action) {
      state.items = state.items.filter((p) => p.id !== action.payload);
      persist(state.items);
    },
    clearCompare(state) {
      state.items = [];
      persist(state.items);
    },
  },
});

export const { addToCompare, removeFromCompare, clearCompare } = compareSlice.actions;
export default compareSlice.reducer;

export const selectCompareItems = (s) => s.compare.items;
export const selectIsComparing = (id) => (s) => s.compare.items.some((p) => p.id === id);
export const COMPARE_MAX_ITEMS = MAX_ITEMS;
