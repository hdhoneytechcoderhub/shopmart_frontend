import api, { DEMO_MODE } from './api';

// Real endpoint: POST /admin/files/upload (multipart, field name "file") → { url, storageKey }.
// In demo mode (or if the backend call fails on a network error) we fall back
// to a local object URL so the picker/preview still works standalone — that
// URL only lives in this browser tab and won't resolve for anyone else, so
// it's clearly a demo-only stand-in, not a real hosted image.
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024; // 2MB, matches the backend limit
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const mediaService = {
  async upload(file) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPEG, PNG, WEBP, or GIF images are allowed');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error('File exceeds the 2MB limit');
    }
    if (DEMO_MODE) {
      return { url: URL.createObjectURL(file), filename: file.name, sizeBytes: file.size, demo: true };
    }
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/admin/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      return data;
    } catch (err) {
      if (!err?.response) return { url: URL.createObjectURL(file), filename: file.name, sizeBytes: file.size, demo: true };
      throw err;
    }
  },
};

export default mediaService;
