export const GalleryImage = {
  async list(order = "-created_date") {
    // TODO: Replace with real data source; returning empty list for now
    return [];
  },
  async create(payload) {
    // TODO: Persist to your backend or storage; no-op for now
    return { ok: true, id: Date.now(), ...payload };
  },
};
