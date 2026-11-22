import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
  progress?: { current: number; total: number };
}

// Calculate light suitability score (0-100) based on plant requirements vs room window exposure
function calculatePlantLightSuitability(sunlightLevel: string, windowDirection?: string | null): number {
  if (!windowDirection || windowDirection === 'None') {
    return 70; // unassigned or windowless room baseline
  }

  const dir = windowDirection.toLowerCase();
  const req = sunlightLevel.toLowerCase();

  if (req === 'high') {
    if (dir.includes('south') || dir.includes('west')) return 100;
    if (dir.includes('east')) return 80;
    return 50; // north window is deficient for high-light plants
  }

  if (req === 'medium') {
    if (dir.includes('east') || dir.includes('west')) return 100;
    if (dir.includes('south') || dir.includes('north')) return 85;
    return 75;
  }

  if (req === 'low') {
    if (dir.includes('north') || dir.includes('east')) return 100;
    if (dir.includes('west')) return 70;
    if (dir.includes('south')) return 55; // harsh midday direct rays
    return 80;
  }

  return 80;
}

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    // 1. Fetch user plants joined with care requirements, rooms, and last watered date
    const plantsResult = await query(
      `SELECT p.id, p.nickname, p.species, cr.water_frequency_days, cr.sunlight_level, p.room_id,
              r.window_direction,
              TO_CHAR(p.created_at, 'YYYY-MM-DD') AS created_at,
              (SELECT MAX(date) FROM log_book WHERE plant_id = p.id AND action = 'Watered') AS last_watered_at
       FROM plants p
       JOIN care_requirements cr ON p.care_requirement_id = cr.id
       LEFT JOIN rooms r ON p.room_id = r.id
       WHERE p.user_id = $1`,
      [userId]
    );
    const plants = plantsResult.rows;

    // 2. Fetch care logs for user over the last 90 days only
    const logsResult = await query(
      `SELECT l.id, l.action AS action_type, TO_CHAR(l.date, 'YYYY-MM-DD') AS logged_at
       FROM log_book l
       JOIN plants p ON p.id = l.plant_id
       WHERE p.user_id = $1 AND l.date >= CURRENT_DATE - INTERVAL '90 days'
       ORDER BY l.date DESC`,
      [userId]
    );
    const logs = logsResult.rows;

    // 3. Fetch rooms
    const roomsResult = await query(
      `SELECT id, name, window_direction
       FROM rooms
       WHERE user_id = $1`,
      [userId]
    );
    const rooms = roomsResult.rows;

    // Calculate watering timeliness (treating never-watered plants using created_at as baseline)
    let overdueCount = 0;
    let dueSoonCount = 0;
    let hydratedCount = 0;
    const now = new Date();

    plants.forEach((plant) => {
      // Use last_watered_at if available; otherwise use created_at as the schedule baseline
      const baselineDateStr = plant.last_watered_at || plant.created_at;
      const baseline = new Date(baselineDateStr + 'T00:00:00');
      const nextDue = new Date(baseline.getTime() + plant.water_frequency_days * 24 * 60 * 60 * 1000);
      const diffHours = (nextDue.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) {
        overdueCount++;
      } else if (diffHours <= 48) {
        dueSoonCount++;
      } else {
        hydratedCount++;
      }
    });

    // Score calculations (0-100)
    // Watering score (45% weight)
    const totalPlants = plants.length;
    let wateringScore = 100;
    if (totalPlants > 0) {
      const penalty = (overdueCount * 25 + dueSoonCount * 5) / totalPlants;
      wateringScore = Math.max(10, Math.min(100, Math.round(100 - penalty)));
    }

    // Light suitability score (25% weight): computed from plant sunlight_level vs room window_direction
    let lightScore = 100;
    if (totalPlants > 0) {
      const totalLightPts = plants.reduce(
        (sum, p) => sum + calculatePlantLightSuitability(p.sunlight_level, p.window_direction),
        0
      );
      lightScore = Math.round(totalLightPts / totalPlants);
    }

    // Recency / Log Activity score (30% weight) based on real log recency
    const recentLogsCount = logs.filter((l) => {
      const logDate = new Date(l.logged_at + 'T00:00:00');
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 14;
    }).length;
    const activityScore = Math.min(100, Math.max(20, recentLogsCount * 12 + 25));

    // Composite Health Score
    const overallScore = totalPlants === 0
      ? 100
      : Math.round(wateringScore * 0.45 + lightScore * 0.25 + activityScore * 0.3);

    // Calculate real care streaks from logged dates
    const loggedDatesSet = new Set<string>();
    logs.forEach((l) => {
      if (l.logged_at) loggedDatesSet.add(l.logged_at);
    });

    const sortedDates = Array.from(loggedDatesSet).sort();

    // Compute real longest consecutive streak
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const curDate = new Date(dStr + 'T00:00:00');
      if (prevDate) {
        const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
      prevDate = curDate;
    }

    // Compute real current streak
    let currentStreak = 0;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    let checkDay: Date | null = null;
    if (loggedDatesSet.has(todayStr)) {
      checkDay = new Date(today);
    } else if (loggedDatesSet.has(yesterdayStr)) {
      checkDay = new Date(yesterday);
    }

    if (checkDay) {
      while (true) {
        const key = `${checkDay.getFullYear()}-${String(checkDay.getMonth() + 1).padStart(2, '0')}-${String(checkDay.getDate()).padStart(2, '0')}`;
        if (loggedDatesSet.has(key)) {
          currentStreak++;
          checkDay.setDate(checkDay.getDate() - 1);
        } else {
          break;
        }
      }
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Achievements calculation using real streaks and counts
    const achievements: Achievement[] = [
      {
        id: 'first_plant',
        title: 'First Green Pet',
        description: 'Added your very first plant companion to LeafPulse',
        icon: 'Sprout',
        unlocked: totalPlants >= 1,
        progress: { current: Math.min(1, totalPlants), total: 1 },
      },
      {
        id: 'habit_builder',
        title: 'Gentle Caretaker',
        description: 'Logged 5 or more plant care activities',
        icon: 'Droplets',
        unlocked: logs.length >= 5,
        progress: { current: Math.min(5, logs.length), total: 5 },
      },
      {
        id: 'green_sanctuary',
        title: 'Green Sanctuary',
        description: 'Cultivating 5 or more thriving plants in your home',
        icon: 'TreePine',
        unlocked: totalPlants >= 5,
        progress: { current: Math.min(5, totalPlants), total: 5 },
      },
      {
        id: 'room_architect',
        title: 'Sunlight Cartographer',
        description: 'Configured 2 or more rooms with window orientations',
        icon: 'Compass',
        unlocked: rooms.length >= 2,
        progress: { current: Math.min(2, rooms.length), total: 2 },
      },
      {
        id: 'consistent_pulse',
        title: 'Week of Life',
        description: 'Maintained a care streak of 3 consecutive days or more',
        icon: 'Award',
        unlocked: currentStreak >= 3 || longestStreak >= 3,
        progress: { current: Math.min(3, Math.max(currentStreak, longestStreak)), total: 3 },
      },
    ];

    // Practical Botanical Suggestions
    const suggestions: string[] = [];
    if (overdueCount > 0) {
      suggestions.push(
        `${overdueCount} plant${overdueCount > 1 ? 's are' : ' is'} due for deep root watering today.`
      );
    }
    if (rooms.length === 0) {
      suggestions.push(
        'Add your living spaces and window directions to receive tailored sunlight guidance.'
      );
    } else {
      suggestions.push(
        'Rotate potted plants a quarter turn every watering so foliage grows evenly toward natural light.'
      );
    }
    if (recentLogsCount === 0) {
      suggestions.push(
        'Record waterings or foliage health checks in your Care Log to build your garden history.'
      );
    }

    res.json({
      success: true,
      data: {
        score: overallScore,
        breakdown: {
          watering: wateringScore,
          light: lightScore,
          activity: activityScore,
        },
        counts: {
          total_plants: totalPlants,
          overdue: overdueCount,
          due_soon: dueSoonCount,
          hydrated: hydratedCount,
          total_logs: logs.length,
          total_rooms: rooms.length,
        },
        streak: {
          current: currentStreak,
          longest: longestStreak,
          total_actions: logs.length,
        },
        achievements,
        suggestions,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
