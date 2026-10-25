import axios from 'axios';
import { API_BASE_URL, STORAGE } from '../utils/constants';

// Demo mode runs the whole app on bundled local mock data with NO backend calls.
// Default: ON (so the project runs standalone on localhost). To use the real API
// instead, set VITE_DEMO_MODE=false in your .env.
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

// Central axios instance pointed at the Spring Boot backend (/api context path).
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Tokens live in localStorage when "Remember me" is on, otherwise in
// sessionStorage (cleared when the browser/tab closes). Reads check both.
export const getAccessToken = () => localStorage.getItem(STORAGE.ACCESS_TOKEN) || sessionStorage.getItem(STORAGE.ACCESS_TOKEN);
export const getRefreshToken = () => localStorage.getItem(STORAGE.REFRESH_TOKEN) || sessionStorage.getItem(STORAGE.REFRESH_TOKEN);

export const setTokens = ({ accessToken, refreshToken }, remember) => {
  // When remember isn't explicitly passed (e.g. token refresh), keep the user's
  // original choice so a refresh doesn't silently move tokens to localStorage.
  if (remember === undefined) remember = localStorage.getItem(STORAGE.REMEMBER) !== '0';
  const store = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  if (accessToken) { store.setItem(STORAGE.ACCESS_TOKEN, accessToken); other.removeItem(STORAGE.ACCESS_TOKEN); }
  if (refreshToken) { store.setItem(STORAGE.REFRESH_TOKEN, refreshToken); other.removeItem(STORAGE.REFRESH_TOKEN); }
  localStorage.setItem(STORAGE.REMEMBER, remember ? '1' : '0');
};

export const clearTokens = () => {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(STORAGE.ACCESS_TOKEN);
    s.removeItem(STORAGE.REFRESH_TOKEN);
    s.removeItem(STORAGE.USER);
  });
  localStorage.removeItem(STORAGE.USER);
};

// Attach the bearer token to every request.
api.interceptors.request.use((config) => {
  // In demo mode, never hit the network. Reject with a no-response error so each
  // service's built-in fallback returns local mock data (and the console/terminal
  // stay clean — no real HTTP request is ever made).
  if (DEMO_MODE) {
    return Promise.reject({ isDemoMode: true, config, message: 'Demo mode: backend disabled' });
  }
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Shared refresh call — used by the 401 interceptor below (reactive) and by
// the session-timeout warning (proactive, before the token actually expires).
export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
  setTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
  return data.accessToken;
}

// Rotating-refresh-token flow: on 401, try once to refresh and replay.
let isRefreshing = false;
let queue = [];

const processQueue = (error, token = null) => {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
};

api.interceptors.response.use(
  (res) => {
    // The Spring backend wraps payloads in an ApiResponse envelope
    // ({ success, message, data }). Unwrap it so callers receive the inner
    // payload directly (array, object, or PageResponse). Conservative: only
    // unwrap when it clearly looks like that envelope.
    const body = res.data;
    if (
      body && typeof body === 'object' && !Array.isArray(body)
      && 'data' in body && ('success' in body || 'message' in body)
    ) {
      res.data = body.data;
    }
    return res;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && !original._retry && getRefreshToken()) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => queue.push({ resolve, reject }))
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const accessToken = await refreshAccessToken();
        processQueue(null, accessToken);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        clearTokens();
        if (window.location.pathname !== '/login') window.location.assign('/login');
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// Normalises an axios error into a readable message.
export const apiError = (error) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  'Something went wrong. Please try again.';

export default api;
