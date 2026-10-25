// ──────────────────────────────────────────────────────────────────────────
// Generic localStorage-backed list store for demo mode.
//
// Why this exists: several admin screens (Brands, Blogs, and previously
// Coupons/Categories) only mutated React state on create/update/delete. That
// "worked" until the next refresh, at which point the component re-seeded
// from a static mock array and the change was gone — exactly the
// "add it, refresh, it's missing" bug reported across several modules.
// This gives any demo list real persistence with almost no code per module.
// ──────────────────────────────────────────────────────────────────────────

export function createDemoStore(storageKey, seed = []) {
  const read = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw == null) return [...seed];
      return JSON.parse(raw);
    } catch {
      return [...seed];
    }
  };

  const write = (list) => {
    try { localStorage.setItem(storageKey, JSON.stringify(list)); } catch { /* storage unavailable */ }
    return list;
  };

  return {
    list: () => read(),

    create: (payload) => {
      const list = read();
      const nextId = list.reduce((max, x) => Math.max(max, Number(x.id) || 0), 0) + 1;
      const item = { ...payload, id: nextId };
      write([...list, item]);
      return item;
    },

    update: (id, payload) => {
      const list = read();
      const idx = list.findIndex((x) => String(x.id) === String(id));
      if (idx === -1) return null;
      const updated = { ...list[idx], ...payload, id: list[idx].id };
      const next = [...list];
      next[idx] = updated;
      write(next);
      return updated;
    },

    remove: (id) => {
      write(read().filter((x) => String(x.id) !== String(id)));
      return { success: true };
    },
  };
}
