import api from './api';
import { mockReviews } from './mockData';

// Backend ReviewRequest/ReviewResponse use rating/title/comment and userName
// — this UI works in rating/title/body and author. Translated both ways so
// a submitted review doesn't silently lose its text (comment was never sent
// at all before, and the response's userName/comment never matched what the
// list rendered, so even a successful submission looked blank).
const fromApi = (r) => (r ? { ...r, body: r.comment, author: r.userName } : r);
const toApi = (payload) => ({ rating: payload.rating, title: payload.title, comment: payload.body });

export const reviewService = {
  async list(productId) {
    try {
      const { data } = await api.get(`/products/${productId}/reviews`);
      const list = Array.isArray(data) ? data : data?.content || [];
      return list.map(fromApi);
    } catch (err) {
      if (!err?.response) return mockReviews(productId);
      throw err;
    }
  },
  async submit(productId, payload) {
    try {
      const { data } = await api.post(`/products/${productId}/reviews`, toApi(payload));
      return fromApi(data) || { ...payload, id: `local-${Date.now()}`, date: new Date().toISOString(), helpful: 0 };
    } catch (err) {
      if (!err?.response) {
        // Demo fallback: echo a constructed review.
        return {
          id: `local-${Date.now()}`,
          author: payload.author || 'You',
          rating: payload.rating,
          title: payload.title,
          body: payload.body,
          date: new Date().toISOString(),
          helpful: 0,
        };
      }
      throw err;
    }
  },
};

// Build a rating distribution + average from a list of reviews.
export const summarize = (reviews = []) => {
  const total = reviews.length;
  const dist = [0, 0, 0, 0, 0]; // index 0 => 1 star … index 4 => 5 stars
  let sum = 0;
  reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating)));
    dist[star - 1] += 1;
    sum += r.rating;
  });
  return {
    total,
    average: total ? (sum / total) : 0,
    dist, // counts for 1..5
  };
};
