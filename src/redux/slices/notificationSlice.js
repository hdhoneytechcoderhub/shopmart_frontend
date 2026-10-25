import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'notifications',
  initialState: { items: [], initialized: false },
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload || [];
      state.initialized = true;
    },
    addNotification(state, action) {
      state.items.unshift({
        id: action.payload.id || `n-${Date.now()}`,
        read: false,
        createdAt: new Date().toISOString(),
        ...action.payload,
      });
    },
    markRead(state, action) {
      const n = state.items.find((x) => x.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead(state) {
      state.items.forEach((n) => { n.read = true; });
    },
    removeNotification(state, action) {
      state.items = state.items.filter((x) => x.id !== action.payload);
    },
    clearAll(state) {
      state.items = [];
    },
  },
});

export const {
  setNotifications, addNotification, markRead, markAllRead, removeNotification, clearAll,
} = slice.actions;

export default slice.reducer;

export const selectNotifications = (s) => s.notifications.items;
export const selectUnreadCount = (s) => s.notifications.items.filter((n) => !n.read).length;
export const selectNotificationsInitialized = (s) => s.notifications.initialized;
