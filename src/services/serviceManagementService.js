/**
 * serviceManagementService.js
 * CRUD for Services (not to be confused with JS service modules).
 * Falls back to demo data when DEMO_MODE=true.
 *
 * Real backend is ServiceCatalogController at /services (not /admin/services
 * — that route never existed). It also uses `active: boolean`, not
 * `status: 'Active'/'Inactive'` — translated below.
 */
import api, { DEMO_MODE } from './api';

const DEMO_SERVICES = [
  { id: 1, name: 'Express Delivery', description: 'Same-day delivery within city limits', price: 99, status: 'Active' },
  { id: 2, name: 'Installation Support', description: 'Professional on-site installation', price: 499, status: 'Active' },
  { id: 3, name: 'Extended Warranty', description: '2-year extended warranty plan', price: 1299, status: 'Active' },
  { id: 4, name: 'Product Customization', description: 'Custom engraving and packaging', price: 299, status: 'Inactive' },
];

let demoServices = [...DEMO_SERVICES];
const useMock = (err) => { if (err?.response) throw err; return true; };

const toBackend = (payload) => ({
  name: payload.name,
  description: payload.description,
  price: Number(payload.price) || 0,
  durationMinutes: payload.durationMinutes,
  categoryId: payload.categoryId,
  imageUrl: payload.imageUrl,
  active: payload.status ? payload.status === 'Active' : true,
});

const fromBackend = (p) => ({
  ...p,
  status: p.active ? 'Active' : 'Inactive',
});

export const serviceManagementService = {
  async getServices() {
    if (DEMO_MODE) return [...demoServices];
    try {
      const { data } = await api.get('/services');
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map(fromBackend);
    } catch (err) { if (useMock(err)) return [...demoServices]; }
    return [...demoServices];
  },

  async createService(payload) {
    if (DEMO_MODE) {
      const item = { ...payload, id: Date.now() };
      demoServices = [item, ...demoServices];
      return item;
    }
    const { data } = await api.post('/services', toBackend(payload));
    return fromBackend(data);
  },

  async updateService(id, payload) {
    if (DEMO_MODE) {
      demoServices = demoServices.map((s) => (s.id === id ? { ...s, ...payload } : s));
      return { ...payload, id };
    }
    const { data } = await api.put(`/services/${id}`, toBackend(payload));
    return fromBackend(data);
  },

  async deleteService(id) {
    if (DEMO_MODE) { demoServices = demoServices.filter((s) => s.id !== id); return { success: true }; }
    const { data } = await api.delete(`/services/${id}`);
    return data ?? { success: true };
  },
};
