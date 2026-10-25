import { createDemoStore } from './demoCrud';

// Backend gap: there's no server-side session registry (the JWT refresh flow
// is stateless — the backend doesn't track which devices hold a valid
// refresh token, so it can't list or revoke them individually). Everything
// below is a local, per-browser approximation:
//  - Login history is REAL for logins that happen in this browser (appended
//    by authService.login on every successful sign-in) plus a few seeded
//    entries so the screen isn't empty on first use.
//  - "Active sessions" can only truly observe the current browser/tab — the
//    other rows are illustrative seed data, clearly not something this
//    frontend could actually know without a backend session table.
// See the delivery notes for the backend session-registry endpoints this
// would need to become fully real (list/revoke sessions server-side).

function parseUserAgent(ua = navigator.userAgent) {
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Mac OS/.test(ua) ? 'macOS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  const device = /Mobile/.test(ua) ? 'Mobile' : 'Desktop';
  return { browser, os, device };
}

const CURRENT_DEVICE_ID = 'this-device';

const sessionsDemo = createDemoStore('sm_demo_sessions_v1', [
  { id: 'seed-1', device: 'Mobile', os: 'Android', browser: 'Chrome', location: 'Ahmedabad, IN', lastActiveAt: new Date(Date.now() - 2 * 3600e3).toISOString(), current: false },
  { id: 'seed-2', device: 'Desktop', os: 'Windows', browser: 'Edge', location: 'Mumbai, IN', lastActiveAt: new Date(Date.now() - 26 * 3600e3).toISOString(), current: false },
]);

const loginHistoryDemo = createDemoStore('sm_demo_login_history_v1', [
  { id: 'seed-1', at: new Date(Date.now() - 26 * 3600e3).toISOString(), device: 'Desktop', os: 'Windows', browser: 'Chrome', location: 'Ahmedabad, IN', status: 'SUCCESS' },
  { id: 'seed-2', at: new Date(Date.now() - 3 * 24 * 3600e3).toISOString(), device: 'Mobile', os: 'Android', browser: 'Chrome', location: 'Ahmedabad, IN', status: 'SUCCESS' },
]);

export const sessionService = {
  async getActiveSessions() {
    const seeded = sessionsDemo.list();
    const { browser, os, device } = parseUserAgent();
    const currentDevice = { id: CURRENT_DEVICE_ID, device, os, browser, location: 'This device', lastActiveAt: new Date().toISOString(), current: true };
    return [currentDevice, ...seeded];
  },

  async revokeSession(id) {
    if (id === CURRENT_DEVICE_ID) throw new Error("Can't revoke the session you're currently using — log out instead.");
    // Real endpoint would be DELETE /users/me/sessions/{id}, invalidating that
    // device's refresh token server-side. No such endpoint exists yet, so
    // this only removes the local (seed/demo) record.
    return sessionsDemo.remove(id);
  },

  async revokeAllOtherSessions() {
    sessionsDemo.list().forEach((s) => sessionsDemo.remove(s.id));
    return { success: true };
  },

  // Called by authService.login() on every successful sign-in so history is
  // real for anything that happens during this project's actual use.
  recordLogin(status = 'SUCCESS') {
    const { browser, os, device } = parseUserAgent();
    loginHistoryDemo.create({ at: new Date().toISOString(), device, os, browser, location: 'This device', status });
  },

  async getLoginHistory() {
    return loginHistoryDemo.list().sort((a, b) => new Date(b.at) - new Date(a.at));
  },
};

export default sessionService;
