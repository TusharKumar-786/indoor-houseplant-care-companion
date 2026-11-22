import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { invalidateDashboardCache } from './dashboard.routes';

const router = Router();
router.use(requireAuth);

const logSchema = z.object({
  plant_id: z.coerce.number().int().min(1, 'Plant is required'),
  action: z.enum(['Watered', 'Fertilized', 'Pruned'], {
    errorMap: () => ({ message: "Action must be 'Watered', 'Fertilized', or 'Pruned'" }),
  }),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine(
      (val) => {
        const [year, month, day] = val.split('-').map(Number);
        const d = new Date(year, month - 1, day);
        if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
          return false;
        }
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return val <= todayStr;
      },
      { message: 'Date must be a valid calendar date and cannot be in the future' }
    )
    .optional(),
  notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional().nullable(),
});

// GET /logs - Get log entries with plant filter, from/to date range, and pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = req.query.plant_id ? parseInt(req.query.plant_id as string, 10) : null;
    const from = req.query.from as string;
    const to = req.query.to as string;

    const isRanged = Boolean(from || to);
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = isRanged
      ? Math.min(1000, Math.max(1, parseInt(req.query.limit as string || '500', 10)))
      : Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['p.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (plantId && !isNaN(plantId)) {
      conditions.push(`l.plant_id = $${paramIndex}`);
      params.push(plantId);
      paramIndex++;
    }

    if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
      conditions.push(`l.date >= $${paramIndex}`);
      params.push(from);
      paramIndex++;
    }

    if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
      conditions.push(`l.date <= $${paramIndex}`);
      params.push(to);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Total count
    const countRes = await query(
      `SELECT COUNT(*)::integer AS total
       FROM log_book l
       JOIN plants p ON l.plant_id = p.id
       WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0].total;

    // Log records
    const sql = `
      SELECT 
        l.id,
        l.plant_id,
        p.nickname AS plant_nickname,
        p.species AS plant_species,
        l.action,
        TO_CHAR(l.date, 'YYYY-MM-DD') AS date,
        l.notes,
        l.created_at
      FROM log_book l
      JOIN plants p ON l.plant_id = p.id
      WHERE ${whereClause}
      ORDER BY l.date DESC, l.id DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);
    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /logs - Add a log entry (date defaults to today in server logic)
router.post('/', validateBody(logSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { plant_id, action, date, notes } = req.body;

    // Default date to today's date in local server logic if omitted
    const now = new Date();
    const resolvedDate = date || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // Ensure plant belongs to current user
    const plantCheck = await query('SELECT nickname FROM plants WHERE id = $1 AND user_id = $2', [plant_id, userId]);
    if (plantCheck.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Plant not found or unauthorized',
      });
      return;
    }

    const result = await query(
      `INSERT INTO log_book (plant_id, action, date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING id, plant_id, action, TO_CHAR(date, 'YYYY-MM-DD') as date, notes, created_at`,
      [plant_id, action, resolvedDate, notes?.trim() || null]
    );

    // Invalidate dashboard cache for this user
    invalidateDashboardCache(userId);

    res.status(201).json({
      success: true,
      message: 'Log entry added successfully',
      data: {
        ...result.rows[0],
        plant_nickname: plantCheck.rows[0].nickname,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /logs/:id - Delete a log entry
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const logId = parseInt(req.params.id, 10);

    if (isNaN(logId)) {
      res.status(400).json({ success: false, message: 'Invalid log ID' });
      return;
    }

    // Verify ownership via plant
    const check = await query(
      `SELECT l.id 
       FROM log_book l 
       JOIN plants p ON l.plant_id = p.id 
       WHERE l.id = $1 AND p.user_id = $2`,
      [logId, userId]
    );

    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Log entry not found or unauthorized' });
      return;
    }

    await query('DELETE FROM log_book WHERE id = $1', [logId]);
    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: 'Log entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
