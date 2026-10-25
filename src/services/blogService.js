import api, { DEMO_MODE } from './api';
import { adminBlogs } from './adminMock';
import { createDemoStore } from './demoCrud';

// Blogs. AdminBlogs.jsx previously had zero service wiring at all — every
// create/edit/delete only touched React state, so a refresh always reset to
// the static adminBlogs seed. This gives it real backend calls plus a
// persisted demo fallback.
//
// Backend shape: { title, excerpt, content, coverImage, status: 'DRAFT'|'PUBLISHED', tags }
// — there's no `author` field on the backend at all (it derives the author
// from the logged-in admin's user id via authorId). The admin form's `author`
// text field is demo-only until the backend adds a displayable author name.
const asArray = (d) => (Array.isArray(d) ? d : d?.content || []);
const blogDemo = createDemoStore('sm_demo_blogs_v1', adminBlogs);

const toBackend = (payload) => ({
  title: payload.title,
  excerpt: payload.excerpt,
  content: payload.content || payload.excerpt || '',
  coverImage: payload.coverImage,
  status: (payload.status || 'Draft').toUpperCase(),
  tags: payload.tags || [],
});

const fromBackend = (p) => ({
  ...p,
  status: p.status === 'PUBLISHED' ? 'Published' : 'Draft',
  date: p.publishedAt || p.createdAt,
});

const fromSummary = (p) => ({
  ...p,
  date: p.publishedAt,
  cover: p.coverImage,
  tag: p.tags?.[0],
});

const fromDetail = (p) => ({
  ...p,
  date: p.publishedAt,
  cover: p.coverImage,
  tag: p.tags?.[0],
});

export const blogService = {
  // Public: published posts only (GET /blogs). The public Blog page previously
  // rendered hardcoded placeholder posts and never called this at all — real
  // posts created in the admin panel had no way to reach the storefront.
  listPublished: async ({ tag, page = 0, size = 20 } = {}) => {
    if (DEMO_MODE) {
      const list = blogDemo.list().filter((p) => p.status === 'Published' && (!tag || p.tags?.includes(tag)));
      return { content: list.map(fromSummary), totalPages: 1, totalElements: list.length };
    }
    try {
      const { data } = await api.get('/blogs', { params: { tag: tag || undefined, page, size } });
      const content = asArray(data).map(fromSummary);
      return { content, totalPages: data?.totalPages ?? 1, totalElements: data?.totalElements ?? content.length };
    } catch (err) {
      if (!err?.response) {
        const list = blogDemo.list().filter((p) => p.status === 'Published');
        return { content: list.map(fromSummary), totalPages: 1, totalElements: list.length };
      }
      throw err;
    }
  },

  // Public: single post by slug (GET /blogs/{slug}) — 404s for anything not
  // PUBLISHED, so this can't be used to preview drafts.
  getBySlug: async (slug) => {
    if (DEMO_MODE) {
      const post = blogDemo.list().find((p) => p.slug === slug && p.status === 'Published');
      return post ? fromDetail(post) : null;
    }
    try {
      const { data } = await api.get(`/blogs/${slug}`);
      return fromDetail(data);
    } catch (err) {
      if (!err?.response) {
        const post = blogDemo.list().find((p) => p.slug === slug && p.status === 'Published');
        return post ? fromDetail(post) : null;
      }
      throw err;
    }
  },

  list: async () => {
    if (DEMO_MODE) return blogDemo.list();
    try {
      const { data } = await api.get('/blogs/admin/all', { params: { size: 200 } });
      return asArray(data).map(fromBackend);
    } catch (err) {
      if (!err?.response) return blogDemo.list();
      throw err;
    }
  },
  create: async (payload) => {
    if (DEMO_MODE) return blogDemo.create({ ...payload, date: new Date().toISOString() });
    const { data } = await api.post('/blogs', toBackend(payload));
    return fromBackend(data);
  },
  update: async (id, payload) => {
    if (DEMO_MODE) return blogDemo.update(id, payload);
    const { data } = await api.put(`/blogs/${id}`, toBackend(payload));
    return fromBackend(data);
  },
  remove: async (id) => {
    if (DEMO_MODE) return blogDemo.remove(id);
    await api.delete(`/blogs/${id}`);
    return { success: true };
  },
};

export default blogService;
