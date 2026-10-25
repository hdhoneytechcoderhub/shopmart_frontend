import { createSlice } from '@reduxjs/toolkit';

const THEME_KEY = 'shopmart-theme';

const initialTheme = (() => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch { return 'light'; }
})();

// Apply the theme class to <html> as early as possible.
export const applyThemeClass = (theme) => {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
};
applyThemeClass(initialTheme);

const persistTheme = (t) => { try { localStorage.setItem(THEME_KEY, t); } catch { /* ignore */ } };

const uiSlice = createSlice({
  name: 'ui',
  initialState: { cartDrawerOpen: false, mobileMenuOpen: false, searchOpen: false, theme: initialTheme },
  reducers: {
    openCartDrawer(state) { state.cartDrawerOpen = true; },
    closeCartDrawer(state) { state.cartDrawerOpen = false; },
    toggleMobileMenu(state) { state.mobileMenuOpen = !state.mobileMenuOpen; },
    closeMobileMenu(state) { state.mobileMenuOpen = false; },
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeClass(state.theme);
      persistTheme(state.theme);
    },
    setTheme(state, action) {
      state.theme = action.payload;
      applyThemeClass(state.theme);
      persistTheme(state.theme);
    },
  },
});

export const { openCartDrawer, closeCartDrawer, toggleMobileMenu, closeMobileMenu, toggleTheme, setTheme } = uiSlice.actions;
export default uiSlice.reducer;

export const selectTheme = (s) => s.ui.theme;
