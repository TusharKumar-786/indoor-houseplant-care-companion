import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

let userToken: string;
let user2Token: string;
let createdPostSlug: string;

beforeAll(async () => {
  // Login User 1
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tushar@example.com', password: 'password123' });
  if (loginRes.status === 200) {
    userToken = loginRes.body.data.token;
  }

  // Login User 2
  const user2Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@example.com', password: 'password123' });
  if (user2Res.status === 200) {
    user2Token = user2Res.body.data.token;
  }
});

afterAll(async () => {
  await pool.end();
});

describe('New Features Test Suite', () => {
  describe('1. Smart Suggestions Endpoint', () => {
    it('GET /api/suggestions returns 401 for unauthorized requests', async () => {
      const res = await request(app).get('/api/suggestions');
      expect(res.status).toBe(401);
    });

    it('GET /api/suggestions returns suggestions array for authenticated user', async () => {
      if (!userToken) return;
      const res = await request(app)
        .get('/api/suggestions')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Contact Messages Endpoint', () => {
    it('POST /api/contact validates missing fields and returns 400', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({ name: 'Tester', email: 'invalid-email' });
      expect(res.status).toBe(400);
    });

    it('POST /api/contact stores valid inquiry and returns 201', async () => {
      const res = await request(app)
        .post('/api/contact')
        .send({
          name: 'Priya Sharma',
          email: 'priya@example.com',
          message: 'I really love the apartment window guidance feature on LeafPulse.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('name', 'Priya Sharma');
    });
  });

  describe('3. Plant Library Catalogue', () => {
    it('GET /api/plant-library returns curated houseplants', async () => {
      const res = await request(app).get('/api/plant-library');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/plant-library supports search query filter', async () => {
      const res = await request(app).get('/api/plant-library?search=Monstera');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('4. Care Stories & Community Blog', () => {
    it('GET /api/blog returns public articles without login', async () => {
      const res = await request(app).get('/api/blog');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/blog rejects unauthenticated requests with 401', async () => {
      const res = await request(app)
        .post('/api/blog')
        .send({ title: 'Test Article', body: 'Some body text for article test...' });
      expect(res.status).toBe(401);
    });

    it('POST /api/blog creates article for authenticated user', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/blog')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Spring Soil Aeration and Gentle Pruning Secrets',
          body: 'As sunlight hours increase during early spring, root balls experience a surge of hormonal activity. Gently loosen compacted surface soil with a chopstick.',
          cover_image_url: '/images/plants/monstera.webp',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('slug');
      createdPostSlug = res.body.data.slug;
    });

    it('GET /api/blog/:slug retrieves single article by slug', async () => {
      if (!createdPostSlug) return;
      const res = await request(app).get(`/api/blog/${createdPostSlug}`);
      expect(res.status).toBe(200);
      expect(res.body.data.slug).toBe(createdPostSlug);
    });

    it('PUT /api/blog/:slug forbids non-author with 403', async () => {
      if (!createdPostSlug || !user2Token) return;
      const res = await request(app)
        .put(`/api/blog/${createdPostSlug}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Unauthorized Edit Attempt',
          body: 'Trying to alter another gardeners post without ownership permission.',
        });
      expect(res.status).toBe(403);
    });

    it('PUT /api/blog/:slug allows author to update article', async () => {
      if (!createdPostSlug || !userToken) return;
      const res = await request(app)
        .put(`/api/blog/${createdPostSlug}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Spring Soil Aeration and Gentle Pruning Secrets (Updated)',
          body: 'Updated advice: always sterilize pruning shear blades with 70% isopropyl alcohol before making stem cuts.',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.title).toContain('(Updated)');
    });

    it('DELETE /api/blog/:slug removes article for owner', async () => {
      if (!createdPostSlug || !userToken) return;
      const res = await request(app)
        .delete(`/api/blog/${createdPostSlug}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('5. Profile Avatar Endpoints', () => {
    it('DELETE /api/auth/avatar resets avatar to null', async () => {
      if (!userToken) return;
      const res = await request(app)
        .delete('/api/auth/avatar')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.avatar_url).toBeNull();
    });
  });
});
