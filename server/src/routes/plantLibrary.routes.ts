import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';

const router = Router();

// GET /api/plant-library - Searchable plant catalogue
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const search = (req.query.search as string || '').trim();
    let sql = `
      SELECT id, common_name, scientific_name, image_url, water_frequency_days,
             sunlight_level, humidity, pet_safe, care_tip
      FROM plant_library
    `;
    const params: any[] = [];

    if (search) {
      sql += ' WHERE common_name ILIKE $1 OR scientific_name ILIKE $1';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY common_name ASC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
