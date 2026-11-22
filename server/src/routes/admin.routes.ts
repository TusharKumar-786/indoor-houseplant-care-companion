import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { config } from '../config/env';

const router = Router();
router.use(requireAuth);

// Admin-only middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const userEmail = req.user?.email?.toLowerCase().trim();
  const adminEmail = (config.email.adminEmail || '').toLowerCase().trim();

  // Admin access restricted strictly to configured ADMIN_EMAIL
  if (adminEmail && userEmail === adminEmail) {
    return next();
  }

  res.status(403).json({
    success: false,
    message: 'Forbidden. Admin privileges required.',
  });
};

router.use(requireAdmin);

// GET /api/admin/stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usersCount = await query('SELECT COUNT(*)::integer AS count FROM users');
    const plantsCount = await query('SELECT COUNT(*)::integer AS count FROM plants');
    const logsCount = await query('SELECT COUNT(*)::integer AS count FROM log_book');
    const messagesCount = await query('SELECT COUNT(*)::integer AS count FROM contact_messages');
    const unreadMessages = await query(
      'SELECT COUNT(*)::integer AS count FROM contact_messages WHERE is_read = false'
    );

    // Recent signups
    const recentUsers = await query(
      `SELECT id, name, email, city, created_at,
              (SELECT COUNT(*)::integer FROM plants WHERE user_id = users.id) AS plant_count
       FROM users
       ORDER BY created_at DESC
       LIMIT 5`
    );

    res.json({
      success: true,
      data: {
        totals: {
          users: usersCount.rows[0].count,
          plants: plantsCount.rows[0].count,
          care_logs: logsCount.rows[0].count,
          contact_messages: messagesCount.rows[0].count,
          unread_messages: unreadMessages.rows[0].count,
        },
        recent_users: recentUsers.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/contact-messages
router.get('/contact-messages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT id, name, email, message, is_read, created_at FROM contact_messages ORDER BY created_at DESC'
    );
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/admin/contact-messages/:id/read
router.put('/contact-messages/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await query(
      'UPDATE contact_messages SET is_read = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/users
router.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    const countRes = await query('SELECT COUNT(*)::integer AS total FROM users');
    const total = countRes.rows[0].total;

    const dataRes = await query(
      `SELECT id, name, email, city, is_active, created_at,
              (SELECT COUNT(*)::integer FROM plants WHERE user_id = users.id) AS plant_count,
              (SELECT COUNT(*)::integer FROM rooms WHERE user_id = users.id) AS room_count
       FROM users
       ORDER BY id ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
