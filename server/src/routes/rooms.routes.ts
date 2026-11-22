import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { invalidateDashboardCache } from './dashboard.routes';

const router = Router();
router.use(requireAuth);

const roomSchema = z.object({
  name: z.string().min(1, 'Room name is required').max(100),
  window_direction: z.string().max(50).optional().default('None'),
});

// GET /rooms - List all rooms for logged-in user with plant counts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const result = await query(
      `SELECT 
        r.id, 
        r.name, 
        r.window_direction, 
        r.created_at,
        COUNT(p.id)::integer AS plant_count
       FROM rooms r
       LEFT JOIN plants p ON p.room_id = r.id AND p.user_id = r.user_id
       WHERE r.user_id = $1
       GROUP BY r.id
       ORDER BY r.name ASC`,
      [userId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /rooms - Create a room
router.post('/', validateBody(roomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { name, window_direction } = req.body;

    const result = await query(
      `INSERT INTO rooms (name, window_direction, user_id)
       VALUES ($1, $2, $3)
       RETURNING id, name, window_direction, created_at`,
      [name.trim(), window_direction?.trim() || null, userId]
    );

    invalidateDashboardCache(userId);

    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: {
        ...result.rows[0],
        plant_count: 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /rooms/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const roomId = parseInt(req.params.id, 10);

    if (isNaN(roomId)) {
      res.status(400).json({ success: false, message: 'Invalid room ID' });
      return;
    }

    const result = await query(
      `SELECT 
        r.id, 
        r.name, 
        r.window_direction, 
        r.created_at,
        COUNT(p.id)::integer AS plant_count
       FROM rooms r
       LEFT JOIN plants p ON p.room_id = r.id AND p.user_id = r.user_id
       WHERE r.id = $1 AND r.user_id = $2
       GROUP BY r.id`,
      [roomId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Room not found' });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// PUT /rooms/:id
router.put('/:id', validateBody(roomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const roomId = parseInt(req.params.id, 10);
    const { name, window_direction } = req.body;

    if (isNaN(roomId)) {
      res.status(400).json({ success: false, message: 'Invalid room ID' });
      return;
    }

    const result = await query(
      `UPDATE rooms
       SET name = $1, window_direction = $2
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, window_direction, created_at`,
      [name.trim(), window_direction?.trim() || null, roomId, userId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
      return;
    }

    // Get updated plant count
    const countRes = await query(
      'SELECT COUNT(*)::integer AS plant_count FROM plants WHERE room_id = $1',
      [roomId]
    );

    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: 'Room updated successfully',
      data: {
        ...result.rows[0],
        plant_count: countRes.rows[0].plant_count,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /rooms/:id
// Room deletion policy: Unassigns plants from room (ON DELETE SET NULL), or cascade
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const roomId = parseInt(req.params.id, 10);

    if (isNaN(roomId)) {
      res.status(400).json({ success: false, message: 'Invalid room ID' });
      return;
    }

    const check = await query('SELECT id FROM rooms WHERE id = $1 AND user_id = $2', [roomId, userId]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Room not found or unauthorized' });
      return;
    }

    // Set plant room_id to null before deleting room
    await query('UPDATE plants SET room_id = NULL WHERE room_id = $1 AND user_id = $2', [roomId, userId]);
    await query('DELETE FROM rooms WHERE id = $1 AND user_id = $2', [roomId, userId]);

    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: 'Room deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
