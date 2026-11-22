import request from 'supertest';
import app from '../app';
import { pool } from '../config/db';

let user1Token: string;
let user2Token: string;
let createdRoomId: number;
let createdPlantId: number;
let createdLogId: number;

beforeAll(async () => {
  // Login demo user 1 (Tushar)
  const res1 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'tushar@example.com', password: 'password123' });
  expect(res1.status).toBe(200);
  user1Token = res1.body.data.token;

  // Login demo user 2 (Jane)
  const res2 = await request(app)
    .post('/api/auth/login')
    .send({ email: 'jane@example.com', password: 'password123' });
  expect(res2.status).toBe(200);
  user2Token = res2.body.data.token;
});

afterAll(async () => {
  await pool.end();
});

describe('PlantCare API Test Suite', () => {
  describe('1. Health Check Endpoint', () => {
    it('GET /api/health returns 200 and db connected', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.db === 'connected' || res.body.db?.status === 'connected').toBe(true);
    });
  });

  describe('2. Authentication & User Profile', () => {
    it('GET /api/auth/me returns current user info', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('tushar@example.com');
      expect(res.body.data.user.name).toBe('Tushar Kumar');
    });

    it('GET /api/auth/me rejects unauthorized request with 401', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/login rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'tushar@example.com', password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/register rejects invalid email with 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Test', email: 'notanemail', password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Dashboard & Stat Cards', () => {
    it('GET /api/dashboard returns correct counts matching seed data', async () => {
      const res = await request(app)
        .get('/api/dashboard?fresh=1')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.counts.total_plants).toBe(5);
      expect(res.body.data.counts.due_today).toBe(2);
      expect(res.body.data.counts.total_rooms).toBe(3);
      expect(res.body.data.plants_due_today.length).toBe(2);
    });
  });

  describe('4. Rooms Endpoints & User Isolation', () => {
    it('GET /api/rooms returns only user 1 rooms', async () => {
      const res = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      const roomNames = res.body.data.map((r: any) => r.name);
      expect(roomNames).toContain('Living Room');
      expect(roomNames).not.toContain('Office'); // Office belongs to Jane
    });

    it('POST /api/rooms creates a new room', async () => {
      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ name: 'Kitchen', window_direction: 'East' });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Kitchen');
      createdRoomId = res.body.data.id;
    });

    it('User 2 cannot access or delete User 1 room (Isolation)', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(404);
    });

    it('DELETE /api/rooms/:id deletes room for authorized owner', async () => {
      const res = await request(app)
        .delete(`/api/rooms/${createdRoomId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
    });
  });

  describe('5. Plants Endpoints (Transaction & Derivation)', () => {
    it('GET /api/plants returns paginated plants for user 1', async () => {
      const res = await request(app)
        .get('/api/plants')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(5);
      expect(res.body.data[0]).toHaveProperty('next_watering_date');
      expect(res.body.data[0]).toHaveProperty('days_since_last_watering');
    });

    it('POST /api/plants creates plant + care_requirements in one transaction', async () => {
      const res = await request(app)
        .post('/api/plants')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          nickname: 'Golden Pothos',
          species: 'Epipremnum aureum',
          room_id: 1,
          water_frequency_days: 5,
          sunlight_level: 'Medium',
          fertilizing_frequency_days: 14,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.nickname).toBe('Golden Pothos');
      expect(res.body.data.care_requirements.water_frequency_days).toBe(5);
      createdPlantId = res.body.data.id;
    });

    it('GET /api/plants/:id returns plant detail with recent logs', async () => {
      const res = await request(app)
        .get(`/api/plants/${createdPlantId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.nickname).toBe('Golden Pothos');
      expect(Array.isArray(res.body.data.recent_logs)).toBe(true);
    });

    it('User 2 cannot view User 1 plant (Isolation)', async () => {
      const res = await request(app)
        .get(`/api/plants/${createdPlantId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(res.status).toBe(404);
    });
  });

  describe('6. Care Schedule & Tabs', () => {
    it('GET /api/schedule?filter=today returns plants due today', async () => {
      const res = await request(app)
        .get('/api/schedule?filter=today')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      expect(res.body.meta.counts.due_today_count).toBeGreaterThanOrEqual(2);
    });

    it('GET /api/schedule?filter=all returns all plants for schedule', async () => {
      const res = await request(app)
        .get('/api/schedule?filter=all')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('7. Log Book Endpoints', () => {
    it('POST /api/logs adds a new care log entry', async () => {
      const res = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          plant_id: createdPlantId,
          action: 'Watered',
          date: new Date().toISOString().split('T')[0],
          notes: 'First watering test',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.action).toBe('Watered');
      createdLogId = res.body.data.id;
    });

    it('POST /api/logs rejects invalid action with 400', async () => {
      const res = await request(app)
        .post('/api/logs')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          plant_id: createdPlantId,
          action: 'TalkedToPlant',
          date: '2026-11-19',
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/logs returns paginated list of logs', async () => {
      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toHaveProperty('total');
    });

    it('DELETE /api/logs/:id deletes log', async () => {
      const res = await request(app)
        .delete(`/api/logs/${createdLogId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
    });

    it('Cleanup test plant', async () => {
      const res = await request(app)
        .delete(`/api/plants/${createdPlantId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(res.status).toBe(200);
    });
  });
});
