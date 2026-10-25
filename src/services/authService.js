import api, { setTokens, clearTokens, DEMO_MODE } from './api';
import { STORAGE, ROLES, normalizeRoles, pickPrimaryRole } from '../utils/constants';
import { sessionService } from './sessionService';

const persistUser = (user) => localStorage.setItem(STORAGE.USER, JSON.stringify(user));
export const getStoredUser = () => {
  try { return JSON.parse(localStorage.getItem(STORAGE.USER)); } catch { return null; }
};

// Derive a role from an email for demo logins:
//   superadmin* → SUPER_ADMIN, admin* → ADMIN, engineer* → ENGINEER, else CUSTOMER
const demoRole = (email) => {
  const e = email.toLowerCase();
  if (e.startsWith('superadmin')) return ROLES.SUPER_ADMIN;
  if (e.startsWith('admin')) return ROLES.ADMIN;
  if (e.startsWith('engineer')) return ROLES.ENGINEER;
  return ROLES.CUSTOMER;
};

export const authService = {
  async login(credentials) {
    const remember = credentials.remember !== false;
    try {
      const { data } = await api.post('/auth/login', { email: credentials.email, password: credentials.password });
      setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken }, remember);
      // The backend returns a `roles` array (e.g. ["ROLE_CUSTOMER", "ROLE_ADMIN",
      // "ROLE_SUPER_ADMIN"]) on data.user, not a singular `role`. Derive both a
      // normalized `roles` array and a single primary `role` (highest privilege
      // wins) so every part of the app — AdminRoute, SuperAdminRoute, useAuth,
      // Login.jsx — can rely on `user.role` being correct.
      const raw = data.user || { email: credentials.email, name: credentials.email.split('@')[0], roles: [data.role].filter(Boolean) };
      const sourceRoles = Array.isArray(raw.roles) && raw.roles.length ? raw.roles : [raw.role];
      const user = { ...raw, roles: normalizeRoles(sourceRoles), role: pickPrimaryRole(sourceRoles) };
      persistUser(user);
      sessionService.recordLogin('SUCCESS');
      return { user, tokens: data };
    } catch (err) {
      if (err?.response) throw err;
      // Demo fallback: explore the authenticated UI without a backend.
      const role = demoRole(credentials.email);
      const labels = {
        [ROLES.SUPER_ADMIN]: 'Super Admin', [ROLES.ADMIN]: 'Admin',
        [ROLES.ENGINEER]: 'Engineer', [ROLES.CUSTOMER]: credentials.email.split('@')[0],
      };
      const user = { id: 1, name: labels[role], email: credentials.email, role, roles: [role] };
      setTokens({ accessToken: 'demo.token', refreshToken: 'demo.refresh' }, remember);
      persistUser(user);
      sessionService.recordLogin('SUCCESS');
      return { user, tokens: { accessToken: 'demo.token' }, demo: true };
    }
  },

  async register(payload) {
    const { data } = await api.post('/auth/register', payload);
    return data;
  },

  async verifyOtp(payload) {
    const { data } = await api.post('/auth/verify-otp', payload);
    if (data.accessToken) setTokens(data);
    if (data.user) {
      const sourceRoles = Array.isArray(data.user.roles) && data.user.roles.length ? data.user.roles : [data.user.role];
      persistUser({ ...data.user, roles: normalizeRoles(sourceRoles), role: pickPrimaryRole(sourceRoles) });
    }
    return data;
  },

  async resendOtp(email) {
    const { data } = await api.post('/auth/resend-otp', { email });
    return data;
  },

  // Password recovery
  async forgotPassword(email) {
    if (DEMO_MODE) return { success: true, message: 'If an account exists, a reset link has been sent.' };
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data ?? { success: true };
    } catch (err) {
      if (!err?.response) return { success: true, message: 'If an account exists, a reset link has been sent.' };
      throw err;
    }
  },

  async resetPassword({ token, email, password }) {
    if (DEMO_MODE) return { success: true };
    try {
      const { data } = await api.post('/auth/reset-password', { token, email, newPassword: password });
      return data ?? { success: true };
    } catch (err) {
      if (!err?.response) return { success: true };
      throw err;
    }
  },

  async me() {
    const { data } = await api.get('/auth/me');
    const sourceRoles = Array.isArray(data.roles) && data.roles.length ? data.roles : [data.role];
    const user = { ...data, roles: normalizeRoles(sourceRoles), role: pickPrimaryRole(sourceRoles) };
    persistUser(user);
    return user;
  },

  logout() {
    api.post('/auth/logout').catch(() => {});
    clearTokens();
  },
};
