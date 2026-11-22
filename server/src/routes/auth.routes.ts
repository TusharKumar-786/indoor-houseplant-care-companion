import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { query } from '../config/db';
import { config } from '../config/env';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from '../services/email.service';
import {
  createUploadMiddleware,
  saveUploadedFile,
  deleteStoredFile,
} from '../services/storage.service';

const router = Router();

// Helper to determine admin status based on environment variable ADMIN_EMAIL
const checkIsAdmin = (email?: string | null): boolean => {
  if (!email || !config.email.adminEmail) return false;
  return email.toLowerCase().trim() === config.email.adminEmail.toLowerCase().trim();
};

// Unified password policy: min 8 characters, at least one letter and one number
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Strict rate limiters for auth mutation endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
  skip: () => config.nodeEnv === 'test',
});

// Strict rate limiters for password reset endpoints
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many password reset requests. Please try again later.' },
  skip: () => config.nodeEnv === 'test',
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').max(100),
  password: passwordRule,
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordRule,
  confirmPassword: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().max(100).optional(),
  city: z.string().max(100).optional().nullable(),
  weekly_digest: z.boolean().optional(),
  language: z.string().max(10).optional(),
  currentPassword: z.string().optional(),
  newPassword: passwordRule.optional(),
  avatar_url: z.string().nullable().optional(),
});

// POST /auth/register
router.post('/register', authLimiter, validateBody(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await query(
      `INSERT INTO users (name, email, password, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, email, avatar_url, created_at`,
      [name.trim(), email.toLowerCase().trim(), hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    // Asynchronously send welcome email (registration will never fail if email fails)
    sendWelcomeEmail(user.email, user.name).catch((err) => {
      console.error('[EMAIL ERROR - WELCOME]', err);
    });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url || null,
          is_admin: checkIsAdmin(user.email),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/login
router.post('/login', authLimiter, validateBody(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      'SELECT id, name, email, password, avatar_url, is_active, city, weekly_digest, language FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const user = result.rows[0];

    if (!user.is_active) {
      res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar_url: user.avatar_url || null,
          city: user.city || null,
          weekly_digest: user.weekly_digest !== false,
          language: user.language || 'en',
          is_admin: checkIsAdmin(user.email),
        },
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/forgot-password (Strict timing safe / account guessing resistant)
router.post('/forgot-password', authLimiter, passwordResetLimiter, validateBody(forgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = req.body.email.toLowerCase().trim();

    // Check if account exists
    const userRes = await query('SELECT id, name, email FROM users WHERE email = $1 AND is_active = true', [email]);

    if (userRes.rows.length > 0) {
      const user = userRes.rows[0];
      // Generate 32 bytes cryptographically secure random token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Store in password_resets with 30 minutes expiration
      await query(
        `INSERT INTO password_resets (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
        [user.id, tokenHash]
      );

      // Send password reset email with raw token (never log raw token)
      sendPasswordResetEmail(user.email, user.name, rawToken).catch((err) => {
        console.error('[EMAIL ERROR - PASSWORD RESET]', err);
      });
    }

    // Always respond with identical generic success message to prevent account enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email address, you will receive password reset instructions shortly.',
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/reset-password
router.post('/reset-password', authLimiter, passwordResetLimiter, validateBody(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

    // Find valid, unexpired, unused reset token
    const resetRes = await query(
      `SELECT pr.id, pr.user_id, u.email, u.name
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token_hash = $1 
         AND pr.expires_at > NOW() 
         AND pr.used_at IS NULL`,
      [tokenHash]
    );

    if (resetRes.rows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Password reset link is invalid or has expired.',
      });
      return;
    }

    const { id: resetId, user_id: userId, email: userEmail, name: userName } = resetRes.rows[0];

    // Hash new password and update user
    const hashedNew = await bcrypt.hash(password, 10);
    await query('UPDATE users SET password = $1 WHERE id = $2', [hashedNew, userId]);

    // Invalidate token so it can only be used once
    await query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [resetId]);

    // Send confirmation email
    sendPasswordChangedEmail(userEmail, userName).catch((err) => {
      console.error('[EMAIL ERROR - PASSWORD CHANGED CONFIRMATION]', err);
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
});

// GET /auth/me
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT id, name, email, avatar_url, city, weekly_digest, language, created_at FROM users WHERE id = $1 AND is_active = true',
      [req.user!.id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    res.json({
      success: true,
      data: {
        user: {
          ...result.rows[0],
          is_admin: checkIsAdmin(result.rows[0].email),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /auth/profile
router.put('/profile', requireAuth, validateBody(updateProfileSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, email, currentPassword, newPassword, avatar_url, city, weekly_digest, language } = req.body;

    const userResult = await query('SELECT password FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    let passwordUpdate = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (newPassword) {
      if (!currentPassword) {
        res.status(400).json({ success: false, message: 'Current password is required to change password' });
        return;
      }
      const isMatch = await bcrypt.compare(currentPassword, userResult.rows[0].password);
      if (!isMatch) {
        res.status(400).json({ success: false, message: 'Current password is incorrect' });
        return;
      }
      const hashedNew = await bcrypt.hash(newPassword, 10);
      passwordUpdate = `password = $${paramIndex++}`;
      params.push(hashedNew);
    }

    const updates: string[] = [];
    if (passwordUpdate) updates.push(passwordUpdate);
    if (name) {
      updates.push(`name = $${paramIndex++}`);
      params.push(name.trim());
    }
    if (email) {
      updates.push(`email = $${paramIndex++}`);
      params.push(email.toLowerCase().trim());
    }
    if (city !== undefined) {
      updates.push(`city = $${paramIndex++}`);
      params.push(city ? city.trim() : null);
    }
    if (weekly_digest !== undefined) {
      updates.push(`weekly_digest = $${paramIndex++}`);
      params.push(weekly_digest);
    }
    if (language !== undefined) {
      updates.push(`language = $${paramIndex++}`);
      params.push(language);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${paramIndex++}`);
      params.push(avatar_url);
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: 'No fields provided to update' });
      return;
    }

    params.push(userId);
    const updateSql = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, email, avatar_url, city, weekly_digest, language, created_at
    `;

    const updated = await query(updateSql, params);
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          ...updated.rows[0],
          is_admin: checkIsAdmin(updated.rows[0].email),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /auth/avatar - Upload profile avatar image
router.post('/avatar', requireAuth, createUploadMiddleware('avatar'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file uploaded' });
      return;
    }

    // Fetch existing avatar to clean up old file if replaced
    const currentRes = await query('SELECT avatar_url, email FROM users WHERE id = $1', [userId]);
    const oldAvatarUrl = currentRes.rows[0]?.avatar_url;

    const avatarUrl = await saveUploadedFile(req.file, 'avatars');

    const result = await query(
      `UPDATE users 
       SET avatar_url = $1 
       WHERE id = $2 
       RETURNING id, name, email, avatar_url, city, weekly_digest, language, created_at`,
      [avatarUrl, userId]
    );

    // Delete previous file if local or cloud
    if (oldAvatarUrl && oldAvatarUrl !== avatarUrl) {
      await deleteStoredFile(oldAvatarUrl);
    }

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: {
        avatar_url: avatarUrl,
        user: {
          ...result.rows[0],
          is_admin: checkIsAdmin(result.rows[0].email),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /auth/avatar - Remove profile avatar
router.delete('/avatar', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const currentRes = await query('SELECT avatar_url, email FROM users WHERE id = $1', [userId]);
    const oldAvatarUrl = currentRes.rows[0]?.avatar_url;

    const result = await query(
      `UPDATE users 
       SET avatar_url = NULL 
       WHERE id = $1 
       RETURNING id, name, email, avatar_url, city, weekly_digest, language, created_at`,
      [userId]
    );

    if (oldAvatarUrl) {
      await deleteStoredFile(oldAvatarUrl);
    }

    res.json({
      success: true,
      message: 'Avatar removed successfully',
      data: {
        avatar_url: null,
        user: {
          ...result.rows[0],
          is_admin: checkIsAdmin(result.rows[0].email),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
