import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /schedule?filter=today|week|all
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const filter = (req.query.filter as string || 'today').toLowerCase();

    let filterCondition = '';
    if (filter === 'today') {
      filterCondition = `AND COALESCE(
        lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
        p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
      )::date <= CURRENT_DATE`;
    } else if (filter === 'week') {
      filterCondition = `AND COALESCE(
        lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
        p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
      )::date <= CURRENT_DATE + INTERVAL '7 days'`;
    }

    const sql = `
      SELECT 
        p.id,
        p.nickname,
        p.species,
        p.image_url,
        r.name AS room,
        cr.water_frequency_days,
        cr.sunlight_level,
        cr.fertilizing_frequency_days,
        lw.last_watered,
        COALESCE(
          lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
          p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
        )::date AS next_watering_date,
        (CURRENT_DATE - COALESCE(lw.last_watered, p.created_at::date))::integer AS days_since_last_watering,
        (
          COALESCE(
            lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
            p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
          )::date <= CURRENT_DATE
        ) AS is_due
      FROM plants p
      JOIN care_requirements cr ON p.care_requirement_id = cr.id
      LEFT JOIN rooms r ON p.room_id = r.id
      LEFT JOIN (
        SELECT l.plant_id, MAX(l.date) AS last_watered
        FROM log_book l
        JOIN plants pl ON pl.id = l.plant_id
        WHERE l.action = 'Watered' AND pl.user_id = $1
        GROUP BY l.plant_id
      ) lw ON p.id = lw.plant_id
      WHERE p.user_id = $1
      ${filterCondition}
      ORDER BY next_watering_date ASC, p.id ASC
    `;

    const result = await query(sql, [userId]);

    // Also get counts for each tab
    const countsSql = `
      SELECT 
        COUNT(CASE WHEN next_watering_date <= CURRENT_DATE THEN 1 END)::integer AS due_today_count,
        COUNT(CASE WHEN next_watering_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 END)::integer AS next_7_days_count,
        COUNT(*)::integer AS total_count
      FROM (
        SELECT 
          COALESCE(
            lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
            p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
          )::date AS next_watering_date
        FROM plants p
        JOIN care_requirements cr ON p.care_requirement_id = cr.id
        LEFT JOIN (
          SELECT l.plant_id, MAX(l.date) AS last_watered
          FROM log_book l
          JOIN plants pl ON pl.id = l.plant_id
          WHERE l.action = 'Watered' AND pl.user_id = $1
          GROUP BY l.plant_id
        ) lw ON p.id = lw.plant_id
        WHERE p.user_id = $1
      ) sub
    `;
    const countsRes = await query(countsSql, [userId]);

    res.json({
      success: true,
      data: result.rows,
      meta: {
        filter,
        counts: countsRes.rows[0] || { due_today_count: 0, next_7_days_count: 0, total_count: 0 },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
