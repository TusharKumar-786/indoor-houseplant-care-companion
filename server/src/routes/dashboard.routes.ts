import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// In-memory cache with short TTL (10 seconds) for super-fast load test response
interface CacheEntry {
  data: any;
  timestamp: number;
}
const dashboardCache = new Map<number, CacheEntry>();
const CACHE_TTL_MS = 10 * 1000;

export const invalidateDashboardCache = (userId: number) => {
  dashboardCache.delete(userId);
};

// GET /dashboard
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const now = Date.now();

    // Check cache unless requested otherwise
    const cached = dashboardCache.get(userId);
    if (cached && now - cached.timestamp < CACHE_TTL_MS && !req.query.fresh) {
      res.json({
        success: true,
        data: cached.data,
      });
      return;
    }

    // 1. Total Plants
    const totalPlantsRes = await query(
      'SELECT COUNT(*)::integer AS total_plants FROM plants WHERE user_id = $1',
      [userId]
    );
    const totalPlants = totalPlantsRes.rows[0].total_plants;

    // 2. Total Rooms
    const totalRoomsRes = await query(
      'SELECT COUNT(*)::integer AS total_rooms FROM rooms WHERE user_id = $1',
      [userId]
    );
    const totalRooms = totalRoomsRes.rows[0].total_rooms;

    // 3. Plants Due Today + Count
    const dueSql = `
      SELECT 
        p.id,
        p.nickname,
        p.species,
        p.image_url,
        r.name AS room,
        COALESCE(
          lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
          p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
        )::date AS next_watering_date,
        (CURRENT_DATE - COALESCE(lw.last_watered, p.created_at::date))::integer AS days_since_last_watering
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
        AND COALESCE(
          lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
          p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
        )::date <= CURRENT_DATE
      ORDER BY p.id ASC
    `;

    const dueRes = await query(dueSql, [userId]);
    const plantsDueToday = dueRes.rows;
    const dueToday = plantsDueToday.length;

    // 4. Recently Added Plants (last 4)
    const recentPlantsRes = await query(
      `SELECT p.id, p.nickname, p.species, p.image_url, r.name AS room, p.created_at
       FROM plants p
       LEFT JOIN rooms r ON p.room_id = r.id
       WHERE p.user_id = $1
       ORDER BY p.created_at DESC
       LIMIT 4`,
      [userId]
    );

    // 5. Weekly care activity — count per day for last 7 days
    const weeklyRes = await query(
      `SELECT
         lb.date::date AS day_date,
         COUNT(*)::integer AS count
       FROM log_book lb
       JOIN plants p ON lb.plant_id = p.id
       WHERE p.user_id = $1
         AND lb.date >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY lb.date::date
       ORDER BY lb.date::date ASC`,
      [userId]
    );

    // Build a full 7-day array (fill gaps with 0)
    const weeklyActivity: { day: string; date: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = weeklyRes.rows.find((r: any) => {
        const rowDate = r.day_date instanceof Date
          ? r.day_date.toISOString().split('T')[0]
          : String(r.day_date).split('T')[0];
        return rowDate === dateStr;
      });
      weeklyActivity.push({ day: dayLabel, date: dateStr, count: found ? found.count : 0 });
    }

    const data = {
      counts: {
        total_plants: totalPlants,
        due_today: dueToday,
        total_rooms: totalRooms,
      },
      plants_due_today: plantsDueToday,
      recently_added: recentPlantsRes.rows,
      weekly_activity: weeklyActivity,
    };

    // Store in cache
    dashboardCache.set(userId, { data, timestamp: now });

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
