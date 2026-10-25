/**
 * machineService.js
 * CRUD for Machines. Falls back to demo data when DEMO_MODE=true.
 *
 * Real backend is MachineController at /machines (not /admin/machines — that
 * route never existed, which is why every call here was failing). It also
 * models a machine as a catalog listing (name, modelNumber, brand,
 * description, images) — there's no status/location/purchaseDate field on
 * the backend at all. Those three map to nothing and won't persist; flagging
 * rather than silently dropping them without explanation. `model` here maps
 * to the backend's `modelNumber`.
 */
import api, { DEMO_MODE } from './api';

const DEMO_MACHINES = [
  { id: 1, name: 'CNC Milling Machine', model: 'CM-3000', status: 'Active', location: 'Unit A', purchaseDate: '2023-01-15' },
  { id: 2, name: 'Hydraulic Press', model: 'HP-500', status: 'Active', location: 'Unit B', purchaseDate: '2022-08-10' },
  { id: 3, name: 'Laser Cutter', model: 'LC-200', status: 'Maintenance', location: 'Unit A', purchaseDate: '2023-05-20' },
  { id: 4, name: 'Injection Molder', model: 'IM-1200', status: 'Inactive', location: 'Unit C', purchaseDate: '2021-11-30' },
];

let demoMachines = [...DEMO_MACHINES];
const useMock = (err) => { if (err?.response) throw err; return true; };

const toBackend = (payload) => ({
  name: payload.name,
  modelNumber: payload.model,
  brand: payload.brand,
  description: payload.description,
  images: payload.images || [],
});

// status/location/purchaseDate come back untouched from local form state
// (spread over the saved record below) purely so the table doesn't blank
// them out mid-session — they're not actually persisted server-side.
const fromBackend = (p, formExtras = {}) => ({
  ...formExtras,
  ...p,
  model: p.modelNumber,
});

export const machineService = {
  async getMachines() {
    if (DEMO_MODE) return [...demoMachines];
    try {
      const { data } = await api.get('/machines', { params: { size: 200 } });
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map((m) => fromBackend(m));
    } catch (err) { if (useMock(err)) return [...demoMachines]; }
    return [...demoMachines];
  },

  async createMachine(payload) {
    if (DEMO_MODE) {
      const item = { ...payload, id: Date.now() };
      demoMachines = [item, ...demoMachines];
      return item;
    }
    const { data } = await api.post('/machines', toBackend(payload));
    return fromBackend(data, payload);
  },

  async updateMachine(id, payload) {
    if (DEMO_MODE) {
      demoMachines = demoMachines.map((m) => (m.id === id ? { ...m, ...payload } : m));
      return { ...payload, id };
    }
    const { data } = await api.put(`/machines/${id}`, toBackend(payload));
    return fromBackend(data, payload);
  },

  async deleteMachine(id) {
    if (DEMO_MODE) { demoMachines = demoMachines.filter((m) => m.id !== id); return { success: true }; }
    const { data } = await api.delete(`/machines/${id}`);
    return data ?? { success: true };
  },
};
