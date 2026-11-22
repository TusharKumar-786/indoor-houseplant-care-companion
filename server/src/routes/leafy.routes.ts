import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { query } from '../config/db';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { callGemini, GeminiMessage } from '../services/gemini.service';

const router = Router();
router.use(requireAuth);

// ── Per-user rate limit: 20 requests per 10 minutes ──────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<number, RateLimitEntry>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function checkRateLimit(userId: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

// ── Multilingual Fallback Alternatives for No-Repeat Rule ────────────────────
export const MULTILINGUAL_ALTERNATIVES: Record<DetectedLanguage, string[]> = {
  hindi: [
    'गमले की जल निकासी (drainage) का विशेष ध्यान रखें: पानी हमेशा तभी दें जब ऊपरी २ इंच मिट्टी सूख चुकी हो। इससे जड़ों को पर्याप्त ऑक्सीजन मिलती है।',
    'अधिकांश इनडोर पौधों के लिए चमकदार अप्रत्यक्ष रोशनी सबसे अच्छी होती है। सीधी तेज धूप से पत्तियां झुलस सकती हैं, इसलिए खिड़की पर हल्का पर्दा रखें।',
    'पौधों के पत्तों को महीने में एक बार गीले सूती कपड़े से साफ करें ताकि वे अच्छी तरह प्रकाश संश्लेषण (photosynthesis) कर सकें।',
    'सर्दियों में पौधों को कम पानी की आवश्यकता होती है क्योंकि वाष्पीकरण धीमा हो जाता है, जबकि गर्मियों में मिट्टी जल्दी सूखती है।',
  ],
  hinglish: [
    'Pot ki drainage ka khaas khayal rakhein: Paani hamesha tabhi dein jab top 2 inches mitti dry ho chuki ho. Isse roots ko oxygen milti hai.',
    'Indoor plants ke liye bright indirect sunlight best rehti hai. Direct tez dhoop se patte jal sakte hain, isliye gentle window spot chunein.',
    'Patton ko mahine mein ek baar damp cloth se gently wipe karein taaki dust hate aur plant efficiently photosynthesize kar sake.',
    'Winter season mein plants ko kam paani chahiye hota hai kyunki evaporation slow hota hai, jabki summer mein topsoil jaldi dry hoti hai.',
  ],
  english: [
    'Drainage integrity is fundamental: only water when the top two inches of potting mix feel dry to the touch, ensuring roots have adequate oxygen.',
    'Bright, indirect illumination works best for most domestic houseplants. Harsh direct rays can scorch foliage, so sheer curtains provide ideal filtering.',
    'Wipe broad foliage once a month with a soft, damp cloth to remove household dust and optimize natural photosynthesis.',
    'Adjust hydration across seasons: plants transpire slower in cool winters and require more frequent moisture checks during peak summer growth.',
  ],
};

const chatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(1000),
  history: z
    .array(
      z.object({
        sender: z.enum(['user', 'leafy']),
        text: z.string(),
      })
    )
    .optional(),
});

export type DetectedLanguage = 'hindi' | 'hinglish' | 'english';

/**
 * Detects whether the user is communicating in Hindi (Devanagari),
 * Hinglish (Romanized Hindi), or English.
 */
export function detectLanguage(text: string): DetectedLanguage {
  // 1. Hindi: Contains Devanagari script range (U+0900 to U+097F)
  if (/[\u0900-\u097F]/.test(text)) {
    return 'hindi';
  }

  // 2. Hinglish: Check for characteristic Romanized Hindi particles, verbs, pronouns, and keywords.
  // Note: Deliberately excludes English homographs like "the", "me", "to", "so", "he".
  const hinglishWords = [
    /\b(kya|kyu|kyun|kaise|kese|karu|karon|karein|kare|karo|karna|karenge)\b/i,
    /\b(paani|pani|mitti|dhoop|dhup|roshni|patte|patti|pattiyan|poda|paudha|paudhe|paudhon)\b/i,
    /\b(kitna|kitni|kitne|kab|kaha|kahan|kisko|kise)\b/i,
    /\b(isko|isse|iski|iske|iska|mera|mere|meri|humara|hume|aapke|aapko)\b/i,
    /\b(hai|hain|hein|hoga|hogi|honge|chahiye|hona)\b/i,
    /\b(batao|bataiye|dijiye|rakhein|rakhe|rakho|bachayein|bachao|dein|dena)\b/i,
    /\b(sukhi|sukha|peeli|peela|peele|kharab|sahi|thik|theek)\b/i,
    /\b(garmi|garmio|thandi|barsat|mausam)\b/i,
    /\b(aur\s+sunlight|aur\s+dhoop|aur\s+paani|dusra\s+plant|doosra\s+plant|dusre\s+plant)\b/i,
    /\b(hindi\s*me|hindi\s*mein|hinglish)\b/i,
  ];

  const lower = text.toLowerCase();
  const hasHinglish = hinglishWords.some((pattern) => pattern.test(lower));
  if (hasHinglish) {
    return 'hinglish';
  }

  return 'english';
}

/**
 * Non-botanical guard check using strict word boundaries (\b...\b) for Latin words
 * and substring checks for Devanagari words (where \b does not apply to non-ASCII scripts).
 * Ensures "selection" does not falsely match "election", "reaction" does not match "react", etc.
 */
export function isOffTopic(text: string): boolean {
  const offTopicLatin = [
    'write code',
    'python',
    'javascript',
    'typescript',
    'react',
    'c\\+\\+',
    'sql query',
    'crypto',
    'cryptocurrency',
    'bitcoin',
    'ethereum',
    'stock market',
    'election',
    'president',
    'politics',
    'football',
    'soccer',
    'cricket match',
    'nba',
    'homework',
    'pizza',
    'movie',
    'chunav',
    'rashtrapati',
    'rajniti',
    'pradhanmantri',
    'prime minister',
  ];

  const offTopicUnicode = [
    'चुनाव',
    'राष्ट्रपति',
    'राजनीति',
    'क्रिप्टो',
    'बिटकॉइन',
    'शेयर बाजार',
    'क्रिकेट मैच',
  ];

  // For Latin words, check with word boundary (\b)
  const matchesLatin = offTopicLatin.some((word) => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(text);
  });
  if (matchesLatin) return true;

  // For non-ASCII Unicode (Devanagari) words
  return offTopicUnicode.some((word) => text.includes(word));
}

/**
 * Formats client history and current user prompt into strictly alternating,
 * well-formed Gemini messages:
 * - Drops any leading model greeting so turn 1 is always 'user'.
 * - Merges consecutive identical roles if found so Gemini never receives duplicate turns.
 * - Appends current message as the final 'user' turn.
 * - Caps conversational turns to prevent exceeding context token budgets.
 */
export function formatGeminiContents(
  history: Array<{ sender: 'user' | 'leafy'; text: string }> | undefined,
  currentMessage: string
): GeminiMessage[] {
  const contents: GeminiMessage[] = [];

  if (history && Array.isArray(history)) {
    // Keep up to 10 most recent messages for coherent multiturn conversation
    const recent = history.slice(-10);

    for (const item of recent) {
      const text = item.text?.trim();
      if (!text) continue;
      const role: 'user' | 'model' = item.sender === 'user' ? 'user' : 'model';

      // Gemini requires the multi-turn session to begin with 'user'
      if (contents.length === 0 && role !== 'user') {
        continue;
      }

      // Gemini requires roles to strictly alternate
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        const prevParts = contents[contents.length - 1].parts;
        if (prevParts.length > 0 && 'text' in prevParts[0]) {
          prevParts[0].text += `\n${text}`;
        }
      } else {
        contents.push({
          role,
          parts: [{ text }],
        });
      }
    }
  }

  // Ensure alternation before adding current user prompt
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    const prevParts = contents[contents.length - 1].parts;
    if (prevParts.length > 0 && 'text' in prevParts[0]) {
      prevParts[0].text += `\n${currentMessage.trim()}`;
    }
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: currentMessage.trim() }],
    });
  }

  return contents;
}

/**
 * Multilingual botanical expert fallback when Gemini is disabled, times out, or fails.
 * Understands common follow-ups ("Is plan ko kaise follow karu?", "Kitna paani dena hai?",
 * "Aur sunlight?", "What about the second plant?") and responds in user's matching language.
 */
function getPrimaryBotanicalReply(message: string, lang: DetectedLanguage, userPlants: any[]): string {
  const lower = message.toLowerCase();

  // 1. Follow-up regarding the second plant
  const isSecondPlantQuery =
    lower.includes('second plant') ||
    lower.includes('dusra paudha') ||
    lower.includes('doosra plant') ||
    lower.includes('dusre plant') ||
    lower.includes('दूसरा पौधा') ||
    lower.includes('दूसरे पौधे');

  if (isSecondPlantQuery && userPlants && userPlants.length > 1) {
    const p2 = userPlants[1];
    if (lang === 'hindi') {
      return `आपके दूसरे पौधे ${p2.nickname} (${p2.species}) के लिए: इसे ${p2.sunlight_level} धूप पसंद है और हर ${p2.water_frequency_days} दिनों में पानी देना चाहिए। गमले में जल निकासी छेद (drainage holes) साफ रखें।`;
    }
    if (lang === 'hinglish') {
      return `Aapke doosre plant ${p2.nickname} (${p2.species}) ke liye: Isko ${p2.sunlight_level} sunlight chahiye aur har ${p2.water_frequency_days} dinon mein paani dena theek rahega. Pot mein drainage holes check karein aur mitti dry hone par hi paani dein.`;
    }
    return `For your second plant, ${p2.nickname} (${p2.species}), it prefers ${p2.sunlight_level} light and thrives when watered every ${p2.water_frequency_days} days. Ensure the pot has active drainage holes and allow the topsoil to dry before watering again.`;
  }

  // 2. Explicit request to explain in Hindi
  if (lower.includes('hindi') || lower.includes('हिंदी')) {
    return 'घरेलू इनडोर पौधों की देखभाल के मुख्य नियम: जब गमले की ऊपरी 1-2 इंच मिट्टी सूख जाए, तभी पानी दें। पौधों को सीधी तेज धूप के बजाय हल्की अप्रत्यक्ष धूप (bright indirect light) में रखें और गमले में जल निकासी का विशेष ध्यान रखें।';
  }

  // 3. Follow-up about following a care plan
  const isPlanQuery =
    lower.includes('plan') ||
    lower.includes('follow') ||
    lower.includes('kaise karu') ||
    lower.includes('kese karu') ||
    lower.includes('फॉलो');

  if (isPlanQuery) {
    if (lang === 'hindi') {
      return 'इस देखभाल योजना का पालन करने के 3 सरल नियम: 1) कैलेंडर के बजाय मिट्टी की ऊपरी 2 इंच सतह सूखने पर ही पानी दें। 2) पौधे को खिड़की के पास अच्छी अप्रत्यक्ष रोशनी में रखें। 3) ड्रेनेज होल से अतिरिक्त पानी निकलने दें ताकि जड़ें सुरक्षित रहें।';
    }
    if (lang === 'hinglish') {
      return 'Is plan ko follow karne ke liye 3 zaroori steps: 1) Fixed calendar ke bajaye jab topsoil dry lage tabhi paani dein. 2) Plant ko bright indirect light wali jagah par rakhein. 3) Drainage holes se excess paani nikalne dein taaki roots safe rahein.';
    }
    return 'To follow this care plan effectively: 1) Check topsoil dampness with your finger before each watering rather than following a strict calendar. 2) Keep your plant in steady bright indirect light. 3) Ensure excess water drains completely from the saucer to prevent root rot.';
  }

  // 4. Sunlight / window exposure query
  const isLightQuery =
    lower.includes('light') ||
    lower.includes('sun') ||
    lower.includes('window') ||
    lower.includes('dhoop') ||
    lower.includes('dhup') ||
    lower.includes('roshni') ||
    lower.includes('धूप') ||
    lower.includes('प्रकाश');

  if (isLightQuery) {
    if (lang === 'hindi') {
      return 'धूप और रोशनी के लिए: दक्षिण और पश्चिम खिड़कियां तेज सीधी धूप देती हैं, पूर्व खिड़की सुबह की कोमल धूप देती है, और उत्तर खिड़की हल्की अप्रत्यक्ष धूप प्रदान करती है। अधिकांश इनडोर पौधों के लिए चमकदार अप्रत्यक्ष धूप सबसे अच्छी होती है।';
    }
    if (lang === 'hinglish') {
      return 'Sunlight ke liye: South aur West windows se direct tezz dhoop aati hai, East window gentle subah ki dhoop deti hai jo foliage ke liye best hai, aur North window se mild indirect light milti hai. Direct tezz dhoop se patte jal sakte hain.';
    }
    return 'Window directions determine light intensity: South and West windows provide intense direct sun, East windows deliver gentle morning sun (ideal for Monsteras and Ferns), and North windows offer soft indirect illumination. Protect delicate leaves from harsh midday sun.';
  }

  // 5. Water / hydration query
  const isWaterQuery =
    lower.includes('water') ||
    lower.includes('paani') ||
    lower.includes('pani') ||
    lower.includes('drench') ||
    lower.includes('soak') ||
    lower.includes('पानी') ||
    lower.includes('सींचना');

  if (isWaterQuery) {
    if (lang === 'hindi') {
      return 'पानी देने का सही तरीका: गमले की ऊपरी 1 से 2 इंच मिट्टी में उंगली डालकर देखें। जब मिट्टी सूखी महसूस हो, तभी अच्छी तरह से पानी दें जब तक कि वह नीचे के छेदों से बाहर न निकलने लगे। निचली प्लेट का अतिरिक्त पानी फेंक दें।';
    }
    if (lang === 'hinglish') {
      return 'Paani dene ka golden rule: Fixed schedule ke bajaye pot ki top 1-2 inches mitti dry hone par hi deep watering karein. Jab bottom drainage holes se paani nikalne lage, tab saucer ka extra paani hata dein taaki root rot na ho.';
    }
    return 'Rather than sticking strictly to a calendar day, water when the top 1 to 2 inches of potting mix have dried out. Always water until moisture runs freely from bottom drainage holes, then discard excess runoff.';
  }

  // 6. Seasonal / summer query
  const isSummerQuery =
    lower.includes('summer') ||
    lower.includes('garmi') ||
    lower.includes('garmio') ||
    lower.includes('मौसम') ||
    lower.includes('गर्मी');

  if (isSummerQuery) {
    if (lang === 'hindi') {
      return 'गर्मियों में पौधों की देखभाल: तापमान बढ़ने पर मिट्टी तेजी से सूखती है, इसलिए नमी की नियमित जांच करें। नाजुक पौधों को तेज सीधी धूप से दूर रखें और पत्तियों को नम रखने के लिए आसपास नमी बढ़ाएं।';
    }
    if (lang === 'hinglish') {
      return 'Summer season mein care: Garmiyon mein evaporation badh jata hai, isliye soil moisture zyada frequently check karein. Plants ko AC vents aur direct scorching dhoop se bacha kar bright indirect light mein rakhein.';
    }
    return 'During warm summer months, evaporation increases so monitor soil moisture more frequently. Shield delicate leaves from scorching afternoon glass and group foliage to preserve ambient humidity.';
  }

  // 7. Yellow leaves / drooping query
  const isYellowQuery =
    lower.includes('yellow') ||
    lower.includes('peeli') ||
    lower.includes('peele') ||
    lower.includes('peela') ||
    lower.includes('पीली') ||
    lower.includes('पीले');

  if (isYellowQuery) {
    if (lang === 'hindi') {
      return 'पत्तियों का पीला होना मुख्य रूप से अधिक पानी (overwatering) या खराब जल निकासी के कारण होता है। 2 इंच नीचे मिट्टी की जांच करें—यदि मिट्टी गीली है, तो पानी देना रोकें और ड्रेनेज होल साफ रखें।';
    }
    if (lang === 'hinglish') {
      return 'Patte peele hona aamtaur par overwatering ya soggy soil ki wajah se hota hai. Mitti mein 2 inch ungli daal kar dekhein—agar mitti geeli hai toh paani band karein aur pot ke drainage holes check karein.';
    }
    return 'Yellow leaves typically stem from moisture imbalance, natural aging, or low light. Feel the soil 2 inches below the surface; if wet, hold watering and verify drainage holes are unobstructed.';
  }

  // 8. Pest query
  const isPestQuery =
    lower.includes('pest') ||
    lower.includes('bug') ||
    lower.includes('mite') ||
    lower.includes('keede') ||
    lower.includes('keeda') ||
    lower.includes('कीट') ||
    lower.includes('कीड़े');

  if (isPestQuery) {
    if (lang === 'hindi') {
      return 'कीटों से बचाव: पौधे को तुरंत अन्य पौधों से अलग करें। पत्तियों के दोनों ओर हल्के नीम के तेल या साबुन के घोल से पोछें।';
    }
    if (lang === 'hinglish') {
      return 'Keedon se bachav ke liye: Affected plant ko isolate karein. Neem oil spray ya mild sabun ke paani se patton ke aage aur peeche microfiber cloth se wipe karein.';
    }
    return 'Isolate the affected plant immediately. Wipe both sides of foliage using a soft cloth dampened with diluted neem oil or mild horticultural soap.';
  }

  // 9. Match user registered plant nickname
  if (userPlants && userPlants.length > 0) {
    const matched = userPlants.find(
      (p) => lower.includes(p.nickname.toLowerCase()) || lower.includes(p.species.toLowerCase())
    );
    if (matched) {
      if (lang === 'hindi') {
        return `आपके ${matched.nickname} (${matched.species}) के लिए: इसे ${matched.sunlight_level} धूप पसंद है और हर ${matched.water_frequency_days} दिनों में पानी देना चाहिए। गमले में उचित जल निकासी रखें।`;
      }
      if (lang === 'hinglish') {
        return `Aapke ${matched.nickname} (${matched.species}) ke liye: Isko ${matched.sunlight_level} light chahiye aur har ${matched.water_frequency_days} dinon mein paani dena theek rehta hai. Excess paani drain hone dein.`;
      }
      return `For your ${matched.nickname} (${matched.species}), it prefers ${matched.sunlight_level} light and thrives when watered every ${matched.water_frequency_days} days. Ensure clean drainage and wipe foliage monthly.`;
    }
  }

  // Default general advice
  if (lang === 'hindi') {
    return 'इनडोर पौधों के स्वस्थ विकास के लिए: मिट्टी की ऊपरी 1-2 इंच सतह सूखने पर ही पानी दें, गमले में ड्रेनेज होल रखें, और पौधों को अच्छी अप्रत्यक्ष रोशनी में रखें।';
  }
  if (lang === 'hinglish') {
    return 'Indoor houseplants ke liye basic golden rules: Well-draining soil mix use karein, pots mein drainage holes rakhein, aur topsoil dry hone par hi paani dein. Steady indirect sunlight plants ko healthy rakhti hai.';
  }
  return 'For indoor houseplants, stability is key: ensure well-aerated potting mix with perlite, pots with drainage holes, and steady indirect illumination. Check topsoil moisture before every watering rather than adhering strictly to a rigid calendar.';
}

export function generateBotanicalFallback(
  message: string,
  userPlants: any[],
  history?: Array<{ sender: 'user' | 'leafy'; text: string }>
): string {
  const lang = detectLanguage(message);
  const candidate = getPrimaryBotanicalReply(message, lang, userPlants);

  // Strict No-Repeat Rule: Never return the same text twice in a row in one conversation
  const lastLeafyText = history && Array.isArray(history)
    ? [...history].reverse().find((m) => m.sender === 'leafy')?.text?.trim()
    : undefined;

  if (lastLeafyText && candidate.trim() === lastLeafyText) {
    const alts = MULTILINGUAL_ALTERNATIVES[lang];
    const diffAlt = alts.find((a) => a.trim() !== lastLeafyText) || alts[0];
    return diffAlt;
  }

  return candidate;
}

router.post('/', validateBody(chatSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { message, history } = req.body;
    const lang = detectLanguage(message);

    // Per-user rate limit check
    if (!checkRateLimit(userId)) {
      return res.status(429).json({
        success: false,
        message: 'Rate limit reached. Please wait a few minutes before asking again.',
      });
    }

    // Strict botanical scope guard
    if (isOffTopic(message)) {
      let refusal = '';
      if (lang === 'hindi') {
        refusal =
          'मैं लीफ़ी हूँ, आपका इनडोर प्लांट केयर साथी। मैं केवल पौधों की देखभाल, पानी, मिट्टी, धूप, खाद और कीटों से संबंधित सहायता कर सकता हूँ। कृपया अपने पौधों से संबंधित प्रश्न पूछें।';
      } else if (lang === 'hinglish') {
        refusal =
          'Main Leafy hoon, aapka indoor plant care assistant. Main sirf paudhon ki dekhbhal, paani, mitti, dhoop aur keedon se judi botanical madad kar sakta hoon. Kripya apne houseplants ke baare mein sawaal poochein.';
      } else {
        refusal =
          'I am Leafy, your dedicated indoor plant care companion. I can only assist with botanical care, watering, soil mixes, sunlight requirements, pest control, and keeping your houseplants healthy. Please feel free to ask anything about your domestic plants.';
      }

      return res.json({
        success: true,
        data: {
          reply: refusal,
          is_botanical: false,
        },
      });
    }

    // Retrieve user plants and rooms for personalized botanical context
    const plantsResult = await query(
      `SELECT p.nickname, p.species, cr.sunlight_level, cr.water_frequency_days,
              (SELECT MAX(date) FROM log_book WHERE plant_id = p.id AND action = 'Watered') AS last_watered
       FROM plants p
       JOIN care_requirements cr ON p.care_requirement_id = cr.id
       WHERE p.user_id = $1
       ORDER BY p.id ASC
       LIMIT 10`,
      [userId]
    );

    const roomsResult = await query(
      `SELECT name, window_direction
       FROM rooms
       WHERE user_id = $1
       ORDER BY id ASC
       LIMIT 10`,
      [userId]
    );

    const userPlants = plantsResult.rows;
    const userRooms = roomsResult.rows;

    const plantListSummary = userPlants
      .map(
        (p, idx) =>
          `Plant ${idx + 1}: ${p.nickname} (${p.species}), needs ${p.sunlight_level} light, watered every ${p.water_frequency_days} days${p.last_watered ? `, last watered on ${p.last_watered}` : ''}`
      )
      .join('\n');

    const roomListSummary = userRooms
      .map((r) => `- ${r.name}: ${r.window_direction || 'Standard'}-facing window exposure`)
      .join('\n');

    // Attempt answering via Gemini first with strict multilingual and context rules
    const systemInstruction = `You are Leafy, an expert houseplant horticulturist and friendly botanical care assistant for LeafPulse.

CRITICAL LANGUAGE INSTRUCTIONS (MANDATORY):
1. Always respond in the EXACT same language and dialect as the user's latest message:
   - HINDI (Devanagari script): If the user writes in Hindi (e.g. 'मेरे पौधे को कितना पानी चाहिए?', 'धूप कितनी देनी है?'), reply strictly in natural, polite Hindi in Devanagari script.
   - HINGLISH (Romanized Hindi): If the user writes in Hinglish (e.g. 'Mere plant ko kitna paani dena chahiye?', 'Is plan ko kaise follow karu?', 'Aur sunlight?', 'Isko summer mein kya karna chahiye?'), reply strictly in natural, conversational Hinglish (e.g. 'Aapko is plan ko follow karne ke liye top 2 inches mitti dry hone par hi paani dena hai...').
   - ENGLISH: If the user writes in English, reply in warm, clear, professional English.
2. The language of the user's LATEST message ALWAYS determines your response language.
3. Language switching:
   - If previous messages were in English and the user now writes in Hindi or Hinglish (or says 'Explain this in Hindi' / 'Isko Hindi me batao'), immediately switch your response to match their latest language request.
   - If previous messages were in Hindi or Hinglish and the user now writes in English, immediately switch to English.
   - In all cases, maintain full conversation context and continuity from previous messages (e.g. which plant was being discussed, previous watering advice, diagnosis, or room placement).
4. NEVER default to English when the user communicates in Hindi or Hinglish.
5. Retain accuracy of plant common names, botanical species (e.g. Monstera deliciosa, Epipremnum aureum, Sansevieria trifasciata), and technical horticultural terms across all languages.
6. Keep explanations simple, friendly, actionable, and encouraging for apartment plant owners.

STRICT BOTANICAL & SAFETY RULES:
1. You ONLY discuss houseplants, indoor gardening, soil mixes, watering schedules, sunlight, humidity, fertilizer, repotting, pest control, and botanical troubleshooting.
2. If asked about non-plant topics, politely refuse in the user's current language and guide them back to their plants.
3. Absolutely NO emojis anywhere in your response.
4. Keep advice concise, actionable, and grounded in real horticulture physics (e.g. soil drainage, transpiration, aeration, perched water tables).
5. Address the user's specific collection and rooms whenever relevant:
User's collection:
${plantListSummary || 'No plants registered yet.'}
User's rooms:
${roomListSummary || 'No rooms registered yet.'}`;

    // Format conversation history ensuring Gemini multiturn compliance
    const contents: GeminiMessage[] = formatGeminiContents(history, message);

    const aiReply = await callGemini({
      systemInstruction,
      contents,
      temperature: 0.35,
      maxOutputTokens: 1024,
    });

    if (aiReply) {
      // Check if Gemini returned the rate-limit friendly message
      if (aiReply.includes('too many questions') || aiReply.includes('wait a minute')) {
        return res.status(429).json({
          success: false,
          message: aiReply,
        });
      }
      // Clean accidental emojis
      const cleanReply = aiReply.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').trim();
      return res.json({
        success: true,
        data: { reply: cleanReply, is_botanical: true, is_fallback: false },
      });
    }

    // Intelligent Botanical Expert Engine Fallback (guaranteed no-repeat & language matching)
    const fallbackReply = generateBotanicalFallback(message, userPlants, history);

    return res.json({
      success: true,
      data: { reply: fallbackReply, is_botanical: true, is_fallback: true },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
