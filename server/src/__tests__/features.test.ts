import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

let userToken: string;
let testPlantId: number;
let createdJournalId: number;

beforeAll(async () => {
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tushar@example.com', password: 'password123' });
  expect(loginRes.status).toBe(200);
  userToken = loginRes.body.data.token;

  // Fetch plant 1 (Money Plant)
  const plantsRes = await request(app)
    .get('/api/plants')
    .set('Authorization', `Bearer ${userToken}`);
  expect(plantsRes.status).toBe(200);
  testPlantId = plantsRes.body.data[0].id;
});

afterAll(async () => {
  await pool.end();
});

describe('New Features & Security Verification', () => {
  describe('1. Growth Journal Feature', () => {
    it('POST /api/plants/:id/journal creates a new growth entry', async () => {
      const res = await request(app)
        .post(`/api/plants/${testPlantId}/journal`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          date: '2026-11-19',
          notes: 'New vibrant split leaf emerged, measuring 25.4 cm in total height.',
          height_cm: 25.4,
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notes).toContain('New vibrant split leaf');
      createdJournalId = res.body.data.id;
    });

    it('GET /api/plants/:id/journal retrieves journal history', async () => {
      const res = await request(app)
        .get(`/api/plants/${testPlantId}/journal`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('height_cm');
    });

    it('DELETE /api/plants/:id/journal/:entryId deletes an entry', async () => {
      const res = await request(app)
        .delete(`/api/plants/${testPlantId}/journal/${createdJournalId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('2. Plant Health Assistant Diagnostic Engine', () => {
    it('POST /api/health-assistant returns accurate diagnosis for overwatering symptoms', async () => {
      const res = await request(app)
        .post('/api/health-assistant')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symptoms: ['yellow_leaves', 'drooping'],
          plant_nickname: 'Money Plant',
          plant_species: 'Epipremnum aureum',
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.diagnosis.issue).toContain('Overwatering');
      expect(res.body.data.diagnosis.primary_actions.length).toBeGreaterThan(0);
    });

    it('POST /api/health-assistant returns pest guidance for webbing and insects', async () => {
      const res = await request(app)
        .post('/api/health-assistant')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          symptoms: ['webbing', 'pests'],
          plant_nickname: 'Fiddle Leaf',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.diagnosis.issue).toContain('Pest Infestation');
    });

    it('POST /api/health-assistant validates missing symptoms', async () => {
      const res = await request(app)
        .post('/api/health-assistant')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ symptoms: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('3. Production Security & Stability Verifications', () => {
    it('Rejects requests with invalid authorization headers', async () => {
      const res = await request(app)
        .get('/api/plants')
        .set('Authorization', 'Bearer invalid_token_123');
      expect(res.status).toBe(401);
    });

    it('Includes secure Helmet headers in responses', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers).toHaveProperty('x-dns-prefetch-control');
      expect(res.headers).toHaveProperty('x-content-type-options');
    });
  });
});
