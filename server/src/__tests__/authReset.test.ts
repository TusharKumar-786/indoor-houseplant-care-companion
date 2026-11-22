import request from 'supertest';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import app from '../app';
import { pool, query } from '../config/db';

let testUserEmail = 'resettester@example.com';
let testUserId: number;

beforeAll(async () => {
  // Ensure test user exists
  const existing = await query('SELECT id FROM users WHERE email = $1', [testUserEmail]);
  if (existing.rows.length === 0) {
    const hashed = await bcrypt.hash('OriginalPass123!', 10);
    const res = await query(
      `INSERT INTO users (name, email, password, is_active)
       VALUES ($1, $2, $3, true) RETURNING id`,
      ['Reset Tester', testUserEmail, hashed]
    );
    testUserId = res.rows[0].id;
  } else {
    testUserId = existing.rows[0].id;
  }
});

afterAll(async () => {
  if (testUserId) {
    await query('DELETE FROM password_resets WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
  }
  await pool.end();
});

describe('Forgot & Reset Password Test Suite', () => {
  it('POST /api/auth/forgot-password returns 200 generic message for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'unknown_gardener_999@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('instructions shortly');
  });

  it('POST /api/auth/forgot-password creates unexpired reset token in DB for known email', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: testUserEmail });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const resetRecords = await query(
      'SELECT id, token_hash, expires_at, used_at FROM password_resets WHERE user_id = $1 ORDER BY id DESC LIMIT 1',
      [testUserId]
    );
    expect(resetRecords.rows.length).toBe(1);
    expect(resetRecords.rows[0].used_at).toBeNull();
    expect(new Date(resetRecords.rows[0].expires_at).getTime()).toBeGreaterThan(Date.now());
  });

  it('POST /api/auth/reset-password rejects invalid token with 400', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: 'invalid_raw_token_xyz',
        password: 'NewStrongPassword123!',
        confirmPassword: 'NewStrongPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('invalid or has expired');
  });

  it('POST /api/auth/reset-password resets password with valid token and marks token used', async () => {
    // Generate fresh token directly into DB
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
      [testUserId, tokenHash]
    );

    const resetRes = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'NewlyUpdatedPass456!',
        confirmPassword: 'NewlyUpdatedPass456!',
      });

    expect(resetRes.status).toBe(200);
    expect(resetRes.body.success).toBe(true);

    // Verify token was marked used
    const checkUsed = await query(
      'SELECT used_at FROM password_resets WHERE token_hash = $1',
      [tokenHash]
    );
    expect(checkUsed.rows[0].used_at).not.toBeNull();

    // Verify user can log in with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'NewlyUpdatedPass456!',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data).toHaveProperty('token');
  });

  it('POST /api/auth/reset-password rejects reused token with 400', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Insert already used token
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at, used_at)
       VALUES ($1, $2, NOW() + INTERVAL '30 minutes', NOW())`,
      [testUserId, tokenHash]
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'AnotherPassword789!',
        confirmPassword: 'AnotherPassword789!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/auth/reset-password rejects expired token with 400', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Insert token expired 10 minutes ago
    await query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() - INTERVAL '10 minutes')`,
      [testUserId, tokenHash]
    );

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({
        token: rawToken,
        password: 'ExpiredPassword789!',
        confirmPassword: 'ExpiredPassword789!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
