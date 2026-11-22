import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { config } from '../config/env';
import { getCachedAiSuggestion } from '../services/gemini.service';

const router = Router();
router.use(requireAuth);

interface SuggestionItem {
  id: string;
  type: 'watering' | 'light_mismatch' | 'neglected' | 'seasonal' | 'ai';
  title: string;
  description: string;
  action_label?: string;
  action_path?: string;
  plant_id?: number;
  severity: 'critical' | 'warning' | 'info';
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const suggestions: SuggestionItem[] = [];

    // 1. Check for plants due or overdue for watering
    const duePlantsQuery = await query(
      `SELECT p.id, p.nickname, p.species,
              COALESCE(
                lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
                p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
              )::date AS next_watering_date,
              (CURRENT_DATE - COALESCE(lw.last_watered, p.created_at::date))::integer AS days_since_last_watered
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
         AND COALESCE(
           lw.last_watered + (cr.water_frequency_days * INTERVAL '1 day'),
           p.created_at::date + (cr.water_frequency_days * INTERVAL '1 day')
         )::date <= CURRENT_DATE
       ORDER BY next_watering_date ASC
       LIMIT 3`,
      [userId]
    );

    if (duePlantsQuery.rows.length > 0) {
      const names = duePlantsQuery.rows.map((r) => r.nickname).join(', ');
      suggestions.push({
        id: 'sug-watering-due',
        type: 'watering',
        title: `${duePlantsQuery.rows.length} plant${duePlantsQuery.rows.length > 1 ? 's' : ''} ready for hydration`,
        description: `${names} ${duePlantsQuery.rows.length > 1 ? 'have' : 'has'} reached their watering cycle. Check root dampness before watering.`,
        action_label: 'View Schedule',
        action_path: '/schedule',
        severity: 'critical',
      });
    }

    // 2. Light Mismatch Check: Compare plant sunlight requirement with room window orientation
    const mismatchQuery = await query(
      `SELECT p.id, p.nickname, p.species, cr.sunlight_level, r.name AS room_name, r.window_direction
       FROM plants p
       JOIN care_requirements cr ON p.care_requirement_id = cr.id
       JOIN rooms r ON p.room_id = r.id
       WHERE p.user_id = $1
         AND r.window_direction IS NOT NULL
         AND (
           (cr.sunlight_level = 'High' AND r.window_direction IN ('North', 'North-East')) OR
           (cr.sunlight_level = 'Low' AND r.window_direction IN ('South', 'South-West'))
         )
       LIMIT 1`,
      [userId]
    );

    if (mismatchQuery.rows.length > 0) {
      const p = mismatchQuery.rows[0];
      const detail =
        p.sunlight_level === 'High'
          ? `requires strong light but sits in ${p.room_name} facing ${p.window_direction}. Consider moving it closer to a south or west exposure.`
          : `prefers low diffused light, but sits in ${p.room_name} facing ${p.window_direction} which may scorch foliage on bright afternoons.`;

      suggestions.push({
        id: `sug-light-${p.id}`,
        type: 'light_mismatch',
        title: `Light mismatch detected for ${p.nickname}`,
        description: `${p.nickname} (${p.species}) ${detail}`,
        action_label: 'Adjust Room',
        action_path: `/plants/${p.id}/edit`,
        plant_id: p.id,
        severity: 'warning',
      });
    }

    // 3. Neglected Plants Check: No care logs in > 25 days
    const neglectedQuery = await query(
      `SELECT p.id, p.nickname, p.species,
              MAX(l.date) as last_log_date,
              (CURRENT_DATE - COALESCE(MAX(l.date), p.created_at::date))::integer AS days_quiet
       FROM plants p
       LEFT JOIN log_book l ON p.id = l.plant_id
       WHERE p.user_id = $1
       GROUP BY p.id, p.nickname, p.species, p.created_at
       HAVING (CURRENT_DATE - COALESCE(MAX(l.date), p.created_at::date)) > 25
       ORDER BY days_quiet DESC
       LIMIT 1`,
      [userId]
    );

    if (neglectedQuery.rows.length > 0) {
      const np = neglectedQuery.rows[0];
      suggestions.push({
        id: `sug-neglected-${np.id}`,
        type: 'neglected',
        title: `Check in on ${np.nickname}`,
        description: `No care activity has been logged for ${np.nickname} in over ${np.days_quiet} days. Inspect the soil, check under leaves for pests, or log a quick dusting.`,
        action_label: 'Log Care',
        action_path: `/plants/${np.id}`,
        plant_id: np.id,
        severity: 'info',
      });
    }

    // 4. Seasonal Ambient Advice (determined from current calendar month)
    const currentMonth = new Date().getMonth(); // 0 = Jan, 11 = Dec
    let seasonalTip = {
      title: 'Spring Growth Acceleration',
      description: 'Lengthening days stimulate new leaf growth. Begin diluting balanced liquid fertilizer at half strength once every two waterings.',
    };

    if (currentMonth >= 5 && currentMonth <= 7) {
      seasonalTip = {
        title: 'Summer Heat & Hydration Check',
        description: 'Pots dry out 30-40% faster in summer heat. Check smaller terracotta planters every 3-4 days and protect tender leaves from intense midday glass magnification.',
      };
    } else if (currentMonth >= 8 && currentMonth <= 10) {
      seasonalTip = {
        title: 'Autumn Light Transition',
        description: 'As sun angles drop, shift tropical plants closer to windows. Dust foliage so leaves capture maximum indirect rays as day length shortens.',
      };
    } else if (currentMonth >= 11 || currentMonth <= 1) {
      seasonalTip = {
        title: 'Winter Rest & Dry Air Precaution',
        description: 'Indoor heaters reduce relative humidity. Keep plants away from heating vents, taper fertilizer, and allow soil to dry thoroughly between lighter waterings.',
      };
    }

    suggestions.push({
      id: 'sug-seasonal',
      type: 'seasonal',
      title: seasonalTip.title,
      description: seasonalTip.description,
      severity: 'info',
    });

    // 5. Cached 6-hour Gemini AI enhancement layer
    if (config.ai.enabled && config.ai.geminiApiKey) {
      try {
        const plantsSummaryRes = await query(
          `SELECT p.nickname, p.species, cr.water_frequency_days, cr.sunlight_level 
           FROM plants p 
           JOIN care_requirements cr ON p.care_requirement_id = cr.id 
           WHERE p.user_id = $1 LIMIT 5`,
          [userId]
        );

        if (plantsSummaryRes.rows.length > 0) {
          const plantList = plantsSummaryRes.rows
            .map((p) => `${p.nickname} (${p.species}, ${p.sunlight_level} light)`)
            .join(', ');

          const aiText = await getCachedAiSuggestion(userId, plantList);
          if (aiText) {
            suggestions.unshift({
              id: 'sug-ai-curated',
              type: 'ai',
              title: 'Personalized Botanical Insight',
              description: aiText,
              severity: 'info',
            });
          }
        }
      } catch (aiErr) {
        // Silently tolerate AI errors and proceed with rule-based suggestions
      }
    }

    res.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
