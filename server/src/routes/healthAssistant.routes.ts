import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { config } from '../config/env';

const router = Router();
router.use(requireAuth);

const symptomSchema = z.object({
  symptoms: z.array(z.string()).min(1, 'Please select at least one symptom'),
  plant_nickname: z.string().optional(),
  plant_species: z.string().optional(),
  notes: z.string().optional(),
  image: z.string().optional(),
});

interface DiagnosticResult {
  issue: string;
  confidence: 'High' | 'Medium' | 'Informational';
  explanation: string;
  primary_actions: string[];
  preventive_measures: string[];
}

function runBotanicalDiagnosis(symptoms: string[], plantSpecies?: string): DiagnosticResult {
  const set = new Set(symptoms.map((s) => s.toLowerCase()));

  // Overwatering & fungal check: soft_stems and mold_on_soil are strict indicators.
  // NEVER recommend dehydration / bottom soak when soft_stems or mold_on_soil is present.
  if (set.has('soft_stems') || set.has('mold_on_soil') || (set.has('yellow_leaves') && set.has('drooping'))) {
    const matchedCount = [
      set.has('soft_stems'),
      set.has('mold_on_soil'),
      set.has('yellow_leaves'),
      set.has('drooping'),
    ].filter(Boolean).length;
    return {
      issue: 'Overwatering & Root Suffocation',
      confidence: matchedCount >= 2 ? 'High' : 'Medium',
      explanation: 'Soggy soil or soft stems indicate root damage and fungal suffocation from excess moisture. Never bottom-soak a plant with soft stems or mold.',
      primary_actions: [
        'Stop watering immediately. Check drainage holes to ensure excess water is not trapped.',
        'Allow the soil to dry out thoroughly. If mold is present on the surface, gently scrape it off and improve air circulation.',
        'If stems remain soft or waterlogged for >4 days, unpot and inspect roots for brown/black mushy rot; trim and repot in fresh, well-draining soil.',
      ],
      preventive_measures: [
        'Always ensure planters have functional drainage holes.',
        'Wait until the top 25–50% of soil is dry before watering again.',
      ],
    };
  }

  if (set.has('pests') || set.has('webbing') || set.has('sticky_residue')) {
    const matchedCount = [
      set.has('pests'),
      set.has('webbing'),
      set.has('sticky_residue'),
    ].filter(Boolean).length;
    return {
      issue: 'Pest Infestation (Spider Mites / Scale / Aphids)',
      confidence: matchedCount >= 2 ? 'High' : 'Medium',
      explanation: 'Webbing, stippled spots, or sticky residue strongly suggest common indoor sap-sucking pests.',
      primary_actions: [
        'Isolate this plant immediately to prevent pest spread to neighboring greenery.',
        'Gently wash leaves with lukewarm water and a diluted insecticidal soap or neem oil spray.',
        'Wipe both the top and underside of every leaf with a soft microfiber cloth.',
      ],
      preventive_measures: [
        'Increase ambient humidity — spider mites thrive in warm, dry air.',
        'Inspect new plants thoroughly for 14 days before introducing them to your collection.',
      ],
    };
  }

  if (set.has('brown_crispy_tips') || set.has('curling_leaves')) {
    const matchedCount = [
      set.has('brown_crispy_tips'),
      set.has('curling_leaves'),
    ].filter(Boolean).length;
    return {
      issue: 'Low Ambient Humidity or Tap Water Minerals',
      confidence: matchedCount >= 2 ? 'High' : 'Medium',
      explanation: 'Crisp brown edges often occur when indoor air humidity drops below 40% or when fluoride and chlorine build up in foliage.',
      primary_actions: [
        'Trim dead brown tips with sterile shears, leaving a thin margin of brown to avoid live tissue wounding.',
        'Switch from hard municipal tap water to filtered, distilled, or rainwater.',
        'Group plants together or place on a shallow pebble tray filled with water to elevate local humidity.',
      ],
      preventive_measures: [
        'Keep plants away from heating vents, AC units, and drafty windows.',
        'Mist delicate foliage 2–3 times weekly during dry winter months.',
      ],
    };
  }

  // Dehydration check: ONLY if soft_stems and mold_on_soil are absent
  if (!set.has('soft_stems') && !set.has('mold_on_soil') && (set.has('drooping') || set.has('dry_soil'))) {
    const matchedCount = [
      set.has('drooping'),
      set.has('dry_soil'),
    ].filter(Boolean).length;
    return {
      issue: 'Dehydration / Underwatering',
      confidence: matchedCount >= 2 ? 'High' : 'Medium',
      explanation: 'Loss of turgor pressure causes leaves and stems to wilt when roots cannot absorb sufficient moisture from parched soil.',
      primary_actions: [
        'Perform a bottom-soak: place the pot in a bowl of lukewarm water for 20 minutes until the topsoil feels moist.',
        'Allow the pot to thoroughly drain before returning to its decorative saucer.',
      ],
      preventive_measures: [
        'Log watering consistently in LeafPulse to keep pace with your scheduled watering frequency.',
        'Check soil moisture more frequently during peak summer heat.',
      ],
    };
  }

  if (set.has('pale_leaves') || set.has('slow_growth') || set.has('leggy_stems')) {
    const matchedCount = [
      set.has('pale_leaves'),
      set.has('slow_growth'),
      set.has('leggy_stems'),
    ].filter(Boolean).length;
    return {
      issue: 'Light Deficiency & Nutrient Depletion',
      confidence: matchedCount >= 2 ? 'High' : 'Medium',
      explanation: 'Stretched (leggy) stems and faded or small new leaves indicate the plant is struggling to produce chlorophyll due to insufficient light.',
      primary_actions: [
        'Gradually transition the plant closer to an East- or South-facing window with bright indirect sunlight.',
        'Clean dust off leaves with a damp cloth so photosynthesis efficiency is maximized.',
        'Apply a balanced half-strength liquid houseplant fertilizer during active growing seasons.',
      ],
      preventive_measures: [
        'Rotate the pot 90 degrees every week so all foliage receives equal illumination.',
        'Use an LED grow light during darker winter months.',
      ],
    };
  }

  return {
    issue: 'General Environmental Stress',
    confidence: 'Informational',
    explanation: 'The observed symptoms indicate environmental acclimation or mild microclimate imbalance.',
    primary_actions: [
      'Check soil moisture with a moisture meter or finger test.',
      'Ensure room temperature stays consistent between 65–78°F (18–25°C).',
      'Avoid sudden relocations or temperature fluctuations.',
    ],
    preventive_measures: [
      'Record observations regularly in your LeafPulse Growth Journal to identify patterns.',
    ],
  };
}

// POST /health-assistant
router.post('/', validateBody(symptomSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { symptoms, plant_nickname, plant_species, notes } = req.body;

    const diagnosis = runBotanicalDiagnosis(symptoms, plant_species);

    res.json({
      success: true,
      data: {
        plant_nickname: plant_nickname || 'Plant',
        plant_species: plant_species || 'Indoor Variety',
        symptoms,
        notes: notes || null,
        diagnosis,
        disclaimer: 'Guidance provided by LeafPulse Botanical Diagnostics engine. Adjust care according to your local environment.',
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
