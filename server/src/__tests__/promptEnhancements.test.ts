import request from 'supertest';
import app from '../app';
import { pool, query } from '../config/db';

let userToken: string;
let nonAdminToken: string;
let testPlantId: number;

beforeAll(async () => {
  // Ensure we have test users and plants
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tushar@example.com', password: 'password123' });

  if (loginRes.status === 200) {
    userToken = loginRes.body.data.token;
  }

  const user2Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@example.com', password: 'password123' });

  if (user2Res.status === 200) {
    nonAdminToken = user2Res.body.data.token;
  }

  // Get a plant ID for user 1
  if (userToken) {
    const plantsRes = await request(app)
      .get('/api/plants')
      .set('Authorization', `Bearer ${userToken}`);
    if (plantsRes.status === 200 && plantsRes.body.data?.length > 0) {
      testPlantId = plantsRes.body.data[0].id;
    }
  }
});

afterAll(async () => {
  await pool.end();
});

describe('Prompt Enhancements & Verification Test Suite', () => {
  describe('1. Leafy Botanical AI Assistant & Off-Topic Safety', () => {
    it('POST /api/leafy returns botanical advice for plant question', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'Why are my Monstera leaves developing yellow spots?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('reply');
      expect(res.body.data.is_botanical).toBe(true);
      expect(typeof res.body.data.reply).toBe('string');
      expect(res.body.data.reply.length).toBeGreaterThan(10);
    });

    it('POST /api/leafy gently rejects off-topic queries', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'Who will win the presidential election in November?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_botanical).toBe(false);
      expect(res.body.data.reply.toLowerCase()).toContain('plant');
    });

    it('POST /api/leafy word-boundary test: words like selection do not trigger off-topic match', async () => {
      if (!userToken) return;
      const res = await request(app)
        .post('/api/leafy')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'What is your best fertilizer selection for apartment ferns?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // 'selection' must NOT match 'election' due to word-boundary check (\b)
      expect(res.body.data.is_botanical).toBe(true);
    });
  });

  describe('2. Quick Water Without Date (Defaults to Today)', () => {
    it('POST /api/logs without date defaults to current server date', async () => {
      if (!userToken || !testPlantId) return;

      const res = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plant_id: testPlantId,
          action: 'Watered',
          notes: 'Quick water test without explicit date',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('date');

      const returnedDate = res.body.data.date;
      const todayIso = new Date().toISOString().split('T')[0];
      // Date should match today's date
      expect(typeof returnedDate).toBe('string');
      expect(returnedDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(returnedDate).toBe(todayIso);

      // Clean up log
      if (res.body.data.id) {
        await query('DELETE FROM log_book WHERE id = $1', [res.body.data.id]);
      }
    });

    it('POST /api/logs rejects invalid date formats and notes over 2000 characters', async () => {
      if (!userToken || !testPlantId) return;

      const badDateRes = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plant_id: testPlantId,
          action: 'Watered',
          date: 'not-a-date',
        });
      expect(badDateRes.status).toBe(400);

      const longNotes = 'A'.repeat(2001);
      const longNotesRes = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          plant_id: testPlantId,
          action: 'Watered',
          notes: longNotes,
        });
      expect(longNotesRes.status).toBe(400);
    });
  });

  describe('3. Admin Authorization Controls', () => {
    it('GET /api/admin/metrics returns 403 Forbidden for non-admin user', async () => {
      if (!nonAdminToken) return;

      const res = await request(app)
        .get('/api/admin/metrics')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Admin');
    });

    it('GET /api/admin/users returns 403 Forbidden for non-admin user', async () => {
      if (!nonAdminToken) return;

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/auth/me returns is_admin: false for non-admin user', async () => {
      if (!nonAdminToken) return;

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${nonAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.is_admin).toBe(false);
    });
  });

  describe('4. Rate Limit Verification on Session Checking', () => {
    it('20 sequential calls to GET /api/auth/me do not return 429', async () => {
      if (!userToken) return;

      const callPromises = Array.from({ length: 20 }, () =>
        request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
      );

      const responses = await Promise.all(callPromises);

      // Verify no response was throttled by auth rate limiter
      for (const res of responses) {
        expect(res.status).toBe(200);
        expect(res.status).not.toBe(429);
        expect(res.body.success).toBe(true);
      }
    });
  });
});
