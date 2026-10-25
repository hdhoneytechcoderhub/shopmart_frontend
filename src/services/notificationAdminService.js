import { createDemoStore } from './demoCrud';
import { analyticsService } from './analyticsService';

// Backend gap: there's no notification-template, campaign, or delivery
// infrastructure on the backend today (no email/push provider integration,
// no template table, no campaign job runner). Everything below is a fully
// functional local control surface — real CRUD, real "sending" state
// machine — with delivery *statistics* simulated (clearly labeled) since
// there's no real email/push gateway to report real opens/clicks from.
// See the delivery notes for the backend pieces this would need.

const CHANNELS = ['IN_APP', 'EMAIL', 'PUSH'];
const AUDIENCES = ['ALL', 'NEW_CUSTOMERS', 'ACTIVE_CUSTOMERS', 'ADMINS'];

const templateDemo = createDemoStore('sm_demo_notif_templates_v1', [
  {
    id: 1, name: 'Order shipped', channel: 'EMAIL', category: 'ORDER',
    subject: 'Your ShopMart order #{{orderId}} has shipped!',
    title: 'Order shipped', body: 'Hi {{customerName}}, your order #{{orderId}} is on its way and should arrive by {{eta}}. Track it anytime from your dashboard.',
    updatedAt: new Date(Date.now() - 5 * 24 * 3600e3).toISOString(),
  },
  {
    id: 2, name: 'Flash sale', channel: 'PUSH', category: 'OFFER',
    subject: '', title: '⚡ Flash sale is live!', body: 'Up to 40% off for the next 6 hours, {{customerName}}. Don\'t miss out.',
    updatedAt: new Date(Date.now() - 2 * 24 * 3600e3).toISOString(),
  },
  {
    id: 3, name: 'Welcome message', channel: 'IN_APP', category: 'ACCOUNT',
    subject: '', title: 'Welcome to ShopMart, {{customerName}}!', body: 'Thanks for joining. Explore your personalized recommendations and grab 10% off your first order with WELCOME10.',
    updatedAt: new Date(Date.now() - 10 * 24 * 3600e3).toISOString(),
  },
]);

export const notifTemplateService = {
  CHANNELS,
  async list() { return templateDemo.list(); },
  async create(payload) { return templateDemo.create({ ...payload, updatedAt: new Date().toISOString() }); },
  async update(id, payload) { return templateDemo.update(id, { ...payload, updatedAt: new Date().toISOString() }); },
  async remove(id) { return templateDemo.remove(id); },
};

// Renders {{variable}} placeholders against a sample/real context — used for
// the live preview pane in the template editor.
export function renderTemplate(str, ctx) {
  return (str || '').replace(/{{\s*(\w+)\s*}}/g, (_, key) => (ctx[key] ?? `{{${key}}}`));
}

export const SAMPLE_CONTEXT = { customerName: 'Aarav Shah', orderId: 'SM-100238', eta: '12 Jul 2026', couponCode: 'SAVE20' };

const campaignDemo = createDemoStore('sm_demo_campaigns_v1', [
  {
    id: 1, name: 'July welcome push', templateId: 3, channel: 'IN_APP', audience: 'NEW_CUSTOMERS',
    status: 'SENT', scheduledAt: null, sentAt: new Date(Date.now() - 4 * 24 * 3600e3).toISOString(),
    stats: { audienceSize: 210, sent: 210, delivered: 206, opened: 158, clicked: 61, failed: 4 },
  },
  {
    id: 2, name: 'Flash sale blast', templateId: 2, channel: 'PUSH', audience: 'ACTIVE_CUSTOMERS',
    status: 'SENT', scheduledAt: null, sentAt: new Date(Date.now() - 12 * 3600e3).toISOString(),
    stats: { audienceSize: 1840, sent: 1840, delivered: 1795, opened: 902, clicked: 311, failed: 45 },
  },
]);

// Simulated send: since there's no real email/push gateway, "sending"
// resolves immediately with plausible delivery/open/click rates derived from
// audience size — clearly not real telemetry, but lets the whole
// create → send → track-stats flow be exercised end to end.
function simulateStats(audienceSize) {
  const delivered = Math.round(audienceSize * (0.94 + Math.random() * 0.05));
  const opened = Math.round(delivered * (0.35 + Math.random() * 0.35));
  const clicked = Math.round(opened * (0.2 + Math.random() * 0.3));
  return { audienceSize, sent: audienceSize, delivered, opened, clicked, failed: audienceSize - delivered };
}

async function resolveAudienceSize(audience) {
  try {
    const stats = await analyticsService.getCustomerAnalytics();
    const total = stats?.totalCustomers || 500;
    if (audience === 'NEW_CUSTOMERS') return Math.round(total * 0.12);
    if (audience === 'ACTIVE_CUSTOMERS') return stats?.activeCustomers || Math.round(total * 0.6);
    if (audience === 'ADMINS') return 8;
    return total;
  } catch {
    return 500;
  }
}

export const campaignService = {
  AUDIENCES,
  async list() { return campaignDemo.list(); },

  async createDraft(payload) {
    return campaignDemo.create({ ...payload, status: 'DRAFT', scheduledAt: null, sentAt: null, stats: null });
  },

  async schedule(id, scheduledAt) {
    return campaignDemo.update(id, { status: 'SCHEDULED', scheduledAt });
  },

  // Covers both "Broadcast now" and sending a previously-drafted/scheduled
  // campaign — same underlying action.
  async sendNow(id) {
    const campaign = campaignDemo.list().find((c) => c.id === id);
    if (!campaign) throw new Error('Campaign not found');
    const audienceSize = await resolveAudienceSize(campaign.audience);
    const stats = simulateStats(audienceSize);
    return campaignDemo.update(id, { status: 'SENT', sentAt: new Date().toISOString(), stats });
  },

  async createAndSendNow(payload) {
    const draft = await campaignDemo.create({ ...payload, status: 'DRAFT', scheduledAt: null, sentAt: null, stats: null });
    return campaignService.sendNow(draft.id);
  },

  async remove(id) { return campaignDemo.remove(id); },
};
