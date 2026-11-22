import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import path from 'path';
import fs from 'fs';
import { pool, query, getClient } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { invalidateDashboardCache } from './dashboard.routes';
import { isAiEnabled, callGemini } from '../services/gemini.service';
import {
  createUploadMiddleware,
  saveUploadedFile,
  deleteStoredFile,
} from '../services/storage.service';

const router = Router();
router.use(requireAuth);

const plantSchema = z.object({
  nickname: z.string().min(1, 'Plant nickname is required').max(100),
  species: z.string().min(1, 'Species is required').max(100),
  room_id: z.union([z.number(), z.string().transform(v => v ? parseInt(v, 10) : null)]).nullable().optional(),
  water_frequency_days: z.coerce.number().int().min(1, 'Water frequency must be at least 1 day'),
  sunlight_level: z.enum(['Low', 'Medium', 'High']),
  fertilizing_frequency_days: z.coerce.number().int().min(1).optional().default(14),
  image_url: z.string().optional().nullable(),
});

// GET /plants - List plants with search, room filter, pagination, derived care calculations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const search = (req.query.search as string || '').trim();
    const roomId = req.query.room_id ? parseInt(req.query.room_id as string, 10) : null;
    const page = Math.max(1, parseInt(req.query.page as string || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10)));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['p.user_id = $1'];
    const params: any[] = [userId];
    let paramIndex = 2;

    if (search) {
      conditions.push(`(p.nickname ILIKE $${paramIndex} OR p.species ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (roomId && !isNaN(roomId)) {
      conditions.push(`p.room_id = $${paramIndex}`);
      params.push(roomId);
      paramIndex++;
    }

    const whereClause = conditions.join(' AND ');

    // Total count query
    const countRes = await query(
      `SELECT COUNT(*)::integer AS total FROM plants p WHERE ${whereClause}`,
      params
    );
    const total = countRes.rows[0].total;

    // Data query with JOINs and derived watering calculations
    const dataSql = `
      SELECT 
        p.id,
        p.nickname,
        p.species,
        p.image_url,
        p.room_id,
        r.name AS room,
        p.care_requirement_id,
        cr.water_frequency_days,
        cr.sunlight_level,
        cr.fertilizing_frequency_days,
        p.created_at,
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
      WHERE ${whereClause}
      ORDER BY p.id ASC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);
    const dataRes = await query(dataSql, params);

    // Map rows to include friendly next_watering_in_days
    const plants = dataRes.rows.map((plant) => {
      const nextDate = new Date(plant.next_watering_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextDate.setHours(0, 0, 0, 0);
      const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      return {
        ...plant,
        days_until_next_watering: diffDays,
      };
    });

    res.json({
      success: true,
      data: plants,
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

// POST /plants - Create plant and care requirement in ONE DB TRANSACTION
router.post('/', validateBody(plantSchema), async (req: Request, res: Response, next: NextFunction) => {
  const client = await getClient();
  try {
    const userId = req.user!.id;
    const {
      nickname,
      species,
      room_id,
      water_frequency_days,
      sunlight_level,
      fertilizing_frequency_days,
      image_url,
    } = req.body;

    await client.query('BEGIN');

    // If room_id specified, verify room belongs to user
    if (room_id) {
      const roomCheck = await client.query(
        'SELECT id FROM rooms WHERE id = $1 AND user_id = $2',
        [room_id, userId]
      );
      if (roomCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          message: 'Selected room does not exist or does not belong to you',
        });
        return;
      }
    }

    // 1. Insert into care_requirements
    const careResult = await client.query(
      `INSERT INTO care_requirements (water_frequency_days, sunlight_level, fertilizing_frequency_days)
       VALUES ($1, $2, $3)
       RETURNING id, water_frequency_days, sunlight_level, fertilizing_frequency_days, created_at`,
      [water_frequency_days, sunlight_level, fertilizing_frequency_days || 14]
    );
    const careRequirementId = careResult.rows[0].id;

    // 2. Insert into plants
    const plantResult = await client.query(
      `INSERT INTO plants (nickname, species, image_url, room_id, care_requirement_id, user_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, nickname, species, image_url, room_id, care_requirement_id, user_id, created_at`,
      [nickname.trim(), species.trim(), image_url || null, room_id || null, careRequirementId, userId]
    );

    await client.query('COMMIT');

    const createdPlant = plantResult.rows[0];

    // Fetch room name if any
    let roomName: string | null = null;
    if (room_id) {
      const r = await query('SELECT name FROM rooms WHERE id = $1', [room_id]);
      if (r.rows.length > 0) roomName = r.rows[0].name;
    }

    invalidateDashboardCache(userId);

    res.status(201).json({
      success: true,
      message: 'Plant added successfully',
      data: {
        ...createdPlant,
        room: roomName,
        care_requirements: careResult.rows[0],
      },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// POST /plants/identify - Identify plant species and care guidelines from photo
router.post('/identify', createUploadMiddleware('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    const bodyImage = req.body.image; // can be base64 or URL

    let finalImageUrl: string | null = null;
    let base64Data = '';
    let mimeType = 'image/jpeg';

    if (file) {
      finalImageUrl = await saveUploadedFile(file, 'plants');
      const buffer = fs.existsSync(file.path) ? fs.readFileSync(file.path) : null;
      if (buffer) {
        base64Data = buffer.toString('base64');
        mimeType = file.mimetype || 'image/jpeg';
      }
    } else if (bodyImage && typeof bodyImage === 'string') {
      finalImageUrl = bodyImage;
      if (bodyImage.startsWith('data:')) {
        const parts = bodyImage.split(',');
        base64Data = parts[1];
        const match = parts[0].match(/:(.*?);/);
        if (match) mimeType = match[1];
      }
    }

    let aiResult: any = null;

    if (isAiEnabled() && base64Data) {
      const prompt = `Identify this houseplant. Return ONLY a valid JSON object with no markdown formatting, no backticks, no comments:
{
  "common_name": "Common Name",
  "species": "Botanical species name",
  "water_frequency_days": 7,
  "sunlight_level": "Low" | "Medium" | "High",
  "humidity_preference": "Low" | "Medium" | "High",
  "pet_safe": true | false,
  "confidence": 0.95,
  "care_tips": "Short practical 1-2 sentence care advice with NO emojis."
}`;

      const responseText = await callGemini({
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
        maxOutputTokens: 400,
      });

      if (responseText) {
        try {
          const rawText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
          aiResult = JSON.parse(rawText);
        } catch (jsonErr) {
          console.warn('[PLANTS IDENTIFY] Could not parse AI response as JSON');
        }
      }
    }

    if (aiResult && aiResult.common_name) {
      return res.json({
        success: true,
        data: {
          ...aiResult,
          image_url: finalImageUrl,
          source: 'ai',
        },
      });
    }

    // When AI is unavailable or fails to detect: return honest manual defaults with confidence: null and source: 'manual'
    // Never return fake predetermined confidence percentages (e.g. Monstera 94%)
    return res.json({
      success: true,
      data: {
        common_name: '',
        species: '',
        water_frequency_days: 7,
        sunlight_level: 'Medium',
        humidity_preference: 'Medium',
        pet_safe: false,
        confidence: null,
        source: 'manual',
        care_tips: 'Set watering and light preferences based on your home environment.',
        image_url: finalImageUrl,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /plants/:id - Plant Detail with care requirements, recent logs, watering status
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);

    if (isNaN(plantId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID' });
      return;
    }

    const plantSql = `
      SELECT 
        p.id,
        p.nickname,
        p.species,
        p.image_url,
        p.room_id,
        r.name AS room,
        p.care_requirement_id,
        cr.water_frequency_days,
        cr.sunlight_level,
        cr.fertilizing_frequency_days,
        p.created_at,
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
        WHERE l.action = 'Watered' AND l.plant_id = $1
        GROUP BY l.plant_id
      ) lw ON p.id = lw.plant_id
      WHERE p.id = $1 AND p.user_id = $2
    `;

    const plantRes = await query(plantSql, [plantId, userId]);
    if (plantRes.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Plant not found' });
      return;
    }

    const plant = plantRes.rows[0];

    // Fetch recent logs
    const logsRes = await query(
      `SELECT id, action, date, notes, created_at
       FROM log_book
       WHERE plant_id = $1
       ORDER BY date DESC, id DESC
       LIMIT 10`,
      [plantId]
    );

    res.json({
      success: true,
      data: {
        ...plant,
        recent_logs: logsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /plants/:id - Update plant and care requirements
router.put('/:id', validateBody(plantSchema), async (req: Request, res: Response, next: NextFunction) => {
  const client = await getClient();
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);
    const {
      nickname,
      species,
      room_id,
      water_frequency_days,
      sunlight_level,
      fertilizing_frequency_days,
      image_url,
    } = req.body;

    if (isNaN(plantId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID' });
      return;
    }

    await client.query('BEGIN');

    // Verify plant exists and belongs to user
    const checkRes = await client.query(
      'SELECT care_requirement_id FROM plants WHERE id = $1 AND user_id = $2',
      [plantId, userId]
    );
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
      return;
    }

    const careRequirementId = checkRes.rows[0].care_requirement_id;

    // If room_id specified, verify room belongs to user (identical to POST)
    if (room_id) {
      const roomCheck = await client.query(
        'SELECT id FROM rooms WHERE id = $1 AND user_id = $2',
        [room_id, userId]
      );
      if (roomCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          message: 'Selected room does not exist or does not belong to you',
        });
        return;
      }
    }

    // Update care_requirements
    await client.query(
      `UPDATE care_requirements
       SET water_frequency_days = $1, sunlight_level = $2, fertilizing_frequency_days = $3
       WHERE id = $4`,
      [water_frequency_days, sunlight_level, fertilizing_frequency_days || 14, careRequirementId]
    );

    // Update plant
    const updatePlantRes = await client.query(
      `UPDATE plants
       SET nickname = $1, species = $2, room_id = $3, image_url = COALESCE($4, image_url)
       WHERE id = $5 AND user_id = $6
       RETURNING id, nickname, species, image_url, room_id, care_requirement_id, created_at`,
      [nickname.trim(), species.trim(), room_id || null, image_url, plantId, userId]
    );

    await client.query('COMMIT');

    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: 'Plant updated successfully',
      data: updatePlantRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

// DELETE /plants/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);

    if (isNaN(plantId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID' });
      return;
    }

    const check = await query('SELECT care_requirement_id, image_url FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
    if (check.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
      return;
    }

    const careReqId = check.rows[0].care_requirement_id;
    const oldImageUrl = check.rows[0].image_url;

    // Cascade delete on plant will delete log_book
    await query('DELETE FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
    // Also cleanup care_requirements
    await query('DELETE FROM care_requirements WHERE id = $1', [careReqId]);

    if (oldImageUrl) {
      await deleteStoredFile(oldImageUrl);
    }

    invalidateDashboardCache(userId);

    res.json({
      success: true,
      message: 'Plant deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Middleware to verify plant ownership before processing file upload
const checkPlantOwnership = async (req: Request, res: Response, next: NextFunction) => {
  const userId = req.user!.id;
  const plantId = parseInt(req.params.id, 10);

  if (isNaN(plantId)) {
    res.status(400).json({ success: false, message: 'Invalid plant ID' });
    return;
  }

  const check = await query('SELECT id, image_url FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
  if (check.rows.length === 0) {
    res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
    return;
  }

  (req as any).existingPlant = check.rows[0];
  next();
};

// POST /plants/:id/image - Upload image for plant (multer runs after ownership check)
router.post(
  '/:id/image',
  checkPlantOwnership,
  createUploadMiddleware('image'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const plantId = parseInt(req.params.id, 10);

      if (!req.file) {
        res.status(400).json({ success: false, message: 'No image file uploaded' });
        return;
      }

      const oldImageUrl = (req as any).existingPlant?.image_url;
      const imageUrl = await saveUploadedFile(req.file, 'plants');

      await query(
        `UPDATE plants 
         SET image_url = $1 
         WHERE id = $2 AND user_id = $3`,
        [imageUrl, plantId, userId]
      );

      if (oldImageUrl && oldImageUrl !== imageUrl) {
        await deleteStoredFile(oldImageUrl);
      }

      invalidateDashboardCache(userId);

      res.json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          image_url: imageUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

const journalSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  notes: z.string().min(1, 'Notes are required').max(2000),
  image_url: z.string().optional().nullable(),
  height_cm: z.coerce.number().positive().max(1000).optional().nullable(),
});

// GET /plants/:id/journal - List journal entries for a plant
router.get('/:id/journal', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);

    if (isNaN(plantId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID' });
      return;
    }

    // Verify plant ownership
    const plantCheck = await query('SELECT id FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
    if (plantCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
      return;
    }

    const result = await query(
      `SELECT id, plant_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, notes, image_url, height_cm, created_at
       FROM growth_journal
       WHERE plant_id = $1
       ORDER BY date DESC, id DESC`,
      [plantId]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

// POST /plants/:id/journal - Create journal entry for a plant
router.post('/:id/journal', validateBody(journalSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);
    const { date, notes, image_url, height_cm } = req.body;

    if (isNaN(plantId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID' });
      return;
    }

    // Verify plant ownership
    const plantCheck = await query('SELECT id FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
    if (plantCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
      return;
    }

    const result = await query(
      `INSERT INTO growth_journal (plant_id, date, notes, image_url, height_cm)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, plant_id, TO_CHAR(date, 'YYYY-MM-DD') AS date, notes, image_url, height_cm, created_at`,
      [plantId, date, notes.trim(), image_url || null, height_cm || null]
    );

    res.status(201).json({
      success: true,
      message: 'Growth journal entry added successfully',
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /plants/:id/journal/:entryId - Delete journal entry
router.delete('/:id/journal/:entryId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const plantId = parseInt(req.params.id, 10);
    const entryId = parseInt(req.params.entryId, 10);

    if (isNaN(plantId) || isNaN(entryId)) {
      res.status(400).json({ success: false, message: 'Invalid plant ID or entry ID' });
      return;
    }

    // Verify plant ownership
    const plantCheck = await query('SELECT id FROM plants WHERE id = $1 AND user_id = $2', [plantId, userId]);
    if (plantCheck.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Plant not found or unauthorized' });
      return;
    }

    const result = await query(
      'DELETE FROM growth_journal WHERE id = $1 AND plant_id = $2 RETURNING id',
      [entryId, plantId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ success: false, message: 'Journal entry not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Journal entry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
