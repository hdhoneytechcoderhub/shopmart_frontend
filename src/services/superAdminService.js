/**
 * superAdminService.js
 * All Super Admin API calls: Admin CRUD, Activity Logs, Attendance, Analytics.
 * Falls back to demo data when DEMO_MODE=true or on connection errors.
 */
import api, { DEMO_MODE } from './api';
import { seedAdmins, seedActivityLogs, buildAttendance, superStats, salesSeries, topProductsData, ordersByStatusData } from './superAdminMock';
import { createDemoStore } from './demoCrud';

const useMock = (err) => {
  if (err?.response) throw err;
  return true;
};

const toAdminRow = (a) => ({
  id: a.id, name: a.name, email: a.email, phone: a.phone,
  role: (a.roles || []).includes('ROLE_SUPER_ADMIN') ? 'SUPER_ADMIN' : 'ADMIN',
  status: a.enabled ? 'Active' : 'Inactive',
  lastLogin: null, // backend doesn't track this yet
  createdAt: a.createdAt,
});

export const superAdminService = {
  // ── Admin CRUD ────────────────────────────────────────────────────────
  // Real endpoints: POST/GET/PUT/DELETE /super-admin/admins(/{id}).
  // Backend gaps:
  //  - createAdmin ALWAYS assigns ROLE_ADMIN — there's no way to create a
  //    SUPER_ADMIN account through this endpoint. The form's role picker
  //    should not promise otherwise.
  //  - No "generate + email a temporary password" flow exists — only a
  //    direct "set this exact password" (via updateAdmin's `password` field).
  //    resetAdminPassword() below reflects that honestly in real mode.
  //  - No lastLogin tracking on the backend at all.
  async getAdmins() {
    if (DEMO_MODE) return [...seedAdmins];
    try {
      const { data } = await api.get('/super-admin/admins');
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map(toAdminRow);
    } catch (err) {
      if (useMock(err)) return [...seedAdmins];
    }
    return [...seedAdmins];
  },

  async createAdmin(payload) {
    if (DEMO_MODE) {
      return { ...payload, id: Date.now(), createdAt: new Date().toISOString(), lastLogin: null };
    }
    const { data } = await api.post('/super-admin/admins', {
      name: payload.name, email: payload.email, phone: payload.phone, password: payload.password,
    });
    return toAdminRow({ ...data, enabled: true });
  },

  async updateAdmin(id, payload) {
    if (DEMO_MODE) return { ...payload, id };
    const { data } = await api.put(`/super-admin/admins/${id}`, {
      name: payload.name, phone: payload.phone,
      enabled: payload.status ? payload.status === 'Active' : undefined,
    });
    return toAdminRow(data);
  },

  async deleteAdmin(id) {
    if (DEMO_MODE) return { success: true };
    const { data } = await api.delete(`/super-admin/admins/${id}`);
    return data ?? { success: true };
  },

  async toggleAdminStatus(id, status) {
    if (DEMO_MODE) return { id, status };
    const { data } = await api.put(`/super-admin/admins/${id}`, { enabled: status === 'Active' });
    return toAdminRow(data);
  },

  // Backend gap: no "generate a temp password and email it" endpoint exists.
  // Real mode surfaces that plainly instead of pretending to send an email.
  async resetAdminPassword(id) {
    if (DEMO_MODE) {
      const temp = `Tmp@${Math.random().toString(36).slice(2, 8)}`;
      return { success: true, temporaryPassword: temp };
    }
    throw Object.assign(new Error('Not supported yet'), {
      response: { data: { message: "Password reset emails aren't supported yet — use \"Change password\" to set one directly." } },
    });
  },

  // Super Admin sets a specific new password for an admin — this one IS real.
  async setAdminPassword(id, newPassword) {
    if (DEMO_MODE) return { success: true };
    const { data } = await api.put(`/super-admin/admins/${id}`, { password: newPassword });
    return toAdminRow(data);
  },

  async getAdmin(id) {
    if (DEMO_MODE) return seedAdmins.find((a) => String(a.id) === String(id)) || null;
    try {
      const { data } = await api.get(`/super-admin/admins/${id}`);
      return toAdminRow(data);
    } catch (err) {
      if (useMock(err)) return seedAdmins.find((a) => String(a.id) === String(id)) || null;
    }
    return null;
  },

  // ── Activity Logs ─────────────────────────────────────────────────────
  // Real endpoint: GET /admin/audit-logs → AuditLogResponse
  // { id, userId, action, entityType, entityId, detail, createdAt }.
  // Backend gap: no actor *name* is stored, only a userId — shown as
  // "User #<id>" rather than inventing a name.
  async getActivityLogs(params = {}) {
    if (DEMO_MODE) return [...seedActivityLogs];
    try {
      const { data } = await api.get('/admin/audit-logs', { params });
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map((l) => ({
        id: l.id,
        actor: l.actorName || (l.userId ? `User #${l.userId}` : 'System'),
        type: l.action,
        target: l.entityType ? `${l.entityType}${l.entityId ? ` #${l.entityId}` : ''}` : (l.detail || ''),
        at: l.createdAt,
      }));
    } catch (err) {
      if (useMock(err)) return [...seedActivityLogs];
    }
    return [...seedActivityLogs];
  },

  // ── Company-wide attendance (Admin/Super Admin) ────────────────────────
  // Real endpoints, built alongside the self-service ones above:
  // GET /attendance/all?from=&to=, GET /attendance/report?from=&to=.
  async getAllAttendance(from, to) {
    if (DEMO_MODE) {
      const names = ['Aarav Shah', 'Priya Menon', 'Rohan Iyer', 'Sneha Patil', 'Karan Verma'];
      return buildAttendance().flatMap((r, i) => names.map((n, ni) => ({
        id: `${i}-${ni}`, userId: ni + 1, userName: n,
        loginTime: r.login, logoutTime: r.logout, totalHours: r.hours,
      }))).filter((r) => r.loginTime);
    }
    try {
      const { data } = await api.get('/attendance/all', { params: { from, to } });
      return data || [];
    } catch (err) {
      if (useMock(err)) {
        const names = ['Aarav Shah', 'Priya Menon', 'Rohan Iyer', 'Sneha Patil', 'Karan Verma'];
        return buildAttendance().flatMap((r, i) => names.map((n, ni) => ({
          id: `${i}-${ni}`, userId: ni + 1, userName: n,
          loginTime: r.login, logoutTime: r.logout, totalHours: r.hours,
        }))).filter((r) => r.loginTime);
      }
      throw err;
    }
  },

  async getAttendanceReport(from, to) {
    if (DEMO_MODE) {
      return buildAttendance()
        .filter((r) => r.hours != null)
        .map((r) => ({ date: r.date?.slice(0, 10), presentCount: 5, totalHours: r.hours * 5 }));
    }
    try {
      const { data } = await api.get('/attendance/report', { params: { from, to } });
      return data || [];
    } catch (err) {
      if (useMock(err)) {
        return buildAttendance()
          .filter((r) => r.hours != null)
          .map((r) => ({ date: r.date?.slice(0, 10), presentCount: 5, totalHours: r.hours * 5 }));
      }
      throw err;
    }
  },

  // ── Self-service attendance ─────────────────────────────────────────────
  // Real endpoints: POST /attendance/login, POST /attendance/logout,
  // GET /attendance/my-hours (AttendanceResponse:
  // { id, userId, loginTime, logoutTime, totalHours }). The real endpoint
  // only returns days someone actually clocked in — no synthetic
  // "Absent"/weekend rows; AdminAttendance.jsx builds those client-side.
  async getAttendance() {
    if (DEMO_MODE) return buildAttendance();
    try {
      const { data } = await api.get('/attendance/my-hours');
      const rows = Array.isArray(data) ? data : [];
      return rows.map((a) => ({
        date: a.loginTime, login: a.loginTime, logout: a.logoutTime, hours: a.totalHours,
      })).sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (err) {
      if (useMock(err)) return buildAttendance();
    }
    return buildAttendance();
  },

  // Was entirely missing — the backend needs an explicit login call to open
  // a session before logout/hours make sense.
  async clockIn() {
    if (DEMO_MODE) return { success: true, login: new Date().toISOString() };
    const { data } = await api.post('/attendance/login');
    return { success: true, login: data?.loginTime };
  },

  async clockOut() {
    if (DEMO_MODE) return { success: true, logout: new Date().toISOString() };
    const { data } = await api.post('/attendance/logout');
    return { success: true, logout: data?.logoutTime, hours: data?.totalHours };
  },

  // ── Super Stats ───────────────────────────────────────────────────────
  async getSuperStats() {
    if (DEMO_MODE) return { ...superStats };
    try {
      const { data } = await api.get('/admin/super/stats');
      if (!data) return { ...superStats };
      return data;
    } catch (err) {
      if (useMock(err)) return { ...superStats };
    }
    return { ...superStats };
  },
};

// ─── Company Management ─────────────────────────────────────────────────
// Backend gap, and a significant one: there is no Company entity, endpoint,
// or table on the real backend today. ShopMart currently runs as a single
// storefront, not a multi-company marketplace. This whole section is a
// local-storage-backed control-plane UI — fully usable and persistent in
// demo mode — built ahead of the backend so the UI/UX is settled before
// that work starts. See PLATFORM-BACKEND-REQUIREMENTS.md for the schema
// and endpoints a real implementation would need.
const companyDemo = createDemoStore('sm_demo_companies_v1', [
  { id: 1, name: 'ShopMart Retail Pvt Ltd', contactEmail: 'ops@shopmart.example', contactPhone: '+91 98200 11223', gstNumber: '27AAAAA0000A1Z5', address: 'Ahmedabad, Gujarat, IN', status: 'ACTIVE', planId: 3, createdAt: '2025-01-12T00:00:00Z' },
  { id: 2, name: 'Zenith Apparel Co.', contactEmail: 'accounts@zenithapparel.example', contactPhone: '+91 90000 44556', gstNumber: '24BBBBB1111B2Z6', address: 'Surat, Gujarat, IN', status: 'ACTIVE', planId: 2, createdAt: '2025-03-04T00:00:00Z' },
  { id: 3, name: 'BlueWave Electronics', contactEmail: 'hello@bluewave.example', contactPhone: '+91 88888 77665', gstNumber: '29CCCCC2222C3Z7', address: 'Bengaluru, KA, IN', status: 'SUSPENDED', planId: 1, createdAt: '2025-05-20T00:00:00Z' },
]);

export const companyService = {
  async list() { return DEMO_MODE ? companyDemo.list() : companyDemo.list(); /* no real endpoint yet — see note above */ },
  async create(payload) { return companyDemo.create({ ...payload, createdAt: new Date().toISOString() }); },
  async update(id, payload) { return companyDemo.update(id, payload); },
  async remove(id) { return companyDemo.remove(id); },
};

// ─── Tenant Management ──────────────────────────────────────────────────
// Backend gap, same as Companies: multi-tenancy doesn't exist in the
// backend yet (no tenant column/filter anywhere in the schema). This models
// what the control plane would show once it does — one tenant workspace
// per company, with a subdomain and provisioning status.
const tenantDemo = createDemoStore('sm_demo_tenants_v1', [
  { id: 1, companyId: 1, subdomain: 'shopmart', region: 'ap-south-1', status: 'ACTIVE', createdAt: '2025-01-12T00:00:00Z' },
  { id: 2, companyId: 2, subdomain: 'zenith', region: 'ap-south-1', status: 'ACTIVE', createdAt: '2025-03-05T00:00:00Z' },
  { id: 3, companyId: 3, subdomain: 'bluewave', region: 'ap-south-1', status: 'SUSPENDED', createdAt: '2025-05-21T00:00:00Z' },
]);

export const tenantService = {
  async list() { return tenantDemo.list(); },
  async create(payload) { return tenantDemo.create({ ...payload, createdAt: new Date().toISOString() }); },
  async update(id, payload) { return tenantDemo.update(id, payload); },
  async remove(id) { return tenantDemo.remove(id); },
};

// ─── Subscription & Plan Management ─────────────────────────────────────
const planDemo = createDemoStore('sm_demo_plans_v1', [
  { id: 1, name: 'Starter', priceMonthly: 0, maxAdmins: 2, maxProducts: 100, features: ['Storefront', 'Basic reports'] },
  { id: 2, name: 'Growth', priceMonthly: 2999, maxAdmins: 10, maxProducts: 2000, features: ['Storefront', 'Advanced reports', 'Bulk import', 'Coupons'] },
  { id: 3, name: 'Enterprise', priceMonthly: 9999, maxAdmins: 50, maxProducts: 50000, features: ['Everything in Growth', 'Priority support', 'Custom SLA', 'Multi-vendor'] },
]);

const subscriptionDemo = createDemoStore('sm_demo_subscriptions_v1', [
  { id: 1, companyId: 1, planId: 3, billingCycle: 'YEARLY', status: 'ACTIVE', currentPeriodEnd: '2027-01-12T00:00:00Z', mrr: 9999 },
  { id: 2, companyId: 2, planId: 2, billingCycle: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '2026-08-05T00:00:00Z', mrr: 2999 },
  { id: 3, companyId: 3, planId: 1, billingCycle: 'MONTHLY', status: 'PAST_DUE', currentPeriodEnd: '2026-06-21T00:00:00Z', mrr: 0 },
]);

export const planService = {
  async list() { return planDemo.list(); },
  async create(payload) { return planDemo.create(payload); },
  async update(id, payload) { return planDemo.update(id, payload); },
  async remove(id) { return planDemo.remove(id); },
};

export const subscriptionService = {
  async list() { return subscriptionDemo.list(); },
  async create(payload) { return subscriptionDemo.create(payload); },
  async update(id, payload) { return subscriptionDemo.update(id, payload); },
  async cancel(id) { return subscriptionDemo.update(id, { status: 'CANCELED' }); },
};

// ─── System Health ───────────────────────────────────────────────────────
// Tries a real Spring Boot Actuator health check first (only works if the
// `spring-boot-starter-actuator` dependency is on the backend AND
// `/actuator/health` is exposed — neither is confirmed). Falls back to a
// simple reachability ping against a known real endpoint, then to fully
// synthetic demo data if the API can't be reached at all. Response-time
// history is always synthetic (no backend metrics endpoint exists) — labeled
// as such in the UI rather than presented as real telemetry.
export const systemHealthService = {
  async check() {
    const startedAt = Date.now();
    try {
      const { data } = await api.get('/actuator/health', { timeout: 5000 });
      return {
        source: 'actuator',
        apiUp: true,
        dbUp: data?.components?.db?.status === 'UP' || data?.status === 'UP',
        latencyMs: Date.now() - startedAt,
        raw: data,
      };
    } catch {
      // Actuator likely isn't exposed — fall back to pinging a real,
      // known-public endpoint just to confirm the API itself is reachable.
      try {
        const pingStart = Date.now();
        await api.get('/categories', { timeout: 5000 });
        return { source: 'ping', apiUp: true, dbUp: true, latencyMs: Date.now() - pingStart, raw: null };
      } catch {
        return { source: 'unreachable', apiUp: false, dbUp: false, latencyMs: null, raw: null };
      }
    }
  },
};

// ─── Platform Settings ───────────────────────────────────────────────────
// Bug fix: SystemSettings.jsx previously only held values in local React
// state and never persisted them anywhere — every save() was a fake
// 600ms timeout + a success toast, so settings silently reset to defaults
// on every refresh. This gives it real persistence (localStorage now;
// swap for a real `GET/PUT /super-admin/settings` the moment that
// endpoint exists — same "add it, refresh, it's missing" fix already
// applied to Brands/Categories/Blogs via demoCrud.js).
const SETTINGS_KEY = 'sm_platform_settings_v1';
const DEFAULT_SETTINGS = {
  general: { platformName: 'ShopMart', supportEmail: 'support@shopmart.com', currency: 'INR' },
  flags: {
    maintenance: false,
    registrationOpen: true,
    requireProductApproval: true,
    adminAttendance: true,
    twoFactor: false,
  },
  saas: {
    selfServiceSignup: false,
    trialDays: 14,
    enforceplanLimits: true,
    multiTenantMode: false,
  },
};

export const platformSettingsService = {
  async get() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  },
  async save(settings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* storage unavailable */ }
    return settings;
  },
};
